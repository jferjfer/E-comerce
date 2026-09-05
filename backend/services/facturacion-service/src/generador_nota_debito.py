"""
Generador Nota Débito UBL 2.1 — DIAN Colombia
Basado EXACTAMENTE en DebitNote.xml oficial DIAN.
Idéntico a nota crédito excepto: DebitNoteLine, RequestedMonetaryTotal, DebitNoteTypeCode no existe.
"""
import hashlib
from datetime import datetime
from lxml import etree
from generador_xml import (
    EMPRESA, DIAN_CONFIG, IVA_RATE,
    CBC, CAC, EXT, NS_CBC, NS_CAC, NS_EXT,
    _sub, _calcular_lineas, _supplier_party
)
from generador_nota_credito import STS_NC


def generar_nota_debito(numero, factura_referencia, cufe_factura, fecha_factura,
                        cliente, productos, motivo="Intereses por mora",
                        codigo_motivo="1", fecha=None):
    if fecha is None:
        fecha = datetime.now()

    numero_completo = f"{DIAN_CONFIG['prefijo']}{numero}"
    fecha_str = fecha.strftime("%Y-%m-%d")
    hora_str  = fecha.strftime("%H:%M:%S-05:00")
    nit_adq   = (cliente.get("nit_cc") or "2222222222").strip()

    lineas, subtotal, iva, total = _calcular_lineas(productos)

    cadena_cude = (
        f"{numero_completo}{fecha_str}{hora_str}"
        f"{subtotal:.2f}01{iva:.2f}040.00030.00"
        f"{total:.2f}{EMPRESA['nit']}{nit_adq}"
        f"{DIAN_CONFIG['clave_tecnica']}{DIAN_CONFIG['ambiente']}"
    )
    cude = hashlib.sha384(cadena_cude.encode()).hexdigest()

    security_code = hashlib.sha384(
        f"{DIAN_CONFIG['software_id']}{DIAN_CONFIG['pin']}{numero_completo}".encode()
    ).hexdigest()

    qr_text = (
        f"NroFactura={numero_completo}\n"
        f"\t\t\t\t\t\t\t\tNitFacturador={EMPRESA['nit']}\n"
        f"\t\t\t\t\t\t\t\tNitAdquiriente={nit_adq}\n"
        f"\t\t\t\t\t\t\t\tFechaFactura={fecha_str}\n"
        f"\t\t\t\t\t\t\t\tValorTotalFactura={total:.2f}\n"
        f"\t\t\t\t\t\t\t\tCUFE={cude}\n"
        f"\t\t\t\t\t\t\t\tURL=https://catalogo-vpfe-hab.dian.gov.co/Document/FindDocument"
        f"?documentKey={cude}&partitionKey=co|06|{cude[:2]}&emissionDate={fecha_str.replace('-','')}"
    )

    nsmap = {
        None:       "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2",
        "cac":      NS_CAC, "cbc": NS_CBC,
        "ds":       "http://www.w3.org/2000/09/xmldsig#",
        "ext":      NS_EXT, "sts": STS_NC,
        "xades":    "http://uri.etsi.org/01903/v1.3.2#",
        "xades141": "http://uri.etsi.org/01903/v1.4.1#",
        "xsi":      "http://www.w3.org/2001/XMLSchema-instance",
    }
    root = etree.Element("DebitNote", nsmap=nsmap)
    root.set("{http://www.w3.org/2001/XMLSchema-instance}schemaLocation",
             "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2    "
             "http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-DebitNote-2.1.xsd")

    uble      = etree.SubElement(root, f"{{{NS_EXT}}}UBLExtensions")
    uble_item = etree.SubElement(uble, f"{{{NS_EXT}}}UBLExtension")
    uble_cont = etree.SubElement(uble_item, f"{{{NS_EXT}}}ExtensionContent")
    dian      = etree.SubElement(uble_cont, f"{{{STS_NC}}}DianExtensions")

    inv_src = etree.SubElement(dian, f"{{{STS_NC}}}InvoiceSource")
    etree.SubElement(inv_src, f"{CBC}IdentificationCode",
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

    etree.SubElement(dian, f"{{{STS_NC}}}QRCode").text = qr_text

    etree.SubElement(root, f"{CBC}UBLVersionID").text       = "UBL 2.1"
    etree.SubElement(root, f"{CBC}CustomizationID").text    = "20"
    etree.SubElement(root, f"{CBC}ProfileID").text          = "DIAN 2.1: Nota Débito de Factura Electrónica de Venta"
    etree.SubElement(root, f"{CBC}ProfileExecutionID").text = DIAN_CONFIG["ambiente"]
    etree.SubElement(root, f"{CBC}ID").text                 = numero_completo
    etree.SubElement(root, f"{CBC}UUID",
                     schemeID=DIAN_CONFIG["ambiente"],
                     schemeName="CUDE-SHA384").text = cude
    etree.SubElement(root, f"{CBC}IssueDate").text = fecha_str
    etree.SubElement(root, f"{CBC}IssueTime").text = hora_str

    note = (
        f"{numero_completo}{fecha_str}{hora_str}"
        f"{subtotal:.2f}01{iva:.2f}040.00030.00{total:.2f}"
        f"{EMPRESA['nit']}{nit_adq}{DIAN_CONFIG['clave_tecnica']}{DIAN_CONFIG['ambiente']}"
    )
    etree.SubElement(root, f"{CBC}Note").text = note
    etree.SubElement(root, f"{CBC}DocumentCurrencyCode",
                     listAgencyID="6",
                     listAgencyName="United Nations Economic Commission for Europe",
                     listID="ISO 4217 Alpha").text = "COP"
    etree.SubElement(root, f"{CBC}LineCountNumeric").text = str(len(lineas))

    dr = etree.SubElement(root, f"{CAC}DiscrepancyResponse")
    etree.SubElement(dr, f"{CBC}ReferenceID").text  = factura_referencia
    etree.SubElement(dr, f"{CBC}ResponseCode").text = codigo_motivo
    etree.SubElement(dr, f"{CBC}Description").text  = motivo

    br = etree.SubElement(root, f"{CAC}BillingReference")
    ir = etree.SubElement(br, f"{CAC}InvoiceDocumentReference")
    etree.SubElement(ir, f"{CBC}ID").text = factura_referencia
    etree.SubElement(ir, f"{CBC}UUID", schemeName="CUFE-SHA384").text = cufe_factura
    etree.SubElement(ir, f"{CBC}IssueDate").text = fecha_factura

    _supplier_party(root)

    # Customer igual que nota crédito
    customer = etree.SubElement(root, f"{CAC}AccountingCustomerParty")
    el_aid = etree.SubElement(customer, f"{CBC}AdditionalAccountID")
    el_aid.text = "1"
    el_aid.set("schemeAgencyID", "195")
    cp = etree.SubElement(customer, f"{CAC}Party")

    cp_name = etree.SubElement(cp, f"{CAC}PartyName")
    etree.SubElement(cp_name, f"{CBC}Name").text = cliente.get("nombre", "Consumidor Final")

    cp_phys = etree.SubElement(cp, f"{CAC}PhysicalLocation")
    cp_addr = etree.SubElement(cp_phys, f"{CAC}Address")
    etree.SubElement(cp_addr, f"{CBC}ID").text                   = "11001"
    etree.SubElement(cp_addr, f"{CBC}CityName").text             = "Bogotá D.C."
    etree.SubElement(cp_addr, f"{CBC}CountrySubentity").text     = "Bogotá"
    etree.SubElement(cp_addr, f"{CBC}CountrySubentityCode").text = "11"
    cp_al = etree.SubElement(cp_addr, f"{CAC}AddressLine")
    etree.SubElement(cp_al, f"{CBC}Line").text = cliente.get("direccion", "Bogotá D.C.")
    cp_co = etree.SubElement(cp_addr, f"{CAC}Country")
    etree.SubElement(cp_co, f"{CBC}IdentificationCode").text = "CO"
    etree.SubElement(cp_co, f"{CBC}Name", languageID="es").text = "Colombia"

    cp_tax = etree.SubElement(cp, f"{CAC}PartyTaxScheme")
    etree.SubElement(cp_tax, f"{CBC}RegistrationName").text = cliente.get("nombre", "Consumidor Final")
    etree.SubElement(cp_tax, f"{CBC}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="13", schemeName="13").text = nit_adq
    etree.SubElement(cp_tax, f"{CBC}TaxLevelCode", listName="05").text = "ZZ"
    cp_ra = etree.SubElement(cp_tax, f"{CAC}RegistrationAddress")
    etree.SubElement(cp_ra, f"{CBC}ID").text                   = "11001"
    etree.SubElement(cp_ra, f"{CBC}CityName").text             = "Bogotá D.C."
    etree.SubElement(cp_ra, f"{CBC}CountrySubentity").text     = "Bogotá"
    etree.SubElement(cp_ra, f"{CBC}CountrySubentityCode").text = "11"
    cp_ral = etree.SubElement(cp_ra, f"{CAC}AddressLine")
    etree.SubElement(cp_ral, f"{CBC}Line").text = cliente.get("direccion", "Bogotá D.C.")
    cp_rac = etree.SubElement(cp_ra, f"{CAC}Country")
    etree.SubElement(cp_rac, f"{CBC}IdentificationCode").text = "CO"
    etree.SubElement(cp_rac, f"{CBC}Name", languageID="es").text = "Colombia"
    cp_ts = etree.SubElement(cp_tax, f"{CAC}TaxScheme")
    etree.SubElement(cp_ts, f"{CBC}ID").text   = "01"
    etree.SubElement(cp_ts, f"{CBC}Name").text = "IVA"

    cp_legal = etree.SubElement(cp, f"{CAC}PartyLegalEntity")
    etree.SubElement(cp_legal, f"{CBC}RegistrationName").text = cliente.get("nombre", "Consumidor Final")
    etree.SubElement(cp_legal, f"{CBC}CompanyID",
                     schemeAgencyID="195",
                     schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
                     schemeID="13", schemeName="13").text = nit_adq
    cp_crs = etree.SubElement(cp_legal, f"{CAC}CorporateRegistrationScheme")
    etree.SubElement(cp_crs, f"{CBC}Name").text = "90518"

    cp_contact = etree.SubElement(cp, f"{CAC}Contact")
    etree.SubElement(cp_contact, f"{CBC}Telephone").text      = EMPRESA["telefono"]
    etree.SubElement(cp_contact, f"{CBC}ElectronicMail").text = cliente.get("email", EMPRESA["email"])

    pm = etree.SubElement(root, f"{CAC}PaymentMeans")
    etree.SubElement(pm, f"{CBC}ID").text               = "2"
    etree.SubElement(pm, f"{CBC}PaymentMeansCode").text = "41"
    etree.SubElement(pm, f"{CBC}PaymentDueDate").text   = fecha_str

    tt = etree.SubElement(root, f"{CAC}TaxTotal")
    etree.SubElement(tt, f"{CBC}TaxAmount", currencyID="COP").text = f"{iva:.2f}"
    ts = etree.SubElement(tt, f"{CAC}TaxSubtotal")
    etree.SubElement(ts, f"{CBC}TaxableAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(ts, f"{CBC}TaxAmount",     currencyID="COP").text = f"{iva:.2f}"
    tc = etree.SubElement(ts, f"{CAC}TaxCategory")
    etree.SubElement(tc, f"{CBC}Percent").text = "19.00"
    tsc = etree.SubElement(tc, f"{CAC}TaxScheme")
    etree.SubElement(tsc, f"{CBC}ID").text   = "01"
    etree.SubElement(tsc, f"{CBC}Name").text = "IVA"

    # RequestedMonetaryTotal (nota débito usa este, no LegalMonetaryTotal)
    rmt = etree.SubElement(root, f"{CAC}RequestedMonetaryTotal")
    etree.SubElement(rmt, f"{CBC}LineExtensionAmount", currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(rmt, f"{CBC}TaxExclusiveAmount",  currencyID="COP").text = f"{subtotal:.2f}"
    etree.SubElement(rmt, f"{CBC}TaxInclusiveAmount",  currencyID="COP").text = f"{total:.2f}"
    etree.SubElement(rmt, f"{CBC}PayableAmount",       currencyID="COP").text = f"{total:.2f}"

    for i, l in enumerate(lineas, 1):
        line = etree.SubElement(root, f"{CAC}DebitNoteLine")
        etree.SubElement(line, f"{CBC}ID").text = str(i)
        etree.SubElement(line, f"{CBC}DebitedQuantity",
                         unitCode="NIU").text = f"{l['cantidad']:.6f}"
        etree.SubElement(line, f"{CBC}LineExtensionAmount",
                         currencyID="COP").text = f"{l['base_linea']:.2f}"

        lt = etree.SubElement(line, f"{CAC}TaxTotal")
        etree.SubElement(lt, f"{CBC}TaxAmount", currencyID="COP").text = f"{l['iva_linea']:.2f}"
        lt_sub = etree.SubElement(lt, f"{CAC}TaxSubtotal")
        etree.SubElement(lt_sub, f"{CBC}TaxableAmount", currencyID="COP").text = f"{l['base_linea']:.2f}"
        etree.SubElement(lt_sub, f"{CBC}TaxAmount",     currencyID="COP").text = f"{l['iva_linea']:.2f}"
        lt_cat = etree.SubElement(lt_sub, f"{CAC}TaxCategory")
        etree.SubElement(lt_cat, f"{CBC}Percent").text = "19.00"
        lt_ts = etree.SubElement(lt_cat, f"{CAC}TaxScheme")
        etree.SubElement(lt_ts, f"{CBC}ID").text   = "01"
        etree.SubElement(lt_ts, f"{CBC}Name").text = "IVA"

        item = etree.SubElement(line, f"{CAC}Item")
        etree.SubElement(item, f"{CBC}Description").text = l["nombre"]
        item_id = etree.SubElement(item, f"{CAC}SellersItemIdentification")
        etree.SubElement(item_id, f"{CBC}ID").text = l["id"] or str(i)

        price = etree.SubElement(line, f"{CAC}Price")
        etree.SubElement(price, f"{CBC}PriceAmount",
                         currencyID="COP").text = f"{l['base_unit']:.2f}"
        etree.SubElement(price, f"{CBC}BaseQuantity",
                         unitCode="NIU").text = "1.000000"

    xml_string = etree.tostring(root, pretty_print=True,
                                xml_declaration=True, encoding="UTF-8").decode()
    return xml_string, cude, numero_completo, subtotal, iva, total
