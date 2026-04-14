"""
Cliente SOAP para Web Services DIAN - Facturación Electrónica
Usa codeflexDian para WS-Security (BinarySecurityToken) en el header SOAP
Según Anexo Técnico 1.9 - Resolución 000165 de 2023
"""
import base64
import os
import zipfile
import io
import requests
import urllib3
from lxml import etree

from codeflexDian.Signing import Signing
from codeflexDian.SOAPSing import SOAPSing

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# v1.2.0 - WS-Security con codeflexDian

DIAN_URL_PRUEBAS    = "https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc"
DIAN_URL_PRODUCCION = "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc"

AMBIENTE    = os.getenv("DIAN_AMBIENTE", "2")
TEST_SET_ID = os.getenv("DIAN_TEST_SET_ID", "29982673-c13e-4fec-a6c1-c2cfd452c2b4")
NIT_EMISOR  = "902051708"

P12_PATH     = os.getenv("DIAN_P12_PATH", "/app/certs/certificado.pfx")
P12_PASSWORD = os.getenv("DIAN_P12_PASSWORD", "3CpnXqACYE")


def get_url():
    return DIAN_URL_PRUEBAS if AMBIENTE == "2" else DIAN_URL_PRODUCCION


def xml_a_zip_base64(xml_string: str, nombre_archivo: str) -> str:
    """Convierte XML a ZIP en base64 para enviar a DIAN"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{nombre_archivo}.xml", xml_string.encode('utf-8'))
    zip_buffer.seek(0)
    return base64.b64encode(zip_buffer.read()).decode('utf-8')


def construir_body_send_test_set(zip_b64: str, nombre_zip: str) -> etree._Element:
    """Construye el nodo Body para SendTestSetAsync"""
    NS_WCF = "http://wcf.dian.colombia"
    body_content = etree.Element(f"{{{NS_WCF}}}SendTestSetAsync")
    etree.SubElement(body_content, f"{{{NS_WCF}}}fileName").text = nombre_zip
    etree.SubElement(body_content, f"{{{NS_WCF}}}contentFile").text = zip_b64
    etree.SubElement(body_content, f"{{{NS_WCF}}}testSetId").text = TEST_SET_ID.strip()
    return body_content


def construir_body_send_bill_sync(zip_b64: str, nombre_zip: str) -> etree._Element:
    """Construye el nodo Body para SendBillSync"""
    NS_WCF = "http://wcf.dian.colombia"
    body_content = etree.Element(f"{{{NS_WCF}}}SendBillSync")
    etree.SubElement(body_content, f"{{{NS_WCF}}}fileName").text = nombre_zip
    etree.SubElement(body_content, f"{{{NS_WCF}}}contentFile").text = zip_b64
    return body_content


def enviar_factura_dian(xml_string: str, numero_completo: str, nit_emisor: str = NIT_EMISOR) -> dict:
    """Envía la factura al Web Service de la DIAN con WS-Security"""
    try:
        print(f"📤 Enviando {numero_completo} a DIAN (ambiente: {AMBIENTE})...")

        nombre_zip = f"{numero_completo}.zip"
        zip_b64 = xml_a_zip_base64(xml_string, numero_completo)

        # Cargar certificado para firma WS-Security
        signing = Signing(P12_PATH, P12_PASSWORD)
        print(f"✅ Certificado cargado para WS-Security")

        # Construir body según ambiente
        if AMBIENTE == "2":
            action = "SendTestSetAsync"
            body_node = construir_body_send_test_set(zip_b64, nombre_zip)
        else:
            action = "SendBillSync"
            body_node = construir_body_send_bill_sync(zip_b64, nombre_zip)

        # Firmar envelope SOAP con WS-Security
        soap_signer = SOAPSing(signing, action)
        envelope = soap_signer.sing(body_node)

        # Serializar envelope firmado
        soap_xml = etree.tostring(envelope, pretty_print=False, xml_declaration=True, encoding='UTF-8')

        # Enviar al Web Service
        url = get_url()
        headers = {
            'Content-Type': 'application/soap+xml;charset=UTF-8',
            'SOAPAction': f'http://wcf.dian.colombia/IWcfDianCustomerServices/{action}'
        }

        response = requests.post(
            url,
            data=soap_xml,
            headers=headers,
            verify=False,
            timeout=60
        )

        print(f"📥 Respuesta DIAN HTTP {response.status_code} para {numero_completo}")
        response_text = response.text[:500]
        print(f"   Respuesta: {response_text}")

        if response.status_code != 200:
            return {
                "exito": False,
                "estado": "Error",
                "mensaje": f"HTTP {response.status_code}: {response_text}",
                "xml_respuesta": response.text
            }

        # Parsear respuesta
        xml_respuesta = response.text

        # Buscar ZipKey en la respuesta
        if "ZipKey" in xml_respuesta or "zipKey" in xml_respuesta:
            try:
                root = etree.fromstring(response.content)
                zip_key_nodes = root.findall(".//{http://wcf.dian.colombia}ZipKey") or \
                                root.findall(".//{*}ZipKey")
                zip_key = zip_key_nodes[0].text if zip_key_nodes else None
                if zip_key:
                    return {
                        "exito": True,
                        "estado": "Enviada",
                        "mensaje": f"Recibida por DIAN. ZipKey: {zip_key}",
                        "xml_respuesta": xml_respuesta,
                        "zip_key": zip_key
                    }
            except Exception:
                pass

        if "Aceptada" in xml_respuesta or "aceptada" in xml_respuesta:
            return {"exito": True, "estado": "Aceptada", "mensaje": "Factura aceptada por la DIAN", "xml_respuesta": xml_respuesta}
        elif "Rechazada" in xml_respuesta or "rechazada" in xml_respuesta:
            return {"exito": False, "estado": "Rechazada", "mensaje": f"Rechazada: {xml_respuesta[:300]}", "xml_respuesta": xml_respuesta}
        elif "error" in xml_respuesta.lower() or "fault" in xml_respuesta.lower():
            return {"exito": False, "estado": "Error", "mensaje": xml_respuesta[:300], "xml_respuesta": xml_respuesta}
        else:
            return {"exito": True, "estado": "Enviada", "mensaje": f"Enviada: {xml_respuesta[:200]}", "xml_respuesta": xml_respuesta}

    except Exception as e:
        print(f"❌ Error enviando a DIAN: {e}")
        import traceback
        traceback.print_exc()
        return {"exito": False, "estado": "Error", "mensaje": f"Error: {str(e)}", "xml_respuesta": ""}


def consultar_estado_zip(zip_key: str) -> dict:
    """Consulta el estado de un ZIP enviado a la DIAN por ZipKey"""
    try:
        signing = Signing(P12_PATH, P12_PASSWORD)

        NS_WCF = "http://wcf.dian.colombia"
        body_content = etree.Element(f"{{{NS_WCF}}}GetStatusZip")
        etree.SubElement(body_content, f"{{{NS_WCF}}}trackId").text = zip_key

        soap_signer = SOAPSing(signing, "GetStatusZip")
        envelope = soap_signer.sing(body_content)
        soap_xml = etree.tostring(envelope, pretty_print=False, xml_declaration=True, encoding='UTF-8')

        response = requests.post(
            get_url(),
            data=soap_xml,
            headers={'Content-Type': 'application/soap+xml;charset=UTF-8'},
            verify=False,
            timeout=30
        )
        return {"exito": True, "respuesta": response.text}
    except Exception as e:
        return {"exito": False, "error": str(e)}


def consultar_estado_factura(cufe: str) -> dict:
    """Consulta el estado de una factura en la DIAN por CUFE"""
    try:
        signing = Signing(P12_PATH, P12_PASSWORD)

        NS_WCF = "http://wcf.dian.colombia"
        body_content = etree.Element(f"{{{NS_WCF}}}GetStatus")
        etree.SubElement(body_content, f"{{{NS_WCF}}}trackId").text = cufe

        soap_signer = SOAPSing(signing, "GetStatus")
        envelope = soap_signer.sing(body_content)
        soap_xml = etree.tostring(envelope, pretty_print=False, xml_declaration=True, encoding='UTF-8')

        response = requests.post(
            get_url(),
            data=soap_xml,
            headers={'Content-Type': 'application/soap+xml;charset=UTF-8'},
            verify=False,
            timeout=30
        )
        return {"exito": True, "respuesta": response.text}
    except Exception as e:
        return {"exito": False, "error": str(e)}
