"""
Generador de Notas Crédito UBL 2.1 — DIAN Colombia
Estructura basada exactamente en ejemplo oficial CreditNote.xml de la DIAN
"""
import hashlib
from datetime import datetime
from typing import List, Dict
from lxml import etree
from generador_xml import EMPRESA, DIAN_CONFIG, IVA_RATE, CBC, CAC, EXT

# Namespace sts para notas crédito/débito es el v1 (según ejemplo CreditNote.xml)
STS_NC = "http://www.dian.gov.co/contratos/facturaelectronica/v1/Structures"


def generar_nota_credito(numero, factura_referencia, cufe_factura, fecha_factura,
                         cliente, productos, motivo="Devolución de mercancía",
                         codigo_motivo="2", fecha=None):
    if fecha is None:
        fecha = datetime.now()

    numero_completo = f"{DIAN_CONFIG['prefijo']}{numero}"
    fecha_str = fecha.strftime("%Y-%m-%d")
    hora_str = fecha.strftime("%H:%M:%S-05:00")

    # Precios con IVA incluido — desagregar base gravable
    total = round(sum(p["precio_unitario"] * p["cantidad"] for p in productos), 2)
    subtotal = round(total / (1 + IVA_RATE), 2)
    iva = round(total - subtotal, 2)
    nit_adquiriente = cliente.get("nit_cc", "222222222222")

    cadena_cude = (
        f"{numero_completo}{fecha_str}{hora_str}"
        f"{subtotal:.2f}01{iva:.2f}040.00030.00"
        f"{total:.2f}{EMPRESA['nit']}{nit_adquiriente}"
        f"{DIAN_CONFIG['clave_tecnica']}{DIAN_CONFIG['ambiente']}"
    )
    cude = hashlib.sha384(cadena_cude.encode()).hexdigest()

    security_code = hashlib.sha384(
        f"{DIAN_CONFIG['software_id']}{DIAN_CONFIG['pin']}{numero_completo}".encode()
    ).hexdigest()

    nsmap = {
        None: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
        "cac": CAC,
        "cbc": CBC,
        "ds": "http://www.w3.org/2000/09/xmldsig#",
        "ext": EXT,
        "sts": STS_NC,
        "xades": "http://uri.etsi.org/01903/v1.3.2#",
        "xades141": "http://uri.etsi.org/01903/v1.4.1#",
        "xsi": "http://www.w3.org/2001/XMLSchema-instance",
    }

    root = etree.Element("CreditNote", nsmap=nsmap)
    root.set("{http://www.w3.org/2001/XMLSchema-instance}schemaLocation",
             "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2    "
             "http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-CreditNote-2.1.xsd")

    # UBLExtensions — SIN InvoiceControl (notas no lo tienen según ejemplo)
    uble = etree.SubElement(root, f"{{{EXT}}}UBLExtensions")
    uble_item = etree.SubElement(uble, f"{{{EXT}}}UBLExtension")
    uble_content = etree.SubElement(uble_item, f"{{{EXT}}}ExtensionContent")
    dian = etree.SubElement(uble_content, f"{{{STS_NC}}}DianExtensions")

    inv_src = etree.SubElement(dian, f"{{{STS_NC}}}InvoiceSource")
    etree.SubElement(inv_src, f"{{{CBC}}}IdentificationCode",
                     listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe",
                     listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1").text = "CO"

    swp = etree.SubElement(dian, f"{{{STS_NC}}}SoftwareProvider")
    etree.SubElement(swp, f"{{{STS_NC}}}ProviderID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID=EMPRESA["dv"], schemeName="31").text = EMPRESA["nit"]
    etree.SubElement(swp, f"{{{STS_NC}}}SoftwareID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)").text = DIAN_CONFIG["software_id"]

    etree.SubElement(dian, f"{{{STS_NC}}}SoftwareSecurityCode",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)").text = security_code

    auth_prov = etree.SubElement(dian, f"{{{STS_NC}}}AuthorizationProvider")
    etree.SubElement(auth_prov, f"{{{STS_NC}}}AuthorizationProviderID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="4", schemeName="31").text = "800197268"

    qr_text = (f"NroFactura={numero_completo}\n"
               f"\t\t\t\t\t\t\t\tNitFacturador={EMPRESA['nit']}\n"
               f"\t\t\t\t\t\t\t\tNitAdquiriente={nit_adquiriente}\n"
               f"\t\t\t\t\t\t\t\tFechaFactura={fecha_str}\n"
               f"\t\t\t\t\t\t\t\tValorTotalFactura={total:.2f}\n"
               f"\t\t\t\t\t\t\t\tCUFE={cude}")
    etree.SubElement(dian, f"{{{STS_NC}}}QRCode").text = qr_text

    # Campos principales
    etree.SubElement(root, f"{{{CBC}}}UBLVersionID").text = "UBL 2.1"
    etree.SubElement(root, f"{{{CBC}}}CustomizationID").text = "11"
    etree.SubElement(root, f"{{{CBC}}}ProfileID").text = "DIAN 2.1"
    etree.SubElement(root, f"{{{CBC}}}ProfileExecutionID").text = DIAN_CONFIG["ambiente"]
    etree.SubElement(root, f"{{{CBC}}}ID").text = numero_completo
    etree.SubElement(root, f"{{{CBC}}}UUID", schemeID=DIAN_CONFIG["ambiente"], schemeName="CUDE-SHA384").text = cude
    etree.SubElement(root, f"{{{CBC}}}IssueDate").text = fecha_str
    etree.SubElement(root, f"{{{CBC}}}IssueTime").text = hora_str
    etree.SubElement(root, f"{{{CBC}}}CreditNoteTypeCode").text = "91"
    note = (f"{numero_completo}{fecha_str}{hora_str}"
            f"{subtotal:.2f}01{iva:.2f}040.00030.00{total:.2f}"
            f"{EMPRESA['nit']}{nit_adquiriente}{DIAN_CONFIG['clave_tecnica']}{DIAN_CONFIG['ambiente']}")
    etree.SubElement(root, f"{{{CBC}}}Note").text = note
    etree.SubElement(root, f"{{{CBC}}}DocumentCurrencyCode",
                     listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe",
                     listID="ISO 4217 Alpha").text = "COP"
    etree.SubElement(root, f"{{{CBC}}}LineCountNumeric").text = str(len(productos))

    # DiscrepancyResponse
    dr = etree.SubElement(root, f"{{{CAC}}}DiscrepancyResponse")
    etree.SubElement(dr, f"{{{CBC}}}ReferenceID").text = factura_referencia
    etree.SubElement(dr, f"{{{CBC}}}ResponseCode").text = codigo_motivo
    etree.SubElement(dr, f"{{{CBC}}}Description").text = motivo

    # BillingReference
    br = etree.SubElement(root, f"{{{CAC}}}BillingReference")
    ir = etree.SubElement(br, f"{{{CAC}}}InvoiceDocumentReference")
    etree.SubElement(ir, f"{{{CBC}}}ID").text = factura_referencia
    etree.SubElement(ir, f"{{{CBC}}}UUID", schemeName="CUFE-SHA384").text = cufe_factura
    etree.SubElement(ir, f"{{{CBC}}}IssueDate").text = fecha_factura

    # AccountingSupplierParty
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

    # AccountingCustomerParty
    customer = etree.SubElement(root, f"{{{CAC}}}AccountingCustomerParty")
    etree.SubElement(customer, f"{{{CBC}}}AdditionalAccountID").text = "2"
    cp = etree.SubElement(customer, f"{{{CAC}}}Party")
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

    # PaymentMeans
    pm = etree.SubElement(root, f"{{{CAC}}}PaymentMeans")
    etree.SubElement(pm, f"{{{CBC}}}ID").text = "2"
    etree.SubElement(pm, f"{{{CBC}}}PaymentMeansCode").text = "41"
    etree.SubElement(pm, f"{{{CBC}}}PaymentDueDate").text = fecha_str

    # TaxTotal
    tax_total = etree.SubElement(root, f"{{{CAC}}}TaxTotal")
    etree.SubElement(tax_total, f"{{{CBC}}}TaxAmount", currencyID="COP").text = f"{iva:.2f}"
    tax_sub = etree.SubElement(tax_total, f"{{{CAC}}}TaxSubtotal")
    etree.SubElement(tax_sub, f"{{{CBC}}}TaxableAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(tax_sub, f"{{{CBC}}}TaxAmount", currencyID="COP").text = f"{iva:.2f}"
    tax_cat = etree.SubElement(tax_sub, f"{{{CAC}}}TaxCategory")
    etree.SubElement(tax_cat, f"{{{CBC}}}Percent").text = "19.00"
    ts_el = etree.SubElement(tax_cat, f"{{{CAC}}}TaxScheme")
    etree.SubElement(ts_el, f"{{{CBC}}}ID").text = "01"
    etree.SubElement(ts_el, f"{{{CBC}}}Name").text = "IVA"

    # LegalMonetaryTotal
    lmt = etree.SubElement(root, f"{{{CAC}}}LegalMonetaryTotal")
    etree.SubElement(lmt, f"{{{CBC}}}LineExtensionAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(lmt, f"{{{CBC}}}TaxExclusiveAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(lmt, f"{{{CBC}}}TaxInclusiveAmount", currencyID="COP").text = f"{total:.2f}"
    etree.SubElement(lmt, f"{{{CBC}}}PayableAmount", currencyID="COP").text = f"{total:.2f}"

    # CreditNoteLines
    for i, producto in enumerate(productos, 1):
        precio_unit = producto["precio_unitario"]
        cantidad = producto["cantidad"]
        subtotal_linea = precio_unit * cantidad
        iva_linea = round(subtotal_linea * IVA_RATE, 2)

        line = etree.SubElement(root, f"{{{CAC}}}CreditNoteLine")
        etree.SubElement(line, f"{{{CBC}}}ID").text = str(i)
        etree.SubElement(line, f"{{{CBC}}}CreditedQuantity", unitCode="NIU").text = f"{cantidad:.6f}"
        etree.SubElement(line, f"{{{CBC}}}LineExtensionAmount", currencyID="COP").text = f"{subtotal_linea:.2f}"

        lt = etree.SubElement(line, f"{{{CAC}}}TaxTotal")
        etree.SubElement(lt, f"{{{CBC}}}TaxAmount", currencyID="COP").text = f"{iva_linea:.2f}"
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

    xml_string = etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode()
    return xml_string, cude, numero_completo, subtotal, iva, total
