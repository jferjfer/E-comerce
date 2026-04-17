"""
Generador de XML UBL 2.1 para Factura Electrónica DIAN Colombia
Estructura basada exactamente en ejemplos oficiales DIAN (Generica.xml, Consumidor Final.xml)
"""
import hashlib
import os
from datetime import datetime
from typing import List, Dict
from lxml import etree

# ============================================
# CONFIGURACIÓN EMPRESA EMISORA
# ============================================
EMPRESA = {
    "nit": "902051708",
    "dv": "6",
    "razon_social": "Vertel & Catillo S.A.S",
    "nombre_comercial": "EGOS",
    "direccion": "CRA 107 A BIS #69B-58",
    "ciudad": "Bogotá D.C.",
    "departamento": "Cundinamarca",
    "departamento_code": "11",
    "municipio_code": "11001",
    "pais": "CO",
    "telefono": "+573017879852",
    "email": "servicioalcliente@egoscolombia.com",
    "ciiu": "4771",
    "tipo_persona": "1",
}

DIAN_CONFIG = {
    "software_id": os.getenv("DIAN_SOFTWARE_ID", "e366fc5f-eea4-4bc8-8ca9-4dfcd1255eba"),
    "clave_tecnica": os.getenv("DIAN_CLAVE_TECNICA", "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c"),
    "pin": os.getenv("DIAN_PIN", "13251"),
    "test_set_id": os.getenv("DIAN_TEST_SET_ID", "7dbfd362-fad0-4e3a-8983-76a3422e504b"),
    "prefijo": os.getenv("DIAN_PREFIJO", "SETP"),
    "resolucion": os.getenv("DIAN_RESOLUCION", "18760000001"),
    "fecha_resolucion": "2019-01-19",
    "rango_desde": "990000000",
    "rango_hasta": "995000000",
    "ambiente": "2",
}

IVA_RATE = 0.19

# Namespaces exactos del ejemplo Generica.xml
CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
EXT = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
STS = "dian:gov:co:facturaelectronica:Structures-2-1"


def calcular_cufe(numero_factura, fecha_factura, hora_factura, valor_factura,
                  cod_impuesto1, valor_impuesto1, valor_total,
                  nit_emisor, nit_adquiriente, clave_tecnica, ambiente):
    # Formato exacto: NumFac+FecFac+HorFac+ValFac+01+ValIVA+04+0.00+03+0.00+ValTot+NitFac+NumAdq+ClaveTec+Ambiente
    cadena = (
        f"{numero_factura}{fecha_factura}{hora_factura}"
        f"{valor_factura:.2f}{cod_impuesto1}{valor_impuesto1:.2f}"
        f"040.00030.00{valor_total:.2f}"
        f"{nit_emisor}{nit_adquiriente}{clave_tecnica}{ambiente}"
    )
    return hashlib.sha384(cadena.encode()).hexdigest()


def generar_xml_factura(numero, pedido_id, cliente, productos, fecha=None):
    if fecha is None:
        fecha = datetime.now()

    numero_completo = f"{DIAN_CONFIG['prefijo']}{numero}"
    fecha_str = fecha.strftime("%Y-%m-%d")
    hora_str = fecha.strftime("%H:%M:%S-05:00")

    subtotal = sum(p["precio_unitario"] * p["cantidad"] for p in productos)
    iva = round(subtotal * IVA_RATE, 2)
    total = round(subtotal + iva, 2)
    nit_adquiriente = cliente.get("nit_cc", "222222222222")

    cufe = calcular_cufe(numero_completo, fecha_str, hora_str,
                         subtotal, "01", iva, total,
                         EMPRESA["nit"], nit_adquiriente,
                         DIAN_CONFIG["clave_tecnica"], DIAN_CONFIG["ambiente"])

    security_code = hashlib.sha384(
        f"{DIAN_CONFIG['software_id']}{DIAN_CONFIG['pin']}{numero_completo}".encode()
    ).hexdigest()

    # Estructura exacta del ejemplo Generica.xml
    nsmap = {
        None: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
        "cac": CAC,
        "cbc": CBC,
        "ds": "http://www.w3.org/2000/09/xmldsig#",
        "ext": EXT,
        "sts": STS,
        "xades": "http://uri.etsi.org/01903/v1.3.2#",
        "xades141": "http://uri.etsi.org/01903/v1.4.1#",
        "xsi": "http://www.w3.org/2001/XMLSchema-instance",
    }

    root = etree.Element("Invoice", nsmap=nsmap)
    root.set("{http://www.w3.org/2001/XMLSchema-instance}schemaLocation",
             "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2     "
             "http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd")

    # ── UBLExtensions ──
    uble = etree.SubElement(root, f"{{{EXT}}}UBLExtensions")
    uble_item = etree.SubElement(uble, f"{{{EXT}}}UBLExtension")
    uble_content = etree.SubElement(uble_item, f"{{{EXT}}}ExtensionContent")
    dian = etree.SubElement(uble_content, f"{{{STS}}}DianExtensions")

    # InvoiceControl
    ic = etree.SubElement(dian, f"{{{STS}}}InvoiceControl")
    etree.SubElement(ic, f"{{{STS}}}InvoiceAuthorization").text = DIAN_CONFIG["resolucion"]
    ap = etree.SubElement(ic, f"{{{STS}}}AuthorizationPeriod")
    etree.SubElement(ap, f"{{{CBC}}}StartDate").text = DIAN_CONFIG["fecha_resolucion"]
    etree.SubElement(ap, f"{{{CBC}}}EndDate").text = "2030-01-19"
    ai = etree.SubElement(ic, f"{{{STS}}}AuthorizedInvoices")
    etree.SubElement(ai, f"{{{STS}}}Prefix").text = DIAN_CONFIG["prefijo"]
    etree.SubElement(ai, f"{{{STS}}}From").text = DIAN_CONFIG["rango_desde"]
    etree.SubElement(ai, f"{{{STS}}}To").text = DIAN_CONFIG["rango_hasta"]

    # InvoiceSource
    inv_src = etree.SubElement(dian, f"{{{STS}}}InvoiceSource")
    etree.SubElement(inv_src, f"{{{CBC}}}IdentificationCode",
                     listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe",
                     listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1").text = "CO"

    # SoftwareProvider — ProviderID = NIT del emisor con DV
    swp = etree.SubElement(dian, f"{{{STS}}}SoftwareProvider")
    etree.SubElement(swp, f"{{{STS}}}ProviderID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]
    etree.SubElement(swp, f"{{{STS}}}SoftwareID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)").text = DIAN_CONFIG["software_id"]

    # SoftwareSecurityCode
    etree.SubElement(dian, f"{{{STS}}}SoftwareSecurityCode",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)").text = security_code

    # AuthorizationProvider
    auth_prov = etree.SubElement(dian, f"{{{STS}}}AuthorizationProvider")
    etree.SubElement(auth_prov, f"{{{STS}}}AuthorizationProviderID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="4", schemeName="31").text = "800197268"

    # QRCode — formato exacto del ejemplo
    qr_text = (f"NroFactura={numero_completo}\n"
               f"\t\t\t\t\t\t\t\tNitFacturador={EMPRESA['nit']}\n"
               f"\t\t\t\t\t\t\t\tNitAdquiriente={nit_adquiriente}\n"
               f"\t\t\t\t\t\t\t\tFechaFactura={fecha_str}\n"
               f"\t\t\t\t\t\t\t\tValorTotalFactura={total:.2f}\n"
               f"\t\t\t\t\t\t\t\tCUFE={cufe}\n"
               f"\t\t\t\t\t\t\t\tURL=https://catalogo-vpfe-hab.dian.gov.co/Document/FindDocument"
               f"?documentKey={cufe}&partitionKey=co|06|{cufe[:2]}&emissionDate={fecha_str.replace('-', '')}")
    etree.SubElement(dian, f"{{{STS}}}QRCode").text = qr_text

    # ── Campos principales (orden exacto del ejemplo) ──
    etree.SubElement(root, f"{{{CBC}}}UBLVersionID").text = "UBL 2.1"
    etree.SubElement(root, f"{{{CBC}}}CustomizationID").text = "05"
    etree.SubElement(root, f"{{{CBC}}}ProfileID").text = "DIAN 2.1: Factura Electrónica de Venta"
    etree.SubElement(root, f"{{{CBC}}}ProfileExecutionID").text = DIAN_CONFIG["ambiente"]
    etree.SubElement(root, f"{{{CBC}}}ID").text = numero_completo
    etree.SubElement(root, f"{{{CBC}}}UUID",
                     schemeID=DIAN_CONFIG["ambiente"],
                     schemeName="CUFE-SHA384").text = cufe
    etree.SubElement(root, f"{{{CBC}}}IssueDate").text = fecha_str
    etree.SubElement(root, f"{{{CBC}}}IssueTime").text = hora_str
    etree.SubElement(root, f"{{{CBC}}}InvoiceTypeCode").text = "01"
    # Note con cadena CUFE exacta del ejemplo
    note = (f"{numero_completo}{fecha_str}{hora_str}"
            f"{subtotal:.2f}01{iva:.2f}040.00030.00{total:.2f}"
            f"{EMPRESA['nit']}{nit_adquiriente}{DIAN_CONFIG['clave_tecnica']}{DIAN_CONFIG['ambiente']}")
    etree.SubElement(root, f"{{{CBC}}}Note").text = note
    etree.SubElement(root, f"{{{CBC}}}DocumentCurrencyCode",
                     listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe",
                     listID="ISO 4217 Alpha").text = "COP"
    etree.SubElement(root, f"{{{CBC}}}LineCountNumeric").text = str(len(productos))

    # InvoicePeriod
    inv_period = etree.SubElement(root, f"{{{CAC}}}InvoicePeriod")
    etree.SubElement(inv_period, f"{{{CBC}}}StartDate").text = fecha_str
    etree.SubElement(inv_period, f"{{{CBC}}}EndDate").text = fecha_str

    # OrderReference
    order_ref = etree.SubElement(root, f"{{{CAC}}}OrderReference")
    etree.SubElement(order_ref, f"{{{CBC}}}ID").text = pedido_id

    # ── AccountingSupplierParty (estructura exacta del ejemplo) ──
    supplier = etree.SubElement(root, f"{{{CAC}}}AccountingSupplierParty")
    etree.SubElement(supplier, f"{{{CBC}}}AdditionalAccountID").text = EMPRESA["tipo_persona"]
    sp = etree.SubElement(supplier, f"{{{CAC}}}Party")

    sp_name = etree.SubElement(sp, f"{{{CAC}}}PartyName")
    etree.SubElement(sp_name, f"{{{CBC}}}Name").text = EMPRESA["nombre_comercial"]

    sp_physical = etree.SubElement(sp, f"{{{CAC}}}PhysicalLocation")
    sp_addr = etree.SubElement(sp_physical, f"{{{CAC}}}Address")
    etree.SubElement(sp_addr, f"{{{CBC}}}ID").text = EMPRESA["municipio_code"]
    etree.SubElement(sp_addr, f"{{{CBC}}}CityName").text = EMPRESA["ciudad"]
    etree.SubElement(sp_addr, f"{{{CBC}}}CountrySubentity").text = EMPRESA["departamento"]
    etree.SubElement(sp_addr, f"{{{CBC}}}CountrySubentityCode").text = EMPRESA["departamento_code"]
    sp_al = etree.SubElement(sp_addr, f"{{{CAC}}}AddressLine")
    etree.SubElement(sp_al, f"{{{CBC}}}Line").text = EMPRESA["direccion"]
    sp_co = etree.SubElement(sp_addr, f"{{{CAC}}}Country")
    etree.SubElement(sp_co, f"{{{CBC}}}IdentificationCode").text = "CO"
    etree.SubElement(sp_co, f"{{{CBC}}}Name", languageID="es").text = "Colombia"

    sp_tax = etree.SubElement(sp, f"{{{CAC}}}PartyTaxScheme")
    etree.SubElement(sp_tax, f"{{{CBC}}}RegistrationName").text = EMPRESA["razon_social"]
    etree.SubElement(sp_tax, f"{{{CBC}}}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]
    etree.SubElement(sp_tax, f"{{{CBC}}}TaxLevelCode", listName="05").text = "O-13"
    sp_ra = etree.SubElement(sp_tax, f"{{{CAC}}}RegistrationAddress")
    etree.SubElement(sp_ra, f"{{{CBC}}}ID").text = EMPRESA["municipio_code"]
    etree.SubElement(sp_ra, f"{{{CBC}}}CityName").text = EMPRESA["ciudad"]
    etree.SubElement(sp_ra, f"{{{CBC}}}CountrySubentity").text = EMPRESA["departamento"]
    etree.SubElement(sp_ra, f"{{{CBC}}}CountrySubentityCode").text = EMPRESA["departamento_code"]
    sp_ral = etree.SubElement(sp_ra, f"{{{CAC}}}AddressLine")
    etree.SubElement(sp_ral, f"{{{CBC}}}Line").text = EMPRESA["direccion"]
    sp_rac = etree.SubElement(sp_ra, f"{{{CAC}}}Country")
    etree.SubElement(sp_rac, f"{{{CBC}}}IdentificationCode").text = "CO"
    etree.SubElement(sp_rac, f"{{{CBC}}}Name", languageID="es").text = "Colombia"
    sp_ts = etree.SubElement(sp_tax, f"{{{CAC}}}TaxScheme")
    etree.SubElement(sp_ts, f"{{{CBC}}}ID").text = "01"
    etree.SubElement(sp_ts, f"{{{CBC}}}Name").text = "IVA"

    sp_legal = etree.SubElement(sp, f"{{{CAC}}}PartyLegalEntity")
    etree.SubElement(sp_legal, f"{{{CBC}}}RegistrationName").text = EMPRESA["razon_social"]
    etree.SubElement(sp_legal, f"{{{CBC}}}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]
    sp_crs = etree.SubElement(sp_legal, f"{{{CAC}}}CorporateRegistrationScheme")
    etree.SubElement(sp_crs, f"{{{CBC}}}ID").text = DIAN_CONFIG["prefijo"]
    etree.SubElement(sp_crs, f"{{{CBC}}}Name").text = DIAN_CONFIG["pin"]

    sp_contact = etree.SubElement(sp, f"{{{CAC}}}Contact")
    etree.SubElement(sp_contact, f"{{{CBC}}}Telephone").text = EMPRESA["telefono"]
    etree.SubElement(sp_contact, f"{{{CBC}}}ElectronicMail").text = EMPRESA["email"]

    # ── AccountingCustomerParty ──
    customer = etree.SubElement(root, f"{{{CAC}}}AccountingCustomerParty")
    etree.SubElement(customer, f"{{{CBC}}}AdditionalAccountID").text = "2"
    cp = etree.SubElement(customer, f"{{{CAC}}}Party")

    # PartyIdentification requerido cuando AdditionalAccountID=2
    cp_pid = etree.SubElement(cp, f"{{{CAC}}}PartyIdentification")
    etree.SubElement(cp_pid, f"{{{CBC}}}ID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="0", schemeName="13").text = nit_adquiriente

    cp_name = etree.SubElement(cp, f"{{{CAC}}}PartyName")
    etree.SubElement(cp_name, f"{{{CBC}}}Name").text = cliente.get("nombre", "Consumidor Final")

    cp_tax = etree.SubElement(cp, f"{{{CAC}}}PartyTaxScheme")
    etree.SubElement(cp_tax, f"{{{CBC}}}RegistrationName").text = cliente.get("nombre", "Consumidor Final")
    etree.SubElement(cp_tax, f"{{{CBC}}}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="0", schemeName="13").text = nit_adquiriente
    etree.SubElement(cp_tax, f"{{{CBC}}}TaxLevelCode", listName="49").text = "R-99-PN"
    cp_ts = etree.SubElement(cp_tax, f"{{{CAC}}}TaxScheme")
    etree.SubElement(cp_ts, f"{{{CBC}}}ID").text = "ZY"
    etree.SubElement(cp_ts, f"{{{CBC}}}Name").text = "No causa"

    cp_legal = etree.SubElement(cp, f"{{{CAC}}}PartyLegalEntity")
    etree.SubElement(cp_legal, f"{{{CBC}}}RegistrationName").text = cliente.get("nombre", "Consumidor Final")
    etree.SubElement(cp_legal, f"{{{CBC}}}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="0", schemeName="13").text = nit_adquiriente

    cp_contact = etree.SubElement(cp, f"{{{CAC}}}Contact")
    etree.SubElement(cp_contact, f"{{{CBC}}}ElectronicMail").text = cliente.get("email", "")

    # ── PaymentMeans ──
    pm = etree.SubElement(root, f"{{{CAC}}}PaymentMeans")
    etree.SubElement(pm, f"{{{CBC}}}ID").text = "1"
    etree.SubElement(pm, f"{{{CBC}}}PaymentMeansCode").text = "10"
    etree.SubElement(pm, f"{{{CBC}}}PaymentDueDate").text = fecha_str

    # ── TaxTotal ──
    tax_total = etree.SubElement(root, f"{{{CAC}}}TaxTotal")
    etree.SubElement(tax_total, f"{{{CBC}}}TaxAmount", currencyID="COP").text = f"{iva:.2f}"
    tax_sub = etree.SubElement(tax_total, f"{{{CAC}}}TaxSubtotal")
    etree.SubElement(tax_sub, f"{{{CBC}}}TaxableAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(tax_sub, f"{{{CBC}}}TaxAmount", currencyID="COP").text = f"{iva:.2f}"
    tax_cat = etree.SubElement(tax_sub, f"{{{CAC}}}TaxCategory")
    etree.SubElement(tax_cat, f"{{{CBC}}}Percent").text = "19.00"
    tax_scheme = etree.SubElement(tax_cat, f"{{{CAC}}}TaxScheme")
    etree.SubElement(tax_scheme, f"{{{CBC}}}ID").text = "01"
    etree.SubElement(tax_scheme, f"{{{CBC}}}Name").text = "IVA"

    # ── LegalMonetaryTotal ──
    lmt = etree.SubElement(root, f"{{{CAC}}}LegalMonetaryTotal")
    etree.SubElement(lmt, f"{{{CBC}}}LineExtensionAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(lmt, f"{{{CBC}}}TaxExclusiveAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(lmt, f"{{{CBC}}}TaxInclusiveAmount", currencyID="COP").text = f"{total:.2f}"
    etree.SubElement(lmt, f"{{{CBC}}}PayableAmount", currencyID="COP").text = f"{total:.2f}"

    # ── InvoiceLines ──
    for i, producto in enumerate(productos, 1):
        precio_unit = producto["precio_unitario"]
        cantidad = producto["cantidad"]
        subtotal_linea = precio_unit * cantidad
        iva_linea = round(subtotal_linea * IVA_RATE, 2)

        line = etree.SubElement(root, f"{{{CAC}}}InvoiceLine")
        etree.SubElement(line, f"{{{CBC}}}ID").text = str(i)
        etree.SubElement(line, f"{{{CBC}}}InvoicedQuantity", unitCode="NIU").text = f"{cantidad:.6f}"
        etree.SubElement(line, f"{{{CBC}}}LineExtensionAmount", currencyID="COP").text = f"{subtotal_linea:.2f}"
        etree.SubElement(line, f"{{{CBC}}}FreeOfChargeIndicator").text = "false"

        lt = etree.SubElement(line, f"{{{CAC}}}TaxTotal")
        etree.SubElement(lt, f"{{{CBC}}}TaxAmount", currencyID="COP").text = f"{iva_linea:.2f}"
        etree.SubElement(lt, f"{{{CBC}}}TaxEvidenceIndicator").text = "false"
        lt_sub = etree.SubElement(lt, f"{{{CAC}}}TaxSubtotal")
        etree.SubElement(lt_sub, f"{{{CBC}}}TaxableAmount", currencyID="COP").text = f"{subtotal_linea:.2f}"
        etree.SubElement(lt_sub, f"{{{CBC}}}TaxAmount", currencyID="COP").text = f"{iva_linea:.2f}"
        lt_cat = etree.SubElement(lt_sub, f"{{{CAC}}}TaxCategory")
        etree.SubElement(lt_cat, f"{{{CBC}}}Percent").text = "19.00"
        lt_ts = etree.SubElement(lt_cat, f"{{{CAC}}}TaxScheme")
        etree.SubElement(lt_ts, f"{{{CBC}}}ID").text = "01"
        etree.SubElement(lt_ts, f"{{{CBC}}}Name").text = "IVA"

        item = etree.SubElement(line, f"{{{CAC}}}Item")
        etree.SubElement(item, f"{{{CBC}}}Description").text = producto.get("nombre", "Producto")
        item_id = etree.SubElement(item, f"{{{CAC}}}SellersItemIdentification")
        etree.SubElement(item_id, f"{{{CBC}}}ID").text = str(producto.get("id", i))

        price = etree.SubElement(line, f"{{{CAC}}}Price")
        etree.SubElement(price, f"{{{CBC}}}PriceAmount", currencyID="COP").text = f"{precio_unit:.2f}"
        etree.SubElement(price, f"{{{CBC}}}BaseQuantity", unitCode="NIU").text = "1.000000"

    xml_string = etree.tostring(root, pretty_print=True,
                                xml_declaration=True, encoding="UTF-8").decode()

    return xml_string, cufe, numero_completo, qr_text, subtotal, iva, total
