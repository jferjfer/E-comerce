"""
Cliente SOAP para Web Services DIAN - Facturación Electrónica
Según Anexo Técnico 1.9 - Resolución 000165 de 2023
Sección 7.9.2: El header SOAP va VACÍO — no requiere WS-Security
El testSetId va en el BODY del mensaje
"""
import base64
import os
import zipfile
import io
from zeep import Client
from zeep.transports import Transport
import requests
import urllib3

# v1.1.0 - Sin WS-Security segun Anexo 1.9
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DIAN_WSDL_PRUEBAS    = "https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl"
DIAN_WSDL_PRODUCCION = "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl"

AMBIENTE    = os.getenv("DIAN_AMBIENTE", "2")
TEST_SET_ID = os.getenv("DIAN_TEST_SET_ID", "29982673-c13e-4fec-a6c1-c2cfd452c2b4")
NIT_EMISOR  = "902051708"


def get_wsdl_url():
    return DIAN_WSDL_PRUEBAS if AMBIENTE == "2" else DIAN_WSDL_PRODUCCION


def crear_cliente():
    """
    Crea cliente SOAP SIN WS-Security.
    Según Anexo 1.9 sección 7.9.2, el header SOAP va vacío <soap:Header/>
    La autenticación es por testSetId en el body.
    """
    session = requests.Session()
    session.verify = False
    transport = Transport(session=session, timeout=60)
    client = Client(get_wsdl_url(), transport=transport)
    print("✅ Cliente SOAP DIAN creado (sin WS-Security, según Anexo 1.9)")
    return client


def xml_a_zip_base64(xml_string: str, nombre_archivo: str) -> str:
    """Convierte XML a ZIP en base64 para enviar a DIAN"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{nombre_archivo}.xml", xml_string.encode('utf-8'))
    zip_buffer.seek(0)
    return base64.b64encode(zip_buffer.read()).decode('utf-8')


def enviar_factura_dian(xml_string: str, numero_completo: str, nit_emisor: str = NIT_EMISOR) -> dict:
    """Envía la factura al Web Service de la DIAN"""
    try:
        print(f"📤 Enviando {numero_completo} a DIAN (ambiente: {AMBIENTE})...")

        nombre_zip = f"{numero_completo}.zip"
        zip_b64 = xml_a_zip_base64(xml_string, numero_completo)
        client = crear_cliente()

        if AMBIENTE == "2":
            response = client.service.SendTestSetAsync(
                fileName=nombre_zip,
                contentFile=zip_b64,
                testSetId=TEST_SET_ID.strip()
            )
        else:
            response = client.service.SendBillSync(
                fileName=nombre_zip,
                contentFile=zip_b64
            )

        print(f"📥 Respuesta DIAN para {numero_completo}: {str(response)[:300]}")

        if response is None:
            return {"exito": True, "estado": "Enviada", "mensaje": "Enviada a DIAN", "xml_respuesta": ""}

        xml_respuesta = str(response)

        # Verificar ZipKey — indica que la DIAN recibió y procesará el documento
        zip_key = getattr(response, 'ZipKey', None) or getattr(response, 'zipKey', None)
        if zip_key:
            return {
                "exito": True,
                "estado": "Enviada",
                "mensaje": f"Recibida por DIAN. ZipKey: {zip_key}",
                "xml_respuesta": xml_respuesta,
                "zip_key": str(zip_key)
            }

        if "Aceptada" in xml_respuesta or "aceptada" in xml_respuesta:
            return {"exito": True, "estado": "Aceptada", "mensaje": "Factura aceptada por la DIAN", "xml_respuesta": xml_respuesta}
        elif "Rechazada" in xml_respuesta or "rechazada" in xml_respuesta:
            return {"exito": False, "estado": "Rechazada", "mensaje": f"Rechazada: {xml_respuesta[:300]}", "xml_respuesta": xml_respuesta}
        else:
            return {"exito": True, "estado": "Enviada", "mensaje": f"Enviada: {xml_respuesta[:200]}", "xml_respuesta": xml_respuesta}

    except Exception as e:
        print(f"❌ Error enviando a DIAN: {e}")
        return {"exito": False, "estado": "Error", "mensaje": f"Error: {str(e)}", "xml_respuesta": ""}


def consultar_estado_zip(zip_key: str) -> dict:
    """Consulta el estado de un ZIP enviado a la DIAN por ZipKey"""
    try:
        client = crear_cliente()
        response = client.service.GetStatusZip(trackId=zip_key)
        return {"exito": True, "respuesta": str(response)}
    except Exception as e:
        return {"exito": False, "error": str(e)}


def consultar_estado_factura(cufe: str) -> dict:
    """Consulta el estado de una factura en la DIAN por CUFE"""
    try:
        client = crear_cliente()
        response = client.service.GetStatus(trackId=cufe)
        return {"exito": True, "respuesta": str(response)}
    except Exception as e:
        return {"exito": False, "error": str(e)}
