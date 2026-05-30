"""
Generador XML UBL 2.1 — Factura Electrónica DIAN Colombia
Basado EXACTAMENTE en XMLs oficiales DIAN:
  - Consumidor Final.xml  → factura a consumidor final
  - CreditNote.xml        → nota crédito
  - DebitNote.xml         → nota débito
"""
import hashlib
import os
from datetime import datetime
from lxml import etree

# ── Empresa emisora ──────────────────────────────────────────────────────────
EMPRESA = {
    "nit":              "902051708",
    "dv":               "6",
    "razon_social":     "VERTEL & CATILLO S.A.S",
    "nombre_comercial": "EGOS",
    "direccion":        "CRA 107 A BIS 69B 58",
    "ciudad":           "Bogotá D.C.",
    "departamento":     "Bogotá",
    "departamento_code":"11",
    "municipio_code":   "11001",
    "pais":             "CO",
    "telefono":         "3017879852",
    "email":            "servicioalcliente@egoscolombia.com",
    "ciiu":             "4771",
    "tipo_persona":     "1",
}

DIAN = {
    "software_id":   os.getenv("DIAN_SOFTWARE_ID",   "a474896f-e364-4f09-bf6a-bc4c30e73ca9"),
    "clave_tecnica": os.getenv("DIAN_CLAVE_TECNICA",  "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c"),
    "pin":           os.getenv("DIAN_PIN",             "13251"),
    "test_set_id":   os.getenv("DIAN_TEST_SET_ID",     "c537ef0b-2eb6-4149-9296-36d19e743ae2"),
    "prefijo":       os.getenv("DIAN_PREFIJO",         "SETP"),
    "resolucion":    os.getenv("DIAN_RESOLUCION",      "18760000001"),
    "fecha_desde":   "2019-01-19",
    "fecha_hasta":   "2030-01-19",
    "rango_desde":   "990000000",
    "rango_hasta":   "995000000",
    "ambiente":      os.getenv("DIAN_AMBIENTE",        "2"),
    "proveedor_nit": "902051708",
    "proveedor_dv":  "6",
}

# Alias compatibilidad
DIAN_CONFIG = DIAN
IVA_RATE = 0.19

# Namespaces
NS_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
NS_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
NS_EXT = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
NS_STS = "dian:gov:co:facturaelectronica:Structures-2-1"
CBC = f"{{{NS_CBC}}}"
CAC = f"{{{NS_CAC}}}"
EXT = f"{{{NS_EXT}}}"
STS = f"{{{NS_STS}}}"


def calcular_cufe(num_fac, fec_fac, hor_fac,
                  val_fac, val_imp1, val_imp4, val_imp3,
                  val_tot, nit_fac, num_adq, clave_tec, ambiente):
    cadena = (
        f"{num_fac}{fec_fac}{hor_fac}"
        f"{val_fac:.2f}01{val_imp1:.2f}"
        f"04{val_imp4:.2f}03{val_imp3:.2f}"
        f"{val_tot:.2f}{nit_fac}{num_adq}{clave_tec}{ambiente}"
    )
    return hashlib.sha384(cadena.encode("utf-8")).hexdigest()


def _sub(parent, tag, text=None, **attribs):
    el = etree.SubElement(parent, tag, **attribs)
    if text is not None:
        el.text = str(text)
    return el


def _calcular_lineas(productos):
    """Desagrega IVA de precios con IVA incluido."""
    lineas = []
    for p in productos:
        piva  = float(p["precio_unitario"])
        cant  = int(p["cantidad"])
        base_u = round(piva / (1 + IVA_RATE), 2)
        base_l = round(base_u * cant, 2)
        iva_l  = round(base_l * IVA_RATE, 2)
        lineas.append({
            "nombre":    p.get("nombre", "Producto"),
            "id":        str(p.get("id", "")),
            "cantidad":  cant,
            "base_unit": base_u,
            "base_linea":base_l,
            "iva_linea": iva_l,
        })
    subtotal = round(sum(l["base_linea"] for l in lineas), 2)
    iva      = round(sum(l["iva_linea"]  for l in lineas), 2)
    total    = round(subtotal + iva, 2)
    return lineas, subtotal, iva, total


def _dian_extensions(root, numero_completo, fecha_str, nit_adquiriente,
                     subtotal, iva, total, security_code, qr_text,
                     con_invoice_control=True):
    """Bloque UBLExtensions con DianExtensions."""
    uble      = _sub(root, f"{EXT}UBLExtensions")
    uble_item = _sub(uble, f"{EXT}UBLExtension")
    uble_cont = _sub(uble_item, f"{EXT}ExtensionContent")
    dian_ext  = _sub(uble_cont, f"{STS}DianExtensions")

    if con_invoice_control:
        ic = _sub(dian_ext, f"{STS}InvoiceControl")
        _sub(ic, f"{STS}InvoiceAuthorization", DIAN["resolucion"])
        ap = _sub(ic, f"{STS}AuthorizationPeriod")
        _sub(ap, f"{CBC}StartDate", DIAN["fecha_desde"])
        _sub(ap, f"{CBC}EndDate",   DIAN["fecha_hasta"])
        ai = _sub(ic, f"{STS}AuthorizedInvoices")
        _sub(ai, f"{STS}Prefix", DIAN["prefijo"])
        _sub(ai, f"{STS}From",   DIAN["rango_desde"])
        _sub(ai, f"{STS}To",     DIAN["rango_hasta"])

    inv_src = _sub(dian_ext, f"{STS}InvoiceSource")
    _sub(inv_src, f"{CBC}IdentificationCode", "CO",
         listAgencyID="6",
         listAgencyName="United Nations Economic Commission for Europe",
         listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1")

    swp = _sub(dian_ext, f"{STS}SoftwareProvider")
    _sub(swp, f"{STS}ProviderID", DIAN["proveedor_nit"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID=DIAN["proveedor_dv"], schemeName="31")
    _sub(swp, f"{STS}SoftwareID", DIAN["software_id"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")

    _sub(dian_ext, f"{STS}SoftwareSecurityCode", security_code,
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")

    auth_prov = _sub(dian_ext, f"{STS}AuthorizationProvider")
    _sub(auth_prov, f"{STS}AuthorizationProviderID", "800197268",
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID="4", schemeName="31")

    _sub(dian_ext, f"{STS}QRCode", qr_text)
    return uble  # para agregar el segundo UBLExtension de firma


def _supplier_party(root):
    """AccountingSupplierParty del emisor."""
    supplier = _sub(root, f"{CAC}AccountingSupplierParty")
    # AdditionalAccountID con schemeAgencyID="195" igual que ejemplo Consumidor Final
    el = _sub(supplier, f"{CBC}AdditionalAccountID", EMPRESA["tipo_persona"])
    el.set("schemeAgencyID", "195")
    sp = _sub(supplier, f"{CAC}Party")

    sp_name = _sub(sp, f"{CAC}PartyName")
    _sub(sp_name, f"{CBC}Name", EMPRESA["nombre_comercial"])

    sp_phys = _sub(sp, f"{CAC}PhysicalLocation")
    sp_addr = _sub(sp_phys, f"{CAC}Address")
    _sub(sp_addr, f"{CBC}ID",                   EMPRESA["municipio_code"])
    _sub(sp_addr, f"{CBC}CityName",             EMPRESA["ciudad"])
    _sub(sp_addr, f"{CBC}CountrySubentity",     EMPRESA["departamento"])
    _sub(sp_addr, f"{CBC}CountrySubentityCode", EMPRESA["departamento_code"])
    sp_al = _sub(sp_addr, f"{CAC}AddressLine")
    _sub(sp_al, f"{CBC}Line", EMPRESA["direccion"])
    sp_co = _sub(sp_addr, f"{CAC}Country")
    _sub(sp_co, f"{CBC}IdentificationCode", "CO")
    _sub(sp_co, f"{CBC}Name", "Colombia", languageID="es")

    sp_tax = _sub(sp, f"{CAC}PartyTaxScheme")
    _sub(sp_tax, f"{CBC}RegistrationName", EMPRESA["razon_social"])
    _sub(sp_tax, f"{CBC}CompanyID", EMPRESA["nit"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID=EMPRESA["dv"], schemeName="31")
    _sub(sp_tax, f"{CBC}TaxLevelCode", "O-13", listName="05")
    sp_ra = _sub(sp_tax, f"{CAC}RegistrationAddress")
    _sub(sp_ra, f"{CBC}ID",                   EMPRESA["municipio_code"])
    _sub(sp_ra, f"{CBC}CityName",             EMPRESA["ciudad"])
    _sub(sp_ra, f"{CBC}CountrySubentity",     EMPRESA["departamento"])
    _sub(sp_ra, f"{CBC}CountrySubentityCode", EMPRESA["departamento_code"])
    sp_ral = _sub(sp_ra, f"{CAC}AddressLine")
    _sub(sp_ral, f"{CBC}Line", EMPRESA["direccion"])
    sp_rac = _sub(sp_ra, f"{CAC}Country")
    _sub(sp_rac, f"{CBC}IdentificationCode", "CO")
    _sub(sp_rac, f"{CBC}Name", "Colombia", languageID="es")
    sp_ts = _sub(sp_tax, f"{CAC}TaxScheme")
    _sub(sp_ts, f"{CBC}ID",   "01")
    _sub(sp_ts, f"{CBC}Name", "IVA")

    sp_legal = _sub(sp, f"{CAC}PartyLegalEntity")
    _sub(sp_legal, f"{CBC}RegistrationName", EMPRESA["razon_social"])
    _sub(sp_legal, f"{CBC}CompanyID", EMPRESA["nit"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID="9", schemeName="31")
    sp_crs = _sub(sp_legal, f"{CAC}CorporateRegistrationScheme")
    _sub(sp_crs, f"{CBC}ID",   DIAN["prefijo"])
    _sub(sp_crs, f"{CBC}Name", DIAN["pin"])

    sp_contact = _sub(sp, f"{CAC}Contact")
    _sub(sp_contact, f"{CBC}Telephone",      EMPRESA["telefono"])
    _sub(sp_contact, f"{CBC}ElectronicMail", EMPRESA["email"])


def _customer_consumidor_final(root, nit_adquiriente, nombre="Consumidor Final"):
    """
    AccountingCustomerParty para consumidor final.
    Basado EXACTAMENTE en Consumidor Final.xml:
      - AdditionalAccountID = 2
      - Solo PartyTaxScheme (sin PhysicalLocation, sin PartyLegalEntity)
      - CompanyID schemeName="13" SIN schemeID
      - TaxLevelCode listName="49" R-99-PN
      - TaxScheme ZY / No causa
    """
    customer = _sub(root, f"{CAC}AccountingCustomerParty")
    _sub(customer, f"{CBC}AdditionalAccountID", "2")
    cp = _sub(customer, f"{CAC}Party")

    cp_name = _sub(cp, f"{CAC}PartyName")
    _sub(cp_name, f"{CBC}Name", nombre)

    cp_tax = _sub(cp, f"{CAC}PartyTaxScheme")
    _sub(cp_tax, f"{CBC}RegistrationName", nombre)
    _sub(cp_tax, f"{CBC}CompanyID", nit_adquiriente,
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeName="13")
    _sub(cp_tax, f"{CBC}TaxLevelCode", "R-99-PN", listName="49")
    cp_ts = _sub(cp_tax, f"{CAC}TaxScheme")
    _sub(cp_ts, f"{CBC}ID",   "ZY")
    _sub(cp_ts, f"{CBC}Name", "No aplica")


def _tax_totals_factura(root, subtotal, iva):
    """Solo IVA — las líneas solo informan IVA (FAS01a)."""
    tt = _sub(root, f"{CAC}TaxTotal")
    _sub(tt, f"{CBC}TaxAmount", f"{iva:.2f}", currencyID="COP")
    ts = _sub(tt, f"{CAC}TaxSubtotal")
    _sub(ts, f"{CBC}TaxableAmount", f"{subtotal:.2f}", currencyID="COP")
    _sub(ts, f"{CBC}TaxAmount",     f"{iva:.2f}",     currencyID="COP")
    tc = _sub(ts, f"{CAC}TaxCategory")
    _sub(tc, f"{CBC}Percent", "19.00")
    tsc = _sub(tc, f"{CAC}TaxScheme")
    _sub(tsc, f"{CBC}ID",   "01")
    _sub(tsc, f"{CBC}Name", "IVA")


def _invoice_line(root, i, l):
    line = _sub(root, f"{CAC}InvoiceLine")
    _sub(line, f"{CBC}ID",                    str(i))
    _sub(line, f"{CBC}InvoicedQuantity",      f"{l['cantidad']:.6f}", unitCode="NIU")
    _sub(line, f"{CBC}LineExtensionAmount",   f"{l['base_linea']:.2f}", currencyID="COP")
    _sub(line, f"{CBC}FreeOfChargeIndicator", "false")

    lt = _sub(line, f"{CAC}TaxTotal")
    _sub(lt, f"{CBC}TaxAmount", f"{l['iva_linea']:.2f}", currencyID="COP")
    lt_sub = _sub(lt, f"{CAC}TaxSubtotal")
    _sub(lt_sub, f"{CBC}TaxableAmount", f"{l['base_linea']:.2f}", currencyID="COP")
    _sub(lt_sub, f"{CBC}TaxAmount",     f"{l['iva_linea']:.2f}", currencyID="COP")
    lt_cat = _sub(lt_sub, f"{CAC}TaxCategory")
    _sub(lt_cat, f"{CBC}Percent", "19.00")
    lt_ts = _sub(lt_cat, f"{CAC}TaxScheme")
    _sub(lt_ts, f"{CBC}ID",   "01")
    _sub(lt_ts, f"{CBC}Name", "IVA")

    item = _sub(line, f"{CAC}Item")
    _sub(item, f"{CBC}Description", l["nombre"])
    item_id = _sub(item, f"{CAC}SellersItemIdentification")
    _sub(item_id, f"{CBC}ID", l["id"] or str(i))
    std_id = _sub(item, f"{CAC}StandardItemIdentification")
    _sub(std_id, f"{CBC}ID", l["id"] or str(i),
         schemeAgencyID="10", schemeID="001", schemeName="UNSPSC")

    price = _sub(line, f"{CAC}Price")
    _sub(price, f"{CBC}PriceAmount",  f"{l['base_unit']:.2f}", currencyID="COP")
    _sub(price, f"{CBC}BaseQuantity", "1.000000", unitCode="NIU")


# ── Generador principal ───────────────────────────────────────────────────────
def generar_xml_factura(numero, pedido_id, cliente, productos, fecha=None):
    if fecha is None:
        fecha = datetime.now()

    numero_completo = f"{DIAN['prefijo']}{numero}"
    fecha_str       = fecha.strftime("%Y-%m-%d")
    hora_str        = fecha.strftime("%H:%M:%S-05:00")
    nit_adq         = (cliente.get("nit_cc") or "222222222222").strip()

    lineas, subtotal, iva, total = _calcular_lineas(productos)

    cufe = calcular_cufe(
        numero_completo, fecha_str, hora_str,
        subtotal, iva, 0.00, 0.00,
        total, EMPRESA["nit"], nit_adq,
        DIAN["clave_tecnica"], DIAN["ambiente"]
    )
    security_code = hashlib.sha384(
        f"{DIAN['software_id']}{DIAN['pin']}{numero_completo}".encode()
    ).hexdigest()

    qr_text = (
        f"NroFactura={numero_completo}\n"
        f"\t\t\t\t\t\t\t\tNitFacturador={EMPRESA['nit']}\n"
        f"\t\t\t\t\t\t\t\tNitAdquiriente={nit_adq}\n"
        f"\t\t\t\t\t\t\t\tFechaFactura={fecha_str}\n"
        f"\t\t\t\t\t\t\t\tValorTotalFactura={total:.2f}\n"
        f"\t\t\t\t\t\t\t\tCUFE={cufe}\n"
        f"\t\t\t\t\t\t\t\tURL=https://catalogo-vpfe-hab.dian.gov.co/Document/FindDocument"
        f"?documentKey={cufe}&partitionKey=co|06|{cufe[:2]}&emissionDate={fecha_str.replace('-','')}"
    )

    NS = {
        None:       "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
        "cac":      NS_CAC, "cbc": NS_CBC, "ds": "http://www.w3.org/2000/09/xmldsig#",
        "ext":      NS_EXT, "sts": NS_STS,
        "xades":    "http://uri.etsi.org/01903/v1.3.2#",
        "xades141": "http://uri.etsi.org/01903/v1.4.1#",
        "xsi":      "http://www.w3.org/2001/XMLSchema-instance",
    }
    root = etree.Element("Invoice", nsmap=NS)
    root.set("{http://www.w3.org/2001/XMLSchema-instance}schemaLocation",
             "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2     "
             "http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd")

    _dian_extensions(root, numero_completo, fecha_str, nit_adq,
                     subtotal, iva, total, security_code, qr_text,
                     con_invoice_control=True)

    _sub(root, f"{CBC}UBLVersionID",       "UBL 2.1")
    _sub(root, f"{CBC}CustomizationID",    "10")
    _sub(root, f"{CBC}ProfileID",          "DIAN 2.1: Factura Electrónica de Venta")
    _sub(root, f"{CBC}ProfileExecutionID", DIAN["ambiente"])
    _sub(root, f"{CBC}ID",                 numero_completo)
    _sub(root, f"{CBC}UUID",               cufe,
         schemeID=DIAN["ambiente"], schemeName="CUFE-SHA384")
    _sub(root, f"{CBC}IssueDate",          fecha_str)
    _sub(root, f"{CBC}IssueTime",          hora_str)
    _sub(root, f"{CBC}InvoiceTypeCode",    "01")

    note = (
        f"{numero_completo}{fecha_str}{hora_str}"
        f"{subtotal:.2f}01{iva:.2f}04{0.00:.2f}03{0.00:.2f}"
        f"{total:.2f}{EMPRESA['nit']}{nit_adq}{DIAN['clave_tecnica']}{DIAN['ambiente']}"
    )
    _sub(root, f"{CBC}Note", note)
    _sub(root, f"{CBC}DocumentCurrencyCode", "COP",
         listAgencyID="6",
         listAgencyName="United Nations Economic Commission for Europe",
         listID="ISO 4217 Alpha")
    _sub(root, f"{CBC}LineCountNumeric", str(len(lineas)))

    inv_period = _sub(root, f"{CAC}InvoicePeriod")
    _sub(inv_period, f"{CBC}StartDate", fecha_str)
    _sub(inv_period, f"{CBC}EndDate",   fecha_str)

    order_ref = _sub(root, f"{CAC}OrderReference")
    _sub(order_ref, f"{CBC}ID", pedido_id)

    _supplier_party(root)
    _customer_consumidor_final(root, nit_adq, cliente.get("nombre", "Consumidor Final"))

    pm = _sub(root, f"{CAC}PaymentMeans")
    _sub(pm, f"{CBC}ID",               "1")
    _sub(pm, f"{CBC}PaymentMeansCode", "10")
    _sub(pm, f"{CBC}PaymentDueDate",   fecha_str)

    _tax_totals_factura(root, subtotal, iva)

    lmt = _sub(root, f"{CAC}LegalMonetaryTotal")
    _sub(lmt, f"{CBC}LineExtensionAmount", f"{subtotal:.2f}", currencyID="COP")
    _sub(lmt, f"{CBC}TaxExclusiveAmount",  f"{subtotal:.2f}", currencyID="COP")
    _sub(lmt, f"{CBC}TaxInclusiveAmount",  f"{total:.2f}",   currencyID="COP")
    _sub(lmt, f"{CBC}PayableAmount",       f"{total:.2f}",   currencyID="COP")

    for i, l in enumerate(lineas, 1):
        _invoice_line(root, i, l)

    xml_bytes = etree.tostring(root, pretty_print=True,
                               xml_declaration=True, encoding="UTF-8")
    return xml_bytes.decode("utf-8"), cufe, numero_completo, qr_text, subtotal, iva, total
