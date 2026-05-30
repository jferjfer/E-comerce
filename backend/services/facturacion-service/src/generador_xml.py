"""
Generador XML UBL 2.1 — Factura Electrónica DIAN Colombia
Corregido contra ejemplos oficiales DIAN y datos reales del portal habilitación.

DATOS REALES PORTAL DIAN:
  NIT emisor     : 902051708-6
  Software ID    : a474896f-e364-4f09-bf6a-bc4c30e73ca9
  Clave técnica  : fc8eac422eba16e22ffd8c6f94b3f40a6e38162c
  PIN            : 13251
  TestSetId      : c537ef0b-2eb6-4149-9296-36d19e743ae2
  Prefijo        : SETP
  Resolución     : 18760000001
  Rango          : 990000000 – 995000000
  Ambiente       : 2 (habilitación)
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
    "tipo_persona":     "1",   # 1 = Persona Jurídica
}

# ── Configuración DIAN (datos reales del portal) ─────────────────────────────
DIAN = {
    "software_id":    os.getenv("DIAN_SOFTWARE_ID",    "a474896f-e364-4f09-bf6a-bc4c30e73ca9"),
    "clave_tecnica":  os.getenv("DIAN_CLAVE_TECNICA",  "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c"),
    "pin":            os.getenv("DIAN_PIN",             "13251"),
    "test_set_id":    os.getenv("DIAN_TEST_SET_ID",     "c537ef0b-2eb6-4149-9296-36d19e743ae2"),
    "prefijo":        os.getenv("DIAN_PREFIJO",         "SETP"),
    "resolucion":     os.getenv("DIAN_RESOLUCION",      "18760000001"),
    "fecha_desde":    "2019-01-19",
    "fecha_hasta":    "2030-01-19",
    "rango_desde":    "990000000",
    "rango_hasta":    "995000000",
    "ambiente":       os.getenv("DIAN_AMBIENTE",        "2"),
    # Software propio: ProviderID = NIT del mismo emisor (902051708-6)
    "proveedor_nit":  "902051708",
    "proveedor_dv":   "6",
}

IVA_RATE = 0.19

# Alias para compatibilidad con generador_nota_credito y generador_nota_debito
DIAN_CONFIG = DIAN

# ── Namespaces ────────────────────────────────────────────────────────────────
NS = {
    None:       "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    "cac":      "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    "cbc":      "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    "ds":       "http://www.w3.org/2000/09/xmldsig#",
    "ext":      "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
    "sts":      "dian:gov:co:facturaelectronica:Structures-2-1",
    "xades":    "http://uri.etsi.org/01903/v1.3.2#",
    "xades141": "http://uri.etsi.org/01903/v1.4.1#",
    "xsi":      "http://www.w3.org/2001/XMLSchema-instance",
}
CBC = "{urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2}"
CAC = "{urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2}"
EXT = "{urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2}"
STS = "{dian:gov:co:facturaelectronica:Structures-2-1}"


# ── CUFE ──────────────────────────────────────────────────────────────────────
def calcular_cufe(num_fac, fec_fac, hor_fac,
                  val_fac, val_imp1, val_imp4, val_imp3,
                  val_tot, nit_fac, num_adq,
                  clave_tec, ambiente):
    """
    Fórmula exacta Anexo Técnico DIAN v1.9:
    NumFac + FecFac + HorFac + ValFac + CodImp1(01) + ValImp1
    + CodImp4(04) + ValImp4 + CodImp3(03) + ValImp3
    + ValTot + NitFac + NumAdq + ClaTec + Ambiente
    """
    cadena = (
        f"{num_fac}{fec_fac}{hor_fac}"
        f"{val_fac:.2f}01{val_imp1:.2f}"
        f"04{val_imp4:.2f}03{val_imp3:.2f}"
        f"{val_tot:.2f}{nit_fac}{num_adq}{clave_tec}{ambiente}"
    )
    return hashlib.sha384(cadena.encode("utf-8")).hexdigest()


def _sub(parent, tag, text=None, **attribs):
    """Helper: crea SubElement con atributos y texto opcional."""
    el = etree.SubElement(parent, tag, **attribs)
    if text is not None:
        el.text = str(text)
    return el


# ── Generador principal ───────────────────────────────────────────────────────
def generar_xml_factura(numero, pedido_id, cliente, productos, fecha=None):
    """
    Retorna: (xml_string, cufe, numero_completo, qr_text, subtotal, iva, total)

    Los precios en `productos` se asumen CON IVA incluido (precio de venta al público).
    Se desagrega base gravable = precio / 1.19
    """
    if fecha is None:
        fecha = datetime.now()

    numero_completo  = f"{DIAN['prefijo']}{numero}"
    fecha_str        = fecha.strftime("%Y-%m-%d")
    hora_str         = fecha.strftime("%H:%M:%S-05:00")
    nit_adquiriente  = (cliente.get("nit_cc") or "222222222222").strip()

    # ── Cálculo de totales ────────────────────────────────────────────────────
    # Precio de venta incluye IVA → base = precio / 1.19
    lineas = []
    for p in productos:
        precio_con_iva = float(p["precio_unitario"])
        cantidad       = int(p["cantidad"])
        base_unit      = round(precio_con_iva / (1 + IVA_RATE), 2)
        base_linea     = round(base_unit * cantidad, 2)
        iva_linea      = round(base_linea * IVA_RATE, 2)
        total_linea    = round(precio_con_iva * cantidad, 2)
        lineas.append({
            "nombre":     p.get("nombre", "Producto"),
            "id":         str(p.get("id", "")),
            "cantidad":   cantidad,
            "precio_con_iva": precio_con_iva,
            "base_unit":  base_unit,
            "base_linea": base_linea,
            "iva_linea":  iva_linea,
            "total_linea":total_linea,
        })

    subtotal = round(sum(l["base_linea"] for l in lineas), 2)   # base gravable total
    iva      = round(sum(l["iva_linea"]  for l in lineas), 2)   # IVA total
    total    = round(subtotal + iva, 2)                          # total a pagar

    # CUFE: ValFac = subtotal (base gravable), ValTot = total con IVA
    cufe = calcular_cufe(
        numero_completo, fecha_str, hora_str,
        subtotal, iva, 0.00, 0.00,
        total, EMPRESA["nit"], nit_adquiriente,
        DIAN["clave_tecnica"], DIAN["ambiente"]
    )

    # SoftwareSecurityCode = SHA384(SoftwareID + PIN + NumFac)
    security_code = hashlib.sha384(
        f"{DIAN['software_id']}{DIAN['pin']}{numero_completo}".encode("utf-8")
    ).hexdigest()

    # QR exacto del ejemplo DIAN
    qr_text = (
        f"NroFactura={numero_completo}\n"
        f"\t\t\t\t\t\t\t\tNitFacturador={EMPRESA['nit']}\n"
        f"\t\t\t\t\t\t\t\tNitAdquiriente={nit_adquiriente}\n"
        f"\t\t\t\t\t\t\t\tFechaFactura={fecha_str}\n"
        f"\t\t\t\t\t\t\t\tValorTotalFactura={total:.2f}\n"
        f"\t\t\t\t\t\t\t\tCUFE={cufe}\n"
        f"\t\t\t\t\t\t\t\tURL=https://catalogo-vpfe-hab.dian.gov.co/Document/FindDocument"
        f"?documentKey={cufe}&partitionKey=co|06|{cufe[:2]}&emissionDate={fecha_str.replace('-', '')}"
    )

    # ── Raíz del documento ────────────────────────────────────────────────────
    root = etree.Element("Invoice", nsmap=NS)
    root.set(
        "{http://www.w3.org/2001/XMLSchema-instance}schemaLocation",
        "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2     "
        "http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd"
    )

    # ── UBLExtensions ─────────────────────────────────────────────────────────
    uble      = _sub(root, f"{EXT}UBLExtensions")
    uble_item = _sub(uble, f"{EXT}UBLExtension")
    uble_cont = _sub(uble_item, f"{EXT}ExtensionContent")
    dian_ext  = _sub(uble_cont, f"{STS}DianExtensions")

    # InvoiceControl
    ic = _sub(dian_ext, f"{STS}InvoiceControl")
    _sub(ic, f"{STS}InvoiceAuthorization", DIAN["resolucion"])
    ap = _sub(ic, f"{STS}AuthorizationPeriod")
    _sub(ap, f"{CBC}StartDate", DIAN["fecha_desde"])
    _sub(ap, f"{CBC}EndDate",   DIAN["fecha_hasta"])
    ai = _sub(ic, f"{STS}AuthorizedInvoices")
    _sub(ai, f"{STS}Prefix", DIAN["prefijo"])
    _sub(ai, f"{STS}From",   DIAN["rango_desde"])
    _sub(ai, f"{STS}To",     DIAN["rango_hasta"])

    # InvoiceSource
    inv_src = _sub(dian_ext, f"{STS}InvoiceSource")
    _sub(inv_src, f"{CBC}IdentificationCode",
         "CO",
         listAgencyID="6",
         listAgencyName="United Nations Economic Commission for Europe",
         listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1")

    # SoftwareProvider
    # Software propio: ProviderID = NIT del emisor (mismo que factura)
    swp = _sub(dian_ext, f"{STS}SoftwareProvider")
    _sub(swp, f"{STS}ProviderID",
         DIAN["proveedor_nit"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID=DIAN["proveedor_dv"],
         schemeName="31")
    _sub(swp, f"{STS}SoftwareID",
         DIAN["software_id"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")

    # SoftwareSecurityCode
    _sub(dian_ext, f"{STS}SoftwareSecurityCode",
         security_code,
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)")

    # AuthorizationProvider
    auth_prov = _sub(dian_ext, f"{STS}AuthorizationProvider")
    _sub(auth_prov, f"{STS}AuthorizationProviderID",
         "800197268",
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID="4",
         schemeName="31")

    _sub(dian_ext, f"{STS}QRCode", qr_text)

    # ── Campos principales (orden exacto del ejemplo DIAN) ────────────────────
    _sub(root, f"{CBC}UBLVersionID",       "UBL 2.1")
    _sub(root, f"{CBC}CustomizationID",    "10")   # 10 = venta a consumidor final
    _sub(root, f"{CBC}ProfileID",          "DIAN 2.1")
    _sub(root, f"{CBC}ProfileExecutionID", DIAN["ambiente"])
    _sub(root, f"{CBC}ID",                 numero_completo)
    _sub(root, f"{CBC}UUID",               cufe,
         schemeID=DIAN["ambiente"], schemeName="CUFE-SHA384")
    _sub(root, f"{CBC}IssueDate",          fecha_str)
    _sub(root, f"{CBC}IssueTime",          hora_str)
    _sub(root, f"{CBC}InvoiceTypeCode",    "01")

    # Note = cadena CUFE sin hashear (para verificación)
    note = (
        f"{numero_completo}{fecha_str}{hora_str}"
        f"{subtotal:.2f}01{iva:.2f}"
        f"04{0.00:.2f}03{0.00:.2f}"
        f"{total:.2f}{EMPRESA['nit']}{nit_adquiriente}"
        f"{DIAN['clave_tecnica']}{DIAN['ambiente']}"
    )
    _sub(root, f"{CBC}Note", note)
    _sub(root, f"{CBC}DocumentCurrencyCode", "COP",
         listAgencyID="6",
         listAgencyName="United Nations Economic Commission for Europe",
         listID="ISO 4217 Alpha")
    _sub(root, f"{CBC}LineCountNumeric", str(len(lineas)))

    # InvoicePeriod
    inv_period = _sub(root, f"{CAC}InvoicePeriod")
    _sub(inv_period, f"{CBC}StartDate", fecha_str)
    _sub(inv_period, f"{CBC}EndDate",   fecha_str)

    # OrderReference
    order_ref = _sub(root, f"{CAC}OrderReference")
    _sub(order_ref, f"{CBC}ID", pedido_id)

    # ── AccountingSupplierParty ───────────────────────────────────────────────
    supplier = _sub(root, f"{CAC}AccountingSupplierParty")
    _sub(supplier, f"{CBC}AdditionalAccountID", EMPRESA["tipo_persona"])
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
    _sub(sp_tax, f"{CBC}CompanyID",
         EMPRESA["nit"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID=EMPRESA["dv"],
         schemeName="31")
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

    # PartyLegalEntity — schemeID="9" según ejemplo Generica.xml
    sp_legal = _sub(sp, f"{CAC}PartyLegalEntity")
    _sub(sp_legal, f"{CBC}RegistrationName", EMPRESA["razon_social"])
    _sub(sp_legal, f"{CBC}CompanyID",
         EMPRESA["nit"],
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeID="9",
         schemeName="31")
    sp_crs = _sub(sp_legal, f"{CAC}CorporateRegistrationScheme")
    _sub(sp_crs, f"{CBC}ID",   DIAN["prefijo"])
    _sub(sp_crs, f"{CBC}Name", DIAN["pin"])

    sp_contact = _sub(sp, f"{CAC}Contact")
    _sub(sp_contact, f"{CBC}Telephone",     EMPRESA["telefono"])
    _sub(sp_contact, f"{CBC}ElectronicMail", EMPRESA["email"])

    # ── AccountingCustomerParty (Consumidor Final) ────────────────────────────
    customer = _sub(root, f"{CAC}AccountingCustomerParty")
    _sub(customer, f"{CBC}AdditionalAccountID", "2")
    cp = _sub(customer, f"{CAC}Party")

    cp_name = _sub(cp, f"{CAC}PartyName")
    _sub(cp_name, f"{CBC}Name", cliente.get("nombre", "Consumidor Final"))

    cp_tax = _sub(cp, f"{CAC}PartyTaxScheme")
    _sub(cp_tax, f"{CBC}RegistrationName", cliente.get("nombre", "Consumidor Final"))
    # schemeName="13" = Cédula de ciudadanía / consumidor final (sin schemeID)
    _sub(cp_tax, f"{CBC}CompanyID",
         nit_adquiriente,
         schemeAgencyID="195",
         schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)",
         schemeName="13")
    _sub(cp_tax, f"{CBC}TaxLevelCode", "R-99-PN", listName="49")
    cp_ts = _sub(cp_tax, f"{CAC}TaxScheme")
    _sub(cp_ts, f"{CBC}ID",   "ZY")
    _sub(cp_ts, f"{CBC}Name", "No causa")

    # ── PaymentMeans ──────────────────────────────────────────────────────────
    pm = _sub(root, f"{CAC}PaymentMeans")
    _sub(pm, f"{CBC}ID",              "1")
    _sub(pm, f"{CBC}PaymentMeansCode","10")   # 10 = contado
    _sub(pm, f"{CBC}PaymentDueDate",  fecha_str)

    # ── TaxTotal IVA (01) ─────────────────────────────────────────────────────
    tt_iva = _sub(root, f"{CAC}TaxTotal")
    _sub(tt_iva, f"{CBC}TaxAmount", f"{iva:.2f}", currencyID="COP")
    ts_iva = _sub(tt_iva, f"{CAC}TaxSubtotal")
    _sub(ts_iva, f"{CBC}TaxableAmount", f"{subtotal:.2f}", currencyID="COP")
    _sub(ts_iva, f"{CBC}TaxAmount",     f"{iva:.2f}",     currencyID="COP")
    tc_iva = _sub(ts_iva, f"{CAC}TaxCategory")
    _sub(tc_iva, f"{CBC}Percent", "19.00")
    tsc_iva = _sub(tc_iva, f"{CAC}TaxScheme")
    _sub(tsc_iva, f"{CBC}ID",   "01")
    _sub(tsc_iva, f"{CBC}Name", "IVA")

    # ── TaxTotal INC (04) — obligatorio, valor 0 ─────────────────────────────
    tt_inc = _sub(root, f"{CAC}TaxTotal")
    _sub(tt_inc, f"{CBC}TaxAmount", "0.00", currencyID="COP")
    ts_inc = _sub(tt_inc, f"{CAC}TaxSubtotal")
    _sub(ts_inc, f"{CBC}TaxableAmount", "0.00", currencyID="COP")
    _sub(ts_inc, f"{CBC}TaxAmount",     "0.00", currencyID="COP")
    tc_inc = _sub(ts_inc, f"{CAC}TaxCategory")
    _sub(tc_inc, f"{CBC}Percent", "0.00")
    tsc_inc = _sub(tc_inc, f"{CAC}TaxScheme")
    _sub(tsc_inc, f"{CBC}ID",   "04")
    _sub(tsc_inc, f"{CBC}Name", "INC")

    # ── TaxTotal ICA (03) — obligatorio, valor 0 ─────────────────────────────
    tt_ica = _sub(root, f"{CAC}TaxTotal")
    _sub(tt_ica, f"{CBC}TaxAmount", "0.00", currencyID="COP")
    ts_ica = _sub(tt_ica, f"{CAC}TaxSubtotal")
    _sub(ts_ica, f"{CBC}TaxableAmount", "0.00", currencyID="COP")
    _sub(ts_ica, f"{CBC}TaxAmount",     "0.00", currencyID="COP")
    tc_ica = _sub(ts_ica, f"{CAC}TaxCategory")
    _sub(tc_ica, f"{CBC}Percent", "0.00")
    tsc_ica = _sub(tc_ica, f"{CAC}TaxScheme")
    _sub(tsc_ica, f"{CBC}ID",   "03")
    _sub(tsc_ica, f"{CBC}Name", "ICA")

    # ── LegalMonetaryTotal ────────────────────────────────────────────────────
    lmt = _sub(root, f"{CAC}LegalMonetaryTotal")
    _sub(lmt, f"{CBC}LineExtensionAmount", f"{subtotal:.2f}", currencyID="COP")
    _sub(lmt, f"{CBC}TaxExclusiveAmount",  f"{subtotal:.2f}", currencyID="COP")
    _sub(lmt, f"{CBC}TaxInclusiveAmount",  f"{total:.2f}",   currencyID="COP")
    _sub(lmt, f"{CBC}PayableAmount",       f"{total:.2f}",   currencyID="COP")

    # ── InvoiceLines ──────────────────────────────────────────────────────────
    for i, l in enumerate(lineas, 1):
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

        price = _sub(line, f"{CAC}Price")
        _sub(price, f"{CBC}PriceAmount",  f"{l['base_unit']:.2f}", currencyID="COP")
        _sub(price, f"{CBC}BaseQuantity", "1.000000", unitCode="NIU")

    xml_bytes = etree.tostring(
        root, pretty_print=True, xml_declaration=True, encoding="UTF-8"
    )
    return xml_bytes.decode("utf-8"), cufe, numero_completo, qr_text, subtotal, iva, total
