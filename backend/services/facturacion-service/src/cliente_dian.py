"""
Cliente SOAP para Web Services DIAN - Facturación Electrónica
Con WS-Security (firma del mensaje SOAP con certificado digital)
URL Pruebas: https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc
URL Producción: https://vpfe.dian.gov.co/WcfDianCustomerServices.svc
"""
import base64
import os
import zipfile
import io
import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from lxml import etree
from zeep import Client
from zeep.transports import Transport
from zeep.wsse import UsernameToken
import requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
import cryptography.hazmat.primitives.serialization.pkcs12 as pkcs12

DIAN_WSDL_PRUEBAS    = "https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl"
DIAN_WSDL_PRODUCCION = "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl"

AMBIENTE     = os.getenv("DIAN_AMBIENTE", "2")
TEST_SET_ID  = os.getenv("DIAN_TEST_SET_ID", "c5f5fbef-6621-420b-b986-857b2f1588d5")
SOFTWARE_ID  = os.getenv("DIAN_SOFTWARE_ID", "b7249493-84cf-430c-be82-64c830a2158c")
P12_PATH     = os.getenv("DIAN_P12_PATH", "/app/certs/certificado.pfx")
P12_PASSWORD = os.getenv("DIAN_P12_PASSWORD", "")
NIT_EMISOR   = "900205170"

# Namespaces WS-Security
NS_WSSE  = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
NS_WSU   = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
NS_DS    = "http://www.w3.org/2000/09/xmldsig#"
NS_SOAP  = "http://www.w3.org/2003/05/soap-envelope"

def get_wsdl_url():
    return DIAN_WSDL_PRUEBAS if AMBIENTE == "2" else DIAN_WSDL_PRODUCCION

def cargar_certificado():
    """Carga el certificado PFX y retorna (private_key, certificate, cert_b64)"""
    try:
        with open(P12_PATH, "rb") as f:
            p12_data = f.read()
        private_key, certificate, _ = pkcs12.load_key_and_certificates(
            p12_data, P12_PASSWORD.encode(), default_backend()
        )
        cert_der = certificate.public_bytes(serialization.Encoding.DER)
        cert_b64 = base64.b64encode(cert_der).decode()
        return private_key, certificate, cert_b64
    except Exception as e:
        print(f"❌ Error cargando certificado para WS-Security: {e}")
        return None, None, None

def construir_wssecurity_header(private_key, cert_b64: str) -> etree._Element:
    """
    Construye el header WS-Security con BinarySecurityToken y firma digital
    según el estándar requerido por la DIAN
    """
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=5)
    created = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    expired = expires.strftime("%Y-%m-%dT%H:%M:%SZ")
    token_id = f"SecurityToken-{uuid.uuid4()}"

    security = etree.Element(f"{{{NS_WSSE}}}Security", nsmap={
        "wsse": NS_WSSE,
        "wsu": NS_WSU,
        "ds": NS_DS
    })
    security.set(f"{{{NS_SOAP}}}mustUnderstand", "1")

    # Timestamp
    ts = etree.SubElement(security, f"{{{NS_WSU}}}Timestamp")
    ts.set(f"{{{NS_WSU}}}Id", f"TS-{uuid.uuid4()}")
    etree.SubElement(ts, f"{{{NS_WSU}}}Created").text = created
    etree.SubElement(ts, f"{{{NS_WSU}}}Expires").text = expired

    # BinarySecurityToken
    bst = etree.SubElement(security, f"{{{NS_WSSE}}}BinarySecurityToken")
    bst.set("EncodingType", "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary")
    bst.set("ValueType", "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3")
    bst.set(f"{{{NS_WSU}}}Id", token_id)
    bst.text = cert_b64

    return security

def xml_a_zip_base64(xml_string: str, nombre_archivo: str) -> str:
    """Convierte XML a ZIP en base64 para enviar a DIAN"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{nombre_archivo}.xml", xml_string.encode('utf-8'))
    zip_buffer.seek(0)
    return base64.b64encode(zip_buffer.read()).decode('utf-8')

def enviar_factura_dian(xml_string: str, numero_completo: str, nit_emisor: str = NIT_EMISOR) -> dict:
    """
    Envía la factura al Web Service de la DIAN con WS-Security
    """
    try:
        print(f"📤 Enviando {numero_completo} a DIAN (ambiente: {AMBIENTE})...")

        zip_b64 = xml_a_zip_base64(xml_string, numero_completo)

        # Cargar certificado para WS-Security
        private_key, certificate, cert_b64 = cargar_certificado()

        session = requests.Session()
        session.verify = False
        transport = Transport(session=session, timeout=60)

        client = Client(get_wsdl_url(), transport=transport)

        # Construir header WS-Security
        if private_key and cert_b64:
            wsse_header = construir_wssecurity_header(private_key, cert_b64)
            # Inyectar header en el cliente zeep
            from zeep.plugins import HistoryPlugin
            from zeep.wsse.signature import BinarySignature

            try:
                # Usar BinarySignature de zeep para firmar el mensaje SOAP
                wsse = BinarySignature(P12_PATH, P12_PASSWORD)
                client_con_wsse = Client(get_wsdl_url(), transport=transport, wsse=wsse)
                use_client = client_con_wsse
                print("✅ WS-Security configurado con BinarySignature")
            except Exception as e:
                print(f"⚠️ BinarySignature falló ({e}), usando cliente sin firma SOAP")
                use_client = client
        else:
            use_client = client
            print("⚠️ Sin certificado — enviando sin WS-Security")

        # Enviar según ambiente
        if AMBIENTE == "2":
            response = use_client.service.SendTestSetAsync(
                fileName=f"{numero_completo}.zip",
                contentFile=zip_b64,
                testSetId=TEST_SET_ID
            )
        else:
            response = use_client.service.SendBillSync(
                fileName=f"{numero_completo}.zip",
                contentFile=zip_b64
            )

        print(f"📥 Respuesta DIAN recibida para {numero_completo}")

        if response:
            xml_respuesta = str(response)
            if "Aceptada" in xml_respuesta or "aceptada" in xml_respuesta:
                return {"exito": True, "estado": "Aceptada", "mensaje": "Factura aceptada por la DIAN", "xml_respuesta": xml_respuesta}
            elif "Rechazada" in xml_respuesta or "rechazada" in xml_respuesta:
                return {"exito": False, "estado": "Rechazada", "mensaje": f"Rechazada: {xml_respuesta[:300]}", "xml_respuesta": xml_respuesta}
            else:
                return {"exito": True, "estado": "Enviada", "mensaje": "Enviada, pendiente validación DIAN", "xml_respuesta": xml_respuesta}
        else:
            return {"exito": False, "estado": "Error", "mensaje": "Sin respuesta del servidor DIAN", "xml_respuesta": ""}

    except Exception as e:
        print(f"❌ Error enviando a DIAN: {e}")
        return {"exito": False, "estado": "Error", "mensaje": f"Error de conexión con DIAN: {str(e)}", "xml_respuesta": ""}


def consultar_estado_factura(cufe: str) -> dict:
    """Consulta el estado de una factura en la DIAN por CUFE"""
    try:
        private_key, certificate, cert_b64 = cargar_certificado()
        session = requests.Session()
        session.verify = False
        transport = Transport(session=session, timeout=30)

        try:
            from zeep.wsse.signature import BinarySignature
            wsse = BinarySignature(P12_PATH, P12_PASSWORD)
            client = Client(get_wsdl_url(), transport=transport, wsse=wsse)
        except Exception:
            client = Client(get_wsdl_url(), transport=transport)

        response = client.service.GetStatusZip(trackId=cufe)
        return {"exito": True, "respuesta": str(response)}
    except Exception as e:
        return {"exito": False, "error": str(e)}
