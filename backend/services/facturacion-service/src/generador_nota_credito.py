"""
Generador de Notas Crédito UBL 2.1 — DIAN Colombia
Anula total o parcialmente una factura electrónica
"""
import hashlib
import os
from datetime import datetime
from typing import List, Dict
from lxml import etree
from generador_xml import EMPRESA, DIAN_CONFIG, IVA_RATE, calcular_cufe

def generar_nota_credito(
    numero: int,
    factura_referencia: str,
    cufe_factura: str,
    fecha_factura: str,
    cliente: Dict,
    productos: List[Dict],
    motivo: str = "Devolución de mercancía",
    codigo_motivo: str = "2",
    fecha: datetime = None
) -> tuple:
    """
    Genera XML UBL 2.1 de Nota Crédito

    Args:
        numero: Número secuencial de la nota
        factura_referencia: Número de la factura que se anula (ej: SETP990000000)
        cufe_factura: CUFE de la factura original
        fecha_factura: Fecha de la factura original (YYYY-MM-DD)
        cliente: Datos del cliente
        productos: Productos a devolver
        motivo: Descripción del motivo
        codigo_motivo: 1=Devolución parcial, 2=Anulación, 3=Rebaja, 4=Ajuste precio, 5=Otros

    Returns:
        tuple: (xml_string, cude, numero_completo, subtotal, iva, total)
    """
    if fecha is None:
        fecha = datetime.now()

    numero_completo = f"{DIAN_CONFIG['prefijo']}{numero}"
    fecha_str = fecha.strftime("%Y-%m-%d")
    hora_str = fecha.strftime("%H:%M:%S-05:00")

    subtotal = sum(p["precio_unitario"] * p["cantidad"] for p in productos)
    iva = round(subtotal * IVA_RATE, 2)
    total = round(subtotal + iva, 2)
    nit_adquiriente = cliente.get("nit_cc", "222222222222")

    cadena_cude = (
        f"{numero_completo}{fecha_str}{hora_str}"
        f"{subtotal:.2f}01{iva:.2f}000.00000.00"
        f"{total:.2f}{EMPRESA['nit']}{nit_adquiriente}"
        f"{DIAN_CONFIG['clave_tecnica']}{DIAN_CONFIG['ambiente']}"
    )
    cude = hashlib.sha384(cadena_cude.encode()).hexdigest()

    nsmap = {
        None: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
        "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
        "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        "ext": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
        "sts": "dian:gov:co:facturaelectronica:Structures-2-1",
        "ds": "http://www.w3.org/2000/09/xmldsig#",
        "xades": "http://uri.etsi.org/01903/v1.3.2#",
        "xades141": "http://uri.etsi.org/01903/v1.4.1#",
        "xsi": "http://www.w3.org/2001/XMLSchema-instance",
    }

    cbc = nsmap["cbc"]
    cac = nsmap["cac"]
    ext = nsmap["ext"]
    sts = nsmap["sts"]

    root = etree.Element("CreditNote", nsmap=nsmap)
    root.set("{http://www.w3.org/2001/XMLSchema-instance}schemaLocation",
             "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2 "
             "http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-CreditNote-2.1.xsd")

    # UBLExtensions — DianExtensions
    ext_root = etree.SubElement(root, f"{{{ext}}}UBLExtensions")
    ext_item = etree.SubElement(ext_root, f"{{{ext}}}UBLExtension")
    ext_content = etree.SubElement(ext_item, f"{{{ext}}}ExtensionContent")
    dian_ext = etree.SubElement(ext_content, f"{{{sts}}}DianExtensions")

    inv_control = etree.SubElement(dian_ext, f"{{{sts}}}InvoiceControl")
    etree.SubElement(inv_control, f"{{{sts}}}InvoiceAuthorization").text = DIAN_CONFIG["resolucion"]
    auth_period = etree.SubElement(inv_control, f"{{{sts}}}AuthorizationPeriod")
    etree.SubElement(auth_period, f"{{{cbc}}}StartDate").text = DIAN_CONFIG["fecha_resolucion"]
    etree.SubElement(auth_period, f"{{{cbc}}}EndDate").text = "2030-01-19"
    auth_range = etree.SubElement(inv_control, f"{{{sts}}}AuthorizedInvoices")
    etree.SubElement(auth_range, f"{{{sts}}}Prefix").text = DIAN_CONFIG["prefijo"]
    etree.SubElement(auth_range, f"{{{sts}}}From").text = DIAN_CONFIG["rango_desde"]
    etree.SubElement(auth_range, f"{{{sts}}}To").text = DIAN_CONFIG["rango_hasta"]

    inv_source = etree.SubElement(dian_ext, f"{{{sts}}}InvoiceSource")
    etree.SubElement(inv_source, f"{{{cbc}}}IdentificationCode",
                     listAgencyID="6", listAgencyName="United Nations Economic Commission for Europe",
                     listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1").text = "CO"

    sw_provider = etree.SubElement(dian_ext, f"{{{sts}}}SoftwareProvider")
    sp_id = etree.SubElement(sw_provider, f"{{{sts}}}ProviderID",
                              schemeAgencyID="195", schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                              schemeID="4", schemeName="31")
    sp_id.text = "800197268"
    sw_id = etree.SubElement(sw_provider, f"{{{sts}}}SoftwareID",
                              schemeAgencyID="195", schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")
    sw_id.text = DIAN_CONFIG["software_id"]

    security_code = hashlib.sha384(
        f"{DIAN_CONFIG['software_id']}{DIAN_CONFIG['pin']}{numero_completo}".encode()
    ).hexdigest()
    sw_sec = etree.SubElement(dian_ext, f"{{{sts}}}SoftwareSecurityCode",
                               schemeAgencyID="195", schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")
    sw_sec.text = security_code

    auth_prov = etree.SubElement(dian_ext, f"{{{sts}}}AuthorizationProvider")
    ap_id = etree.SubElement(auth_prov, f"{{{sts}}}AuthorizationProviderID",
                              schemeID="4", schemeName="31", schemeAgencyID="195",
                              schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")
    ap_id.text = "800197268"

    qr_text = f"NumFac={numero_completo}&FecFac={fecha_str}&NitFac={EMPRESA['nit']}&DocAdq={nit_adquiriente}&ValFac={subtotal:.2f}&ValIva={iva:.2f}&ValTotal={total:.2f}&CUDE={cude}"
    etree.SubElement(dian_ext, f"{{{sts}}}QRCode").text = qr_text

    # Campos principales
    etree.SubElement(root, f"{{{cbc}}}UBLVersionID").text = "UBL 2.1"
    etree.SubElement(root, f"{{{cbc}}}CustomizationID").text = "11"
    etree.SubElement(root, f"{{{cbc}}}ProfileID").text = "DIAN 2.1"
    etree.SubElement(root, f"{{{cbc}}}ProfileExecutionID").text = DIAN_CONFIG["ambiente"]
    etree.SubElement(root, f"{{{cbc}}}ID").text = numero_completo
    etree.SubElement(root, f"{{{cbc}}}UUID", schemeID=DIAN_CONFIG["ambiente"], schemeName="CUDE-SHA384").text = cude
    etree.SubElement(root, f"{{{cbc}}}IssueDate").text = fecha_str
    etree.SubElement(root, f"{{{cbc}}}IssueTime").text = hora_str
    etree.SubElement(root, f"{{{cbc}}}CreditNoteTypeCode").text = "91"
    etree.SubElement(root, f"{{{cbc}}}Note").text = f"Nota Crédito - {motivo}"
    etree.SubElement(root, f"{{{cbc}}}DocumentCurrencyCode",
                     listID="ISO 4217 Alpha", listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe").text = "COP"
    etree.SubElement(root, f"{{{cbc}}}LineCountNumeric").text = str(len(productos))

    # Motivo de la nota crédito
    dr = etree.SubElement(root, f"{{{cac}}}DiscrepancyResponse")
    etree.SubElement(dr, f"{{{cbc}}}ReferenceID").text = factura_referencia
    etree.SubElement(dr, f"{{{cbc}}}ResponseCode").text = codigo_motivo
    etree.SubElement(dr, f"{{{cbc}}}Description").text = motivo

    # Referencia a factura original
    br = etree.SubElement(root, f"{{{cac}}}BillingReference")
    ir = etree.SubElement(br, f"{{{cac}}}InvoiceDocumentReference")
    etree.SubElement(ir, f"{{{cbc}}}ID").text = factura_referencia
    etree.SubElement(ir, f"{{{cbc}}}UUID", schemeName="CUFE-SHA384").text = cufe_factura
    etree.SubElement(ir, f"{{{cbc}}}IssueDate").text = fecha_factura

    # Emisor
    supplier = etree.SubElement(root, f"{{{cac}}}AccountingSupplierParty")
    etree.SubElement(supplier, f"{{{cbc}}}AdditionalAccountID").text = EMPRESA["tipo_persona"]
    supplier_party = etree.SubElement(supplier, f"{{{cac}}}Party")
    sp_name = etree.SubElement(supplier_party, f"{{{cac}}}PartyName")
    etree.SubElement(sp_name, f"{{{cbc}}}Name").text = EMPRESA["nombre_comercial"]
    sp_legal = etree.SubElement(supplier_party, f"{{{cac}}}PartyLegalEntity")
    etree.SubElement(sp_legal, f"{{{cbc}}}RegistrationName").text = EMPRESA["razon_social"]
    etree.SubElement(sp_legal, f"{{{cbc}}}CompanyID",
                     schemeAgencyID="195", schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]
    sp_tax = etree.SubElement(supplier_party, f"{{{cac}}}PartyTaxScheme")
    etree.SubElement(sp_tax, f"{{{cbc}}}RegistrationName").text = EMPRESA["razon_social"]
    etree.SubElement(sp_tax, f"{{{cbc}}}CompanyID",
                     schemeAgencyID="195", schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]
    sp_ts = etree.SubElement(sp_tax, f"{{{cac}}}TaxScheme")
    etree.SubElement(sp_ts, f"{{{cbc}}}ID").text = "01"
    etree.SubElement(sp_ts, f"{{{cbc}}}Name").text = "IVA"
    sp_contact = etree.SubElement(supplier_party, f"{{{cac}}}Contact")
    etree.SubElement(sp_contact, f"{{{cbc}}}ElectronicMail").text = EMPRESA["email"]

    # Receptor
    customer = etree.SubElement(root, f"{{{cac}}}AccountingCustomerParty")
    etree.SubElement(customer, f"{{{cbc}}}AdditionalAccountID").text = "2"
    customer_party = etree.SubElement(customer, f"{{{cac}}}Party")
    cp_name = etree.SubElement(customer_party, f"{{{cac}}}PartyName")
    etree.SubElement(cp_name, f"{{{cbc}}}Name").text = cliente.get("nombre", "Consumidor Final")
    cp_legal = etree.SubElement(customer_party, f"{{{cac}}}PartyLegalEntity")
    etree.SubElement(cp_legal, f"{{{cbc}}}RegistrationName").text = cliente.get("nombre", "Consumidor Final")
    etree.SubElement(cp_legal, f"{{{cbc}}}CompanyID",
                     schemeAgencyID="195", schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="0", schemeName="13").text = nit_adquiriente
    cp_contact = etree.SubElement(customer_party, f"{{{cac}}}Contact")
    etree.SubElement(cp_contact, f"{{{cbc}}}ElectronicMail").text = cliente.get("email", "")

    # Impuestos
    tax_total = etree.SubElement(root, f"{{{cac}}}TaxTotal")
    etree.SubElement(tax_total, f"{{{cbc}}}TaxAmount", currencyID="COP").text = f"{iva:.2f}"
    tax_sub = etree.SubElement(tax_total, f"{{{cac}}}TaxSubtotal")
    etree.SubElement(tax_sub, f"{{{cbc}}}TaxableAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(tax_sub, f"{{{cbc}}}TaxAmount", currencyID="COP").text = f"{iva:.2f}"
    tax_cat = etree.SubElement(tax_sub, f"{{{cac}}}TaxCategory")
    etree.SubElement(tax_cat, f"{{{cbc}}}Percent").text = "19.00"
    ts = etree.SubElement(tax_cat, f"{{{cac}}}TaxScheme")
    etree.SubElement(ts, f"{{{cbc}}}ID").text = "01"
    etree.SubElement(ts, f"{{{cbc}}}Name").text = "IVA"

    # Totales
    legal_total = etree.SubElement(root, f"{{{cac}}}LegalMonetaryTotal")
    etree.SubElement(legal_total, f"{{{cbc}}}LineExtensionAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(legal_total, f"{{{cbc}}}TaxExclusiveAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(legal_total, f"{{{cbc}}}TaxInclusiveAmount", currencyID="COP").text = f"{total:.2f}"
    etree.SubElement(legal_total, f"{{{cbc}}}PayableAmount", currencyID="COP").text = f"{total:.2f}"

    # Líneas
    for i, producto in enumerate(productos, 1):
        precio_unit = producto["precio_unitario"]
        cantidad = producto["cantidad"]
        subtotal_linea = precio_unit * cantidad
        iva_linea = round(subtotal_linea * IVA_RATE, 2)

        line = etree.SubElement(root, f"{{{cac}}}CreditNoteLine")
        etree.SubElement(line, f"{{{cbc}}}ID").text = str(i)
        etree.SubElement(line, f"{{{cbc}}}CreditedQuantity", unitCode="94").text = str(cantidad)
        etree.SubElement(line, f"{{{cbc}}}LineExtensionAmount", currencyID="COP").text = f"{subtotal_linea:.2f}"

        line_tax = etree.SubElement(line, f"{{{cac}}}TaxTotal")
        etree.SubElement(line_tax, f"{{{cbc}}}TaxAmount", currencyID="COP").text = f"{iva_linea:.2f}"
        lt_sub = etree.SubElement(line_tax, f"{{{cac}}}TaxSubtotal")
        etree.SubElement(lt_sub, f"{{{cbc}}}TaxableAmount", currencyID="COP").text = f"{subtotal_linea:.2f}"
        etree.SubElement(lt_sub, f"{{{cbc}}}TaxAmount", currencyID="COP").text = f"{iva_linea:.2f}"
        lt_cat = etree.SubElement(lt_sub, f"{{{cac}}}TaxCategory")
        etree.SubElement(lt_cat, f"{{{cbc}}}Percent").text = "19.00"
        lt_ts = etree.SubElement(lt_cat, f"{{{cac}}}TaxScheme")
        etree.SubElement(lt_ts, f"{{{cbc}}}ID").text = "01"
        etree.SubElement(lt_ts, f"{{{cbc}}}Name").text = "IVA"

        line_item = etree.SubElement(line, f"{{{cac}}}Item")
        etree.SubElement(line_item, f"{{{cbc}}}Description").text = producto.get("nombre", "Producto")
        li_id = etree.SubElement(line_item, f"{{{cac}}}SellersItemIdentification")
        etree.SubElement(li_id, f"{{{cbc}}}ID").text = str(producto.get("id", i))

        line_price = etree.SubElement(line, f"{{{cac}}}Price")
        etree.SubElement(line_price, f"{{{cbc}}}PriceAmount", currencyID="COP").text = f"{precio_unit:.2f}"
        etree.SubElement(line_price, f"{{{cbc}}}BaseQuantity", unitCode="94").text = "1"

    xml_string = etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode()
    return xml_string, cude, numero_completo, subtotal, iva, total
