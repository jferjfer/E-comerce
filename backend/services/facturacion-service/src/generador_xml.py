"""
Generador de XML UBL 2.1 para Factura Electrónica DIAN Colombia
"""
import hashlib
import os
from datetime import datetime, date
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
    "ciudad": "Bogotá D.C",
    "departamento": "Cundinamarca",
    "pais": "CO",
    "telefono": "+573017879852",
    "email": "servicioalcliente@egoscolombia.com",
    "ciiu": "4771",
    "regimen": "47",  # Régimen SIMPLE
    "tipo_persona": "1",  # Jurídica
}

# Configuración DIAN
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
    "ambiente": "2",  # 1=Producción, 2=Pruebas
}

IVA_RATE = 0.19

# Namespaces UBL 2.1
NS = {
    "xmlns": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    "xmlns:ext": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
    "xmlns:sts": "dian:gov:co:facturaelectronica:Structures-2-1",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
}

def calcular_cufe(
    numero_factura: str,
    fecha_factura: str,
    hora_factura: str,
    valor_factura: float,
    cod_impuesto1: str,
    valor_impuesto1: float,
    valor_total: float,
    nit_emisor: str,
    nit_adquiriente: str,
    clave_tecnica: str,
    ambiente: str
) -> str:
    """Calcula el CUFE según especificación DIAN"""
    cadena = (
        f"{numero_factura}"
        f"{fecha_factura}"
        f"{hora_factura}"
        f"{valor_factura:.2f}"
        f"{cod_impuesto1}"
        f"{valor_impuesto1:.2f}"
        f"00"  # impuesto2
        f"0.00"
        f"00"  # impuesto3
        f"0.00"
        f"{valor_total:.2f}"
        f"{nit_emisor}"
        f"{nit_adquiriente}"
        f"{clave_tecnica}"
        f"{ambiente}"
    )
    return hashlib.sha384(cadena.encode()).hexdigest()

def generar_xml_factura(
    numero: int,
    pedido_id: str,
    cliente: Dict,
    productos: List[Dict],
    fecha: datetime = None
) -> tuple:
    """
    Genera el XML UBL 2.1 de la factura electrónica

    Returns:
        tuple: (xml_string, cufe, numero_completo)
    """
    if fecha is None:
        fecha = datetime.now()

    numero_completo = f"{DIAN_CONFIG['prefijo']}{numero}"
    fecha_str = fecha.strftime("%Y-%m-%d")
    hora_str = fecha.strftime("%H:%M:%S-05:00")

    # Calcular valores
    subtotal = sum(p["precio_unitario"] * p["cantidad"] for p in productos)
    iva = round(subtotal * IVA_RATE, 2)
    total = round(subtotal + iva, 2)

    # Calcular CUFE
    nit_adquiriente = cliente.get("nit_cc", "222222222222")
    cufe = calcular_cufe(
        numero_completo, fecha_str, hora_str,
        subtotal, "01", iva, total,
        EMPRESA["nit"], nit_adquiriente,
        DIAN_CONFIG["clave_tecnica"], DIAN_CONFIG["ambiente"]
    )

    # Construir XML
    root = etree.Element("Invoice", nsmap={
        None: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
        "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
        "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        "ext": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
        "sts": "dian:gov:co:facturaelectronica:Structures-2-1",
        "xsi": "http://www.w3.org/2001/XMLSchema-instance",
    })

    cbc = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
    cac = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    ext = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
    sts = "dian:gov:co:facturaelectronica:Structures-2-1"

    def cbc_el(tag, text, **attrs):
        el = etree.SubElement(root if not attrs.get("parent") else attrs["parent"],
                              f"{{{cbc}}}{tag}")
        el.text = str(text)
        for k, v in attrs.items():
            if k != "parent":
                el.set(k, str(v))
        return el

    # Extensiones DIAN
    ext_content = etree.SubElement(root, f"{{{ext}}}UBLExtensions")
    ext_item = etree.SubElement(ext_content, f"{{{ext}}}UBLExtension")
    ext_content2 = etree.SubElement(ext_item, f"{{{ext}}}ExtensionContent")
    dian_ext = etree.SubElement(ext_content2, f"{{{sts}}}DianExtensions")

    # InvoiceControl
    inv_control = etree.SubElement(dian_ext, f"{{{sts}}}InvoiceControl")
    etree.SubElement(inv_control, f"{{{sts}}}InvoiceAuthorization").text = DIAN_CONFIG["resolucion"]
    auth_period = etree.SubElement(inv_control, f"{{{sts}}}AuthorizationPeriod")
    etree.SubElement(auth_period, f"{{{cbc}}}StartDate").text = DIAN_CONFIG["fecha_resolucion"]
    etree.SubElement(auth_period, f"{{{cbc}}}EndDate").text = "2030-01-19"
    auth_range = etree.SubElement(inv_control, f"{{{sts}}}AuthorizedInvoices")
    etree.SubElement(auth_range, f"{{{sts}}}Prefix").text = DIAN_CONFIG["prefijo"]
    etree.SubElement(auth_range, f"{{{sts}}}From").text = DIAN_CONFIG["rango_desde"]
    etree.SubElement(auth_range, f"{{{sts}}}To").text = DIAN_CONFIG["rango_hasta"]

    # InvoiceSource
    inv_source = etree.SubElement(dian_ext, f"{{{sts}}}InvoiceSource")
    etree.SubElement(inv_source, f"{{{cbc}}}IdentificationCode", listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe",
                     listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1").text = "CO"

    # SoftwareProvider
    sw_provider = etree.SubElement(dian_ext, f"{{{sts}}}SoftwareProvider")
    sw_prov_id = etree.SubElement(sw_provider, f"{{{sts}}}ProviderID",
                                   schemeAgencyID="195",
                                   schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")
    sw_prov_id.text = EMPRESA["nit"]
    sw_id = etree.SubElement(sw_provider, f"{{{sts}}}SoftwareID",
                              schemeAgencyID="195",
                              schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")
    sw_id.text = DIAN_CONFIG["software_id"]

    # SoftwareSecurityCode
    security_code = hashlib.sha384(
        f"{DIAN_CONFIG['software_id']}{DIAN_CONFIG['pin']}{numero_completo}".encode()
    ).hexdigest()
    sw_sec = etree.SubElement(dian_ext, f"{{{sts}}}SoftwareSecurityCode",
                               schemeAgencyID="195",
                               schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")
    sw_sec.text = security_code

    # AuthorizationProvider
    auth_prov = etree.SubElement(dian_ext, f"{{{sts}}}AuthorizationProvider")
    auth_prov_id = etree.SubElement(auth_prov, f"{{{sts}}}AuthorizationProviderID",
                                     schemeAgencyID="195",
                                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                                     schemeID="4", schemeName="31")
    auth_prov_id.text = "800197268"  # NIT DIAN

    # QR Code
    qr_text = f"NumFac={numero_completo}&FecFac={fecha_str}&NitFac={EMPRESA['nit']}&DocAdq={nit_adquiriente}&ValFac={subtotal:.2f}&ValIva={iva:.2f}&ValTotal={total:.2f}&CUFE={cufe}"
    etree.SubElement(dian_ext, f"{{{sts}}}QRCode").text = qr_text

    # Campos principales
    etree.SubElement(root, f"{{{cbc}}}UBLVersionID").text = "UBL 2.1"
    etree.SubElement(root, f"{{{cbc}}}CustomizationID").text = "10"
    etree.SubElement(root, f"{{{cbc}}}ProfileID").text = "DIAN 2.1"
    etree.SubElement(root, f"{{{cbc}}}ProfileExecutionID").text = DIAN_CONFIG["ambiente"]
    etree.SubElement(root, f"{{{cbc}}}ID").text = numero_completo
    etree.SubElement(root, f"{{{cbc}}}UUID",
                     schemeID=DIAN_CONFIG["ambiente"],
                     schemeName="CUFE-SHA384").text = cufe
    etree.SubElement(root, f"{{{cbc}}}IssueDate").text = fecha_str
    etree.SubElement(root, f"{{{cbc}}}IssueTime").text = hora_str
    etree.SubElement(root, f"{{{cbc}}}InvoiceTypeCode",
                     listAgencyID="195",
                     listAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:InvoiceTypeCode-2.1").text = "01"
    etree.SubElement(root, f"{{{cbc}}}Note").text = f"Factura de venta EGOS - Pedido #{pedido_id}"
    etree.SubElement(root, f"{{{cbc}}}DocumentCurrencyCode",
                     listID="ISO 4217 Alpha", listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe").text = "COP"
    etree.SubElement(root, f"{{{cbc}}}LineCountNumeric").text = str(len(productos))

    # Período de facturación
    inv_period = etree.SubElement(root, f"{{{cac}}}InvoicePeriod")
    etree.SubElement(inv_period, f"{{{cbc}}}StartDate").text = fecha_str
    etree.SubElement(inv_period, f"{{{cbc}}}EndDate").text = fecha_str

    # Referencia orden
    order_ref = etree.SubElement(root, f"{{{cac}}}OrderReference")
    etree.SubElement(order_ref, f"{{{cbc}}}ID").text = pedido_id

    # Emisor (AccountingSupplierParty)
    supplier = etree.SubElement(root, f"{{{cac}}}AccountingSupplierParty")
    etree.SubElement(supplier, f"{{{cbc}}}AdditionalAccountID").text = EMPRESA["tipo_persona"]
    supplier_party = etree.SubElement(supplier, f"{{{cac}}}Party")

    supplier_name = etree.SubElement(supplier_party, f"{{{cac}}}PartyName")
    etree.SubElement(supplier_name, f"{{{cbc}}}Name").text = EMPRESA["nombre_comercial"]

    supplier_legal = etree.SubElement(supplier_party, f"{{{cac}}}PartyLegalEntity")
    etree.SubElement(supplier_legal, f"{{{cbc}}}RegistrationName").text = EMPRESA["razon_social"]
    etree.SubElement(supplier_legal, f"{{{cbc}}}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]

    supplier_tax = etree.SubElement(supplier_party, f"{{{cac}}}PartyTaxScheme")
    etree.SubElement(supplier_tax, f"{{{cbc}}}RegistrationName").text = EMPRESA["razon_social"]
    etree.SubElement(supplier_tax, f"{{{cbc}}}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]
    supplier_tax_scheme = etree.SubElement(supplier_tax, f"{{{cac}}}TaxScheme")
    etree.SubElement(supplier_tax_scheme, f"{{{cbc}}}ID").text = "01"
    etree.SubElement(supplier_tax_scheme, f"{{{cbc}}}Name").text = "IVA"

    supplier_contact = etree.SubElement(supplier_party, f"{{{cac}}}Contact")
    etree.SubElement(supplier_contact, f"{{{cbc}}}ElectronicMail").text = EMPRESA["email"]

    # Receptor (AccountingCustomerParty)
    customer = etree.SubElement(root, f"{{{cac}}}AccountingCustomerParty")
    etree.SubElement(customer, f"{{{cbc}}}AdditionalAccountID").text = "2"  # Natural
    customer_party = etree.SubElement(customer, f"{{{cac}}}Party")

    customer_name = etree.SubElement(customer_party, f"{{{cac}}}PartyName")
    etree.SubElement(customer_name, f"{{{cbc}}}Name").text = cliente.get("nombre", "Consumidor Final")

    customer_legal = etree.SubElement(customer_party, f"{{{cac}}}PartyLegalEntity")
    etree.SubElement(customer_legal, f"{{{cbc}}}RegistrationName").text = cliente.get("nombre", "Consumidor Final")
    etree.SubElement(customer_legal, f"{{{cbc}}}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="0", schemeName="13").text = cliente.get("nit_cc", "222222222222")

    customer_contact = etree.SubElement(customer_party, f"{{{cac}}}Contact")
    etree.SubElement(customer_contact, f"{{{cbc}}}ElectronicMail").text = cliente.get("email", "")

    # Totales de impuestos
    tax_total = etree.SubElement(root, f"{{{cac}}}TaxTotal")
    etree.SubElement(tax_total, f"{{{cbc}}}TaxAmount",
                     currencyID="COP").text = f"{iva:.2f}"
    tax_subtotal = etree.SubElement(tax_total, f"{{{cac}}}TaxSubtotal")
    etree.SubElement(tax_subtotal, f"{{{cbc}}}TaxableAmount",
                     currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(tax_subtotal, f"{{{cbc}}}TaxAmount",
                     currencyID="COP").text = f"{iva:.2f}"
    tax_category = etree.SubElement(tax_subtotal, f"{{{cac}}}TaxCategory")
    etree.SubElement(tax_category, f"{{{cbc}}}Percent").text = "19.00"
    tax_scheme = etree.SubElement(tax_category, f"{{{cac}}}TaxScheme")
    etree.SubElement(tax_scheme, f"{{{cbc}}}ID").text = "01"
    etree.SubElement(tax_scheme, f"{{{cbc}}}Name").text = "IVA"

    # Totales monetarios
    legal_total = etree.SubElement(root, f"{{{cac}}}LegalMonetaryTotal")
    etree.SubElement(legal_total, f"{{{cbc}}}LineExtensionAmount",
                     currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(legal_total, f"{{{cbc}}}TaxExclusiveAmount",
                     currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(legal_total, f"{{{cbc}}}TaxInclusiveAmount",
                     currencyID="COP").text = f"{total:.2f}"
    etree.SubElement(legal_total, f"{{{cbc}}}PayableAmount",
                     currencyID="COP").text = f"{total:.2f}"

    # Líneas de factura
    for i, producto in enumerate(productos, 1):
        precio_unit = producto["precio_unitario"]
        cantidad = producto["cantidad"]
        subtotal_linea = precio_unit * cantidad
        iva_linea = round(subtotal_linea * IVA_RATE, 2)

        line = etree.SubElement(root, f"{{{cac}}}InvoiceLine")
        etree.SubElement(line, f"{{{cbc}}}ID").text = str(i)
        etree.SubElement(line, f"{{{cbc}}}InvoicedQuantity",
                         unitCode="94").text = str(cantidad)
        etree.SubElement(line, f"{{{cbc}}}LineExtensionAmount",
                         currencyID="COP").text = f"{subtotal_linea:.2f}"

        # Impuesto línea
        line_tax = etree.SubElement(line, f"{{{cac}}}TaxTotal")
        etree.SubElement(line_tax, f"{{{cbc}}}TaxAmount",
                         currencyID="COP").text = f"{iva_linea:.2f}"
        line_tax_sub = etree.SubElement(line_tax, f"{{{cac}}}TaxSubtotal")
        etree.SubElement(line_tax_sub, f"{{{cbc}}}TaxableAmount",
                         currencyID="COP").text = f"{subtotal_linea:.2f}"
        etree.SubElement(line_tax_sub, f"{{{cbc}}}TaxAmount",
                         currencyID="COP").text = f"{iva_linea:.2f}"
        line_tax_cat = etree.SubElement(line_tax_sub, f"{{{cac}}}TaxCategory")
        etree.SubElement(line_tax_cat, f"{{{cbc}}}Percent").text = "19.00"
        line_tax_scheme = etree.SubElement(line_tax_cat, f"{{{cac}}}TaxScheme")
        etree.SubElement(line_tax_scheme, f"{{{cbc}}}ID").text = "01"
        etree.SubElement(line_tax_scheme, f"{{{cbc}}}Name").text = "IVA"

        # Producto
        line_item = etree.SubElement(line, f"{{{cac}}}Item")
        etree.SubElement(line_item, f"{{{cbc}}}Description").text = producto.get("nombre", "Producto")
        line_item_id = etree.SubElement(line_item, f"{{{cac}}}SellersItemIdentification")
        etree.SubElement(line_item_id, f"{{{cbc}}}ID").text = str(producto.get("id", i))

        # Precio
        line_price = etree.SubElement(line, f"{{{cac}}}Price")
        etree.SubElement(line_price, f"{{{cbc}}}PriceAmount",
                         currencyID="COP").text = f"{precio_unit:.2f}"
        etree.SubElement(line_price, f"{{{cbc}}}BaseQuantity",
                         unitCode="94").text = "1"

    xml_string = etree.tostring(root, pretty_print=True,
                                xml_declaration=True, encoding="UTF-8").decode()

    return xml_string, cufe, numero_completo, qr_text, subtotal, iva, total
