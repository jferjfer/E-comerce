"""
Cliente SOAP para Web Services DIAN - Facturación Electrónica
Con WS-Security usando BinarySignature (cert.pem + key.pem)
URL Pruebas: https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc
URL Producción: https://vpfe.dian.gov.co/WcfDianCustomerServices.svc
"""
import base64
import os
import zipfile
import io
from zeep import Client
from zeep.transports import Transport
import requests

DIAN_WSDL_PRUEBAS    = "https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl"
DIAN_WSDL_PRODUCCION = "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl"

AMBIENTE     = os.getenv("DIAN_AMBIENTE", "2")
TEST_SET_ID  = os.getenv("DIAN_TEST_SET_ID", "c5f5fbef-6621-420b-b986-857b2f1588d5")
SOFTWARE_ID  = os.getenv("DIAN_SOFTWARE_ID", "b7249493-84cf-430c-be82-64c830a2158c")
CERT_PEM     = os.getenv("DIAN_CERT_PEM", "/app/certs/cert.pem")
KEY_PEM      = os.getenv("DIAN_KEY_PEM", "/app/certs/key.pem")
NIT_EMISOR   = "900205170"

def get_wsdl_url():
    return DIAN_WSDL_PRUEBAS if AMBIENTE == "2" else DIAN_WSDL_PRODUCCION

def crear_cliente_wsse():
    """Crea cliente SOAP con WS-Security usando BinarySignature"""
    session = requests.Session()
    session.verify = False
    transport = Transport(session=session, timeout=60)

    try:
        from zeep.wsse.signature import BinarySignature
        wsse = BinarySignature(CERT_PEM, KEY_PEM)
        client = Client(get_wsdl_url(), transport=transport, wsse=wsse)
        print("✅ WS-Security BinarySignature configurado")
        return client
    except Exception as e:
        print(f"⚠️ WS-Security falló ({e}), usando cliente sin firma")
        return Client(get_wsdl_url(), transport=transport)

def xml_a_zip_base64(xml_string: str, nombre_archivo: str) -> str:
    """Convierte XML a ZIP en base64 para enviar a DIAN"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{nombre_archivo}.xml", xml_string.encode('utf-8'))
    zip_buffer.seek(0)
    return base64.b64encode(zip_buffer.read()).decode('utf-8')

def enviar_factura_dian(xml_string: str, numero_completo: str, nit_emisor: str = NIT_EMISOR) -> dict:
    """Envía la factura al Web Service de la DIAN con WS-Security"""
    try:
        print(f"📤 Enviando {numero_completo} a DIAN (ambiente: {AMBIENTE})...")

        zip_b64 = xml_a_zip_base64(xml_string, numero_completo)
        client = crear_cliente_wsse()

        if AMBIENTE == "2":
            response = client.service.SendTestSetAsync(
                fileName=f"{numero_completo}.zip",
                contentFile=zip_b64,
                testSetId=TEST_SET_ID
            )
        else:
            response = client.service.SendBillSync(
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
        client = crear_cliente_wsse()
        response = client.service.GetStatusZip(trackId=cufe)
        return {"exito": True, "respuesta": str(response)}
    except Exception as e:
        return {"exito": False, "error": str(e)}
