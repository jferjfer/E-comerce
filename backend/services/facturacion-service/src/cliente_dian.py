"""
Cliente SOAP para Web Services DIAN - Facturación Electrónica
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

DIAN_WSDL_PRUEBAS = "https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl"
DIAN_WSDL_PRODUCCION = "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl"

AMBIENTE = os.getenv("DIAN_AMBIENTE", "2")  # 2=Pruebas, 1=Producción
TEST_SET_ID = os.getenv("DIAN_TEST_SET_ID", "dd3a0db6-ef6a-4bca-b5c4-954831bee339")
SOFTWARE_ID = os.getenv("DIAN_SOFTWARE_ID", "fa326ca7-c1f8-40d3-a6fc-24d7c1040607")
NIT_EMISOR = "900205170"

def get_wsdl_url():
    return DIAN_WSDL_PRUEBAS if AMBIENTE == "2" else DIAN_WSDL_PRODUCCION

def xml_a_zip_base64(xml_string: str, nombre_archivo: str) -> str:
    """Convierte XML a ZIP en base64 para enviar a DIAN"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{nombre_archivo}.xml", xml_string.encode('utf-8'))
    zip_buffer.seek(0)
    return base64.b64encode(zip_buffer.read()).decode('utf-8')

def enviar_factura_dian(xml_string: str, numero_completo: str, nit_emisor: str = NIT_EMISOR) -> dict:
    """
    Envía la factura al Web Service de la DIAN

    Returns:
        dict con: exito, cufe, mensaje, xml_respuesta
    """
    try:
        print(f"📤 Enviando factura {numero_completo} a DIAN...")

        # Convertir XML a ZIP base64
        zip_b64 = xml_a_zip_base64(xml_string, numero_completo)

        # Crear cliente SOAP
        session = requests.Session()
        session.verify = False  # En pruebas puede ser necesario
        transport = Transport(session=session, timeout=60)

        client = Client(get_wsdl_url(), transport=transport)

        # Llamar al método SendBillSync (envío síncrono)
        if AMBIENTE == "2":
            # En pruebas usar SendTestSetAsync
            response = client.service.SendTestSetAsync(
                fileName=f"{numero_completo}.zip",
                contentFile=zip_b64,
                testSetId=TEST_SET_ID
            )
        else:
            # En producción usar SendBillSync
            response = client.service.SendBillSync(
                fileName=f"{numero_completo}.zip",
                contentFile=zip_b64
            )

        print(f"📥 Respuesta DIAN recibida")

        # Procesar respuesta
        if response:
            xml_respuesta = str(response)

            # Verificar si fue aceptada
            if "Aceptada" in xml_respuesta or "aceptada" in xml_respuesta or "200" in xml_respuesta:
                return {
                    "exito": True,
                    "estado": "Aceptada",
                    "mensaje": "Factura aceptada por la DIAN",
                    "xml_respuesta": xml_respuesta
                }
            elif "Rechazada" in xml_respuesta or "rechazada" in xml_respuesta:
                return {
                    "exito": False,
                    "estado": "Rechazada",
                    "mensaje": f"Factura rechazada por la DIAN: {xml_respuesta[:500]}",
                    "xml_respuesta": xml_respuesta
                }
            else:
                return {
                    "exito": True,
                    "estado": "Enviada",
                    "mensaje": "Factura enviada, pendiente validación DIAN",
                    "xml_respuesta": xml_respuesta
                }
        else:
            return {
                "exito": False,
                "estado": "Error",
                "mensaje": "Sin respuesta del servidor DIAN",
                "xml_respuesta": ""
            }

    except Exception as e:
        print(f"❌ Error enviando a DIAN: {e}")
        return {
            "exito": False,
            "estado": "Error",
            "mensaje": f"Error de conexión con DIAN: {str(e)}",
            "xml_respuesta": ""
        }

def consultar_estado_factura(cufe: str) -> dict:
    """Consulta el estado de una factura en la DIAN por CUFE"""
    try:
        session = requests.Session()
        session.verify = False
        transport = Transport(session=session, timeout=30)
        client = Client(get_wsdl_url(), transport=transport)

        response = client.service.GetStatusZip(trackId=cufe)

        return {
            "exito": True,
            "respuesta": str(response)
        }
    except Exception as e:
        return {
            "exito": False,
            "error": str(e)
        }
