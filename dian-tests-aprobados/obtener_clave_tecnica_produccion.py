"""
Script para obtener la Clave Técnica REAL de producción desde la DIAN.

La DIAN guarda internamente una clave técnica diferente a la que muestra Muisca.
Este script usa el endpoint GetNumberingRange del WS de producción para obtenerla.

Uso:
    python3 obtener_clave_tecnica_produccion.py

Requiere:
    - Certificado .pfx válido
    - codeflexDian instalado
    - Variables de entorno DIAN_P12_PATH y DIAN_P12_PASSWORD
"""
import os
import re
import sys
import requests
import urllib3
from lxml import etree

urllib3.disable_warnings()

# Parche para wsa:To (codeflexDian tiene URL de habilitacion hardcodeada)
URL_PRODUCCION = 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl'
URL_HABILITACION = 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl'

def aplicar_parche_wsato(url_destino):
    try:
        import codeflexDian.SOAPSing as soap_module
        original_sing = soap_module.SOAPSing.sing

        def patched_sing(self, nodeSing):
            original_template = soap_module.envelope_template.template
            new_template = original_template \
                .replace(URL_HABILITACION, url_destino) \
                .replace(URL_PRODUCCION, url_destino)
            soap_module.envelope_template.template = new_template
            result = original_sing(self, nodeSing)
            soap_module.envelope_template.template = original_template
            return result

        soap_module.SOAPSing.sing = patched_sing
        print(f"✅ Parche wsa:To aplicado: {url_destino}")
    except Exception as e:
        print(f"⚠️ Error en parche: {e}")


def obtener_clave_tecnica(
    nit_emisor: str,
    software_id: str,
    p12_path: str,
    p12_password: str,
    ambiente: str = "1"  # 1=produccion, 2=habilitacion
) -> dict:
    """
    Consulta GetNumberingRange en el WS de la DIAN y retorna
    la clave técnica real registrada para el software.
    """
    from codeflexDian.Signing import Signing
    from codeflexDian.SOAPSing import SOAPSing

    url = URL_PRODUCCION if ambiente == "1" else URL_HABILITACION
    aplicar_parche_wsato(url)

    signing = Signing(p12_path, p12_password)
    NS_WCF = 'http://wcf.dian.colombia'

    body = etree.Element(f'{{{NS_WCF}}}GetNumberingRange')
    etree.SubElement(body, f'{{{NS_WCF}}}accountCode').text = nit_emisor
    etree.SubElement(body, f'{{{NS_WCF}}}accountCodeT').text = nit_emisor
    etree.SubElement(body, f'{{{NS_WCF}}}softwareCode').text = software_id

    soap = SOAPSing(signing, 'GetNumberingRange')
    envelope = soap.sing(body)
    soap_xml = etree.tostring(envelope, pretty_print=False,
                              xml_declaration=True, encoding='UTF-8')

    response = requests.post(
        url,
        data=soap_xml,
        headers={'Content-Type': 'application/soap+xml;charset=UTF-8'},
        verify=False,
        timeout=30
    )

    print(f"HTTP: {response.status_code}")

    # Extraer campos de la respuesta
    resp_text = response.text
    resultado = {
        'resolucion':    _extraer(resp_text, 'ResolutionNumber'),
        'fecha':         _extraer(resp_text, 'ResolutionDate'),
        'prefijo':       _extraer(resp_text, 'Prefix'),
        'desde':         _extraer(resp_text, 'FromNumber'),
        'hasta':         _extraer(resp_text, 'ToNumber'),
        'vigencia_desde':_extraer(resp_text, 'ValidDateFrom'),
        'vigencia_hasta':_extraer(resp_text, 'ValidDateTo'),
        'clave_tecnica': _extraer(resp_text, 'TechnicalKey'),
        'operacion':     _extraer(resp_text, 'OperationCode'),
        'descripcion':   _extraer(resp_text, 'OperationDescription'),
    }
    return resultado


def _extraer(texto: str, tag: str) -> str:
    m = re.search(rf'<[^>]*{tag}[^>]*>([^<]+)<', texto)
    return m.group(1) if m else ''


if __name__ == '__main__':
    # Configuracion
    NIT_EMISOR  = os.getenv('DIAN_NIT',         '902051708')
    SOFTWARE_ID = os.getenv('DIAN_SOFTWARE_ID', 'b7c10167-446d-43cb-9978-9c30195f0074')
    P12_PATH    = os.getenv('DIAN_P12_PATH',    '/app/certs/certificado.pfx')
    P12_PASS    = os.getenv('DIAN_P12_PASSWORD','')
    AMBIENTE    = os.getenv('DIAN_AMBIENTE',    '1')

    print("=" * 60)
    print("CONSULTA GetNumberingRange — DIAN")
    print("=" * 60)
    print(f"NIT:       {NIT_EMISOR}")
    print(f"Software:  {SOFTWARE_ID}")
    print(f"Ambiente:  {'Produccion' if AMBIENTE == '1' else 'Habilitacion'}")
    print()

    resultado = obtener_clave_tecnica(
        NIT_EMISOR, SOFTWARE_ID, P12_PATH, P12_PASS, AMBIENTE
    )

    print("=" * 60)
    print("RESULTADO:")
    print("=" * 60)
    for k, v in resultado.items():
        print(f"  {k:20}: {v}")

    if resultado['clave_tecnica']:
        print()
        print("✅ CLAVE TECNICA ENCONTRADA:")
        print(f"   {resultado['clave_tecnica']}")
        print()
        print("Usa esta clave en DIAN_CLAVE_TECNICA")
    else:
        print("❌ No se encontró clave técnica")
        sys.exit(1)
