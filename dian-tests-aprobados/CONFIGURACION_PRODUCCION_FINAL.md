# CONFIGURACION PRODUCCION FINAL ✅
## Primera factura aceptada: SETP990003007 — 31/05/2026

---

## Software de producción
- **ID:** b7c10167-446d-43cb-9978-9c30195f0074
- **Nombre:** Facturacion EGOS
- **PIN:** 14808

## Clave Técnica PRODUCCION
- **Clave:** 1813a5f17343f7a17ea5cfe1c1250d42e228d3c92b48fc115032e3ab35f4032f
- **IMPORTANTE:** Esta clave es DIFERENTE a la de habilitación (fc8eac422e...)
- **La clave de Muisca NO es la clave de producción**

## Resolución
- **Número:** 18764108565721
- **Prefijo:** SETP
- **Rango:** 990000000 - 995000000
- **Fecha desde:** 2026-04-16
- **Fecha hasta:** 2028-04-16

## Ambiente
- **Producción:** 1
- **URL WS:** https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl

---

## 🔑 COMO OBTENER LA CLAVE TECNICA REAL DE PRODUCCION

La DIAN guarda internamente una clave técnica diferente a la que muestra Muisca.
Se obtiene usando el endpoint **GetNumberingRange** del Web Service de producción.

### Código Python para obtenerla:

```python
from codeflexDian.Signing import Signing
from codeflexDian.SOAPSing import SOAPSing
from lxml import etree
import requests, urllib3
urllib3.disable_warnings()

P12_PATH = '/app/certs/certificado.pfx'
P12_PASSWORD = 'TU_PASSWORD'
URL_PRODUCCION = 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl'

signing = Signing(P12_PATH, P12_PASSWORD)
NS_WCF = 'http://wcf.dian.colombia'

body = etree.Element(f'{{{NS_WCF}}}GetNumberingRange')
etree.SubElement(body, f'{{{NS_WCF}}}accountCode').text = '902051708'      # NIT emisor
etree.SubElement(body, f'{{{NS_WCF}}}accountCodeT').text = '902051708'     # NIT emisor
etree.SubElement(body, f'{{{NS_WCF}}}softwareCode').text = 'b7c10167-446d-43cb-9978-9c30195f0074'  # Software ID

soap = SOAPSing(signing, 'GetNumberingRange')
env = soap.sing(body)
resp = requests.post(URL_PRODUCCION,
    data=etree.tostring(env, xml_declaration=True, encoding='UTF-8'),
    headers={'Content-Type': 'application/soap+xml;charset=UTF-8'},
    verify=False, timeout=30)

# La respuesta contiene:
# <c:TechnicalKey>1813a5f17343f7a17ea5cfe1c1250d42e228d3c92b48fc115032e3ab35f4032f</c:TechnicalKey>
print(resp.text)
```

### Respuesta de la DIAN:
```xml
<c:ResolutionNumber>18764108565721</c:ResolutionNumber>
<c:Prefix>SETP</c:Prefix>
<c:FromNumber>990000000</c:FromNumber>
<c:ToNumber>995000000</c:ToNumber>
<c:ValidDateFrom>2026-04-16</c:ValidDateFrom>
<c:ValidDateTo>2028-04-16</c:ValidDateTo>
<c:TechnicalKey>1813a5f17343f7a17ea5cfe1c1250d42e228d3c92b48fc115032e3ab35f4032f</c:TechnicalKey>
```

---

## Fix crítico — wsa:To hardcodeado en codeflexDian

La librería `codeflexDian` tenía hardcodeada la URL de habilitación en el campo `wsa:To` del header SOAP.
Se corrigió con monkey-patch en `patch_codeflexdian.py`.

**Archivo:** `/usr/local/lib/python3.11/site-packages/codeflexDian/SOAPSing.py` línea 49
**Antes:** `https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl`
**Después:** URL dinámica según ambiente

---

## Lecciones aprendidas

1. La clave técnica de Muisca (habilitación) ≠ clave técnica de producción
2. Usar `GetNumberingRange` para obtener la clave real de producción
3. `codeflexDian` tiene la URL de habilitación hardcodeada — requiere parche
4. El error `FAD06` puede ser por clave incorrecta O por wsa:To incorrecto
