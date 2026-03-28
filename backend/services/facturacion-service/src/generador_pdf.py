"""
Generador de PDF para Factura Electrónica EGOS
Conforme a Resolución 000042 de 2020 y Decreto 358 de 2020 - DIAN Colombia
"""
import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.platypus import PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.platypus.flowables import KeepTogether
from datetime import datetime
from typing import List, Dict

# ── Paleta EGOS ──
NEGRO       = colors.HexColor('#111827')
DORADO      = colors.HexColor('#c5a47e')
DORADO_OSC  = colors.HexColor('#a67c52')
GRIS_CLARO  = colors.HexColor('#f9fafb')
GRIS_MEDIO  = colors.HexColor('#e5e7eb')
GRIS        = colors.HexColor('#6b7280')
GRIS_TEXTO  = colors.HexColor('#374151')
BLANCO      = colors.white

PAGE_W, PAGE_H = letter
MARGEN = 1.5 * cm
ANCHO_UTIL = PAGE_W - 2 * MARGEN  # ~18 cm

def generar_qr(texto: str) -> io.BytesIO:
    qr = qrcode.QRCode(version=1, box_size=5, border=2)
    qr.add_data(texto)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#111827", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf

def fmt(valor: float) -> str:
    """Formato precio colombiano: $2.160.000"""
    return f"${valor:,.0f}".replace(",", ".")

def cufe_formateado(cufe: str) -> str:
    """Divide el CUFE en bloques de 16 para legibilidad"""
    return "  ".join([cufe[i:i+16] for i in range(0, len(cufe), 16)])

def estilo(nombre, **kwargs) -> ParagraphStyle:
    base = dict(fontName='Helvetica', fontSize=8, textColor=NEGRO, spaceAfter=0, spaceBefore=0, leading=10)
    base.update(kwargs)
    return ParagraphStyle(nombre, **base)

def generar_pdf_factura(
    numero_completo: str,
    cufe: str,
    pedido_id: str,
    cliente: Dict,
    productos: List[Dict],
    subtotal: float,
    iva: float,
    total: float,
    qr_text: str,
    fecha: datetime = None
) -> bytes:

    if fecha is None:
        fecha = datetime.now()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter,
        rightMargin=MARGEN, leftMargin=MARGEN,
        topMargin=MARGEN, bottomMargin=MARGEN,
        title=f"Factura {numero_completo} - EGOS"
    )

    story = []

    # ══════════════════════════════════════════
    # ENCABEZADO
    # ══════════════════════════════════════════
    col_empresa = [
        Paragraph("EGOS", estilo('t1', fontSize=26, fontName='Helvetica-Bold', textColor=NEGRO, leading=28)),
        Paragraph("WEAR YOUR TRUTH", estilo('t2', fontSize=7, textColor=DORADO, letterSpacing=4, leading=10)),
        Spacer(1, 6),
        Paragraph("<b>Vertel &amp; Catillo S.A.S</b>", estilo('e1', fontSize=8, leading=11)),
        Paragraph("NIT: 900.205.170-8  DV: 8", estilo('e2', fontSize=7, textColor=GRIS_TEXTO, leading=10)),
        Paragraph("CRA 107 A BIS #69B-58, Bogotá D.C", estilo('e3', fontSize=7, textColor=GRIS_TEXTO, leading=10)),
        Paragraph("hola@egos.com.co", estilo('e4', fontSize=7, textColor=GRIS_TEXTO, leading=10)),
        Spacer(1, 4),
        Paragraph("Régimen Simple de Tributación (SIMPLE)", estilo('e5', fontSize=6, textColor=GRIS, leading=9)),
        Paragraph("Responsable de IVA — CIIU: 4791 / 4771 / 4642", estilo('e6', fontSize=6, textColor=GRIS, leading=9)),
    ]

    col_factura = [
        Paragraph("FACTURA ELECTRÓNICA DE VENTA",
                  estilo('f1', fontSize=9, fontName='Helvetica-Bold', alignment=TA_RIGHT, leading=11)),
        Paragraph(f"<b>{numero_completo}</b>",
                  estilo('f2', fontSize=18, fontName='Helvetica-Bold', textColor=DORADO, alignment=TA_RIGHT, leading=22)),
        Spacer(1, 6),
        Paragraph(f"<b>Fecha:</b> {fecha.strftime('%d/%m/%Y')}",
                  estilo('f3', fontSize=8, alignment=TA_RIGHT, leading=11)),
        Paragraph(f"<b>Hora:</b> {fecha.strftime('%I:%M %p')} (COL)",
                  estilo('f4', fontSize=8, alignment=TA_RIGHT, leading=11)),
        Paragraph(f"<b>Pedido:</b> #{pedido_id}",
                  estilo('f5', fontSize=8, alignment=TA_RIGHT, textColor=GRIS_TEXTO, leading=11)),
        Spacer(1, 6),
        Paragraph("Res. DIAN No. 18760000001",
                  estilo('f6', fontSize=6, alignment=TA_RIGHT, textColor=GRIS, leading=9)),
        Paragraph("Rango autorizado: 980000000 – 985000000",
                  estilo('f7', fontSize=6, alignment=TA_RIGHT, textColor=GRIS, leading=9)),
        Paragraph("Vigencia: 19/01/2019 – 19/01/2030",
                  estilo('f8', fontSize=6, alignment=TA_RIGHT, textColor=GRIS, leading=9)),
    ]

    enc = Table([[col_empresa, col_factura]], colWidths=[ANCHO_UTIL * 0.52, ANCHO_UTIL * 0.48])
    enc.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, 0), 1, DORADO),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
    ]))
    story.append(enc)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════
    # DATOS DEL CLIENTE
    # ══════════════════════════════════════════
    story.append(Paragraph("● DATOS DEL ADQUIRIENTE",
                            estilo('sec', fontSize=7, fontName='Helvetica-Bold',
                                   textColor=DORADO, letterSpacing=1, leading=10)))
    story.append(Spacer(1, 3))

    tipo_doc = cliente.get('tipo_documento', 'CC')
    num_doc  = cliente.get('nit_cc', '222222222222')
    nombre_c = cliente.get('nombre', 'Consumidor Final')
    email_c  = cliente.get('email', '')
    dir_c    = cliente.get('direccion', 'No registrada')

    cli_data = [
        [
            Paragraph("<b>Nombre / Razón Social:</b>", estilo('cl', fontSize=7, textColor=GRIS)),
            Paragraph(nombre_c, estilo('cv', fontSize=8)),
            Paragraph(f"<b>{tipo_doc}:</b>", estilo('cl', fontSize=7, textColor=GRIS)),
            Paragraph(num_doc, estilo('cv', fontSize=8)),
        ],
        [
            Paragraph("<b>Correo electrónico:</b>", estilo('cl', fontSize=7, textColor=GRIS)),
            Paragraph(email_c, estilo('cv', fontSize=8)),
            Paragraph("<b>Dirección:</b>", estilo('cl', fontSize=7, textColor=GRIS)),
            Paragraph(dir_c, estilo('cv', fontSize=8)),
        ],
        [
            Paragraph("<b>Régimen:</b>", estilo('cl', fontSize=7, textColor=GRIS)),
            Paragraph("No responsable de IVA", estilo('cv', fontSize=8)),
            Paragraph("<b>Forma de pago:</b>", estilo('cl', fontSize=7, textColor=GRIS)),
            Paragraph("Contado", estilo('cv', fontSize=8)),
        ],
    ]
    cli_t = Table(cli_data, colWidths=[3.2*cm, 6.3*cm, 3.2*cm, 5.3*cm])
    cli_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRIS_CLARO),
        ('GRID', (0, 0), (-1, -1), 0.3, GRIS_MEDIO),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f3f4f6')),
    ]))
    story.append(cli_t)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════
    # TABLA DE PRODUCTOS
    # ══════════════════════════════════════════
    story.append(Paragraph("● DETALLE DE PRODUCTOS Y SERVICIOS",
                            estilo('sec2', fontSize=7, fontName='Helvetica-Bold',
                                   textColor=DORADO, letterSpacing=1, leading=10)))
    story.append(Spacer(1, 3))

    # Encabezado tabla
    ph = lambda t, align=TA_CENTER: Paragraph(
        t, estilo('ph', fontSize=7, fontName='Helvetica-Bold',
                  textColor=BLANCO, alignment=align, leading=9))

    prod_rows = [[
        ph("#"),
        ph("Descripción", TA_LEFT),
        ph("Cant."),
        ph("Precio Unit.\n(sin IVA)", TA_RIGHT),
        ph("Subtotal\n(sin IVA)", TA_RIGHT),
    ]]

    subtotal_calc = 0.0
    for i, p in enumerate(productos, 1):
        precio = float(p.get("precio_unitario", 0))
        cant   = int(p.get("cantidad", 1))
        sub    = precio * cant
        subtotal_calc += sub

        prod_rows.append([
            Paragraph(str(i), estilo('pc', fontSize=8, alignment=TA_CENTER)),
            Paragraph(p.get("nombre", "Producto"), estilo('pd', fontSize=8, leading=11)),
            Paragraph(str(cant), estilo('pc', fontSize=8, alignment=TA_CENTER)),
            Paragraph(fmt(precio), estilo('pr', fontSize=8, alignment=TA_RIGHT)),
            Paragraph(fmt(sub), estilo('pr', fontSize=8, alignment=TA_RIGHT)),
        ])

    # Usar valores calculados si los pasados son 0
    if subtotal == 0:
        subtotal = subtotal_calc
        iva      = round(subtotal * 0.19, 2)
        total    = round(subtotal + iva, 2)

    prod_t = Table(prod_rows, colWidths=[1*cm, 9*cm, 1.5*cm, 3.5*cm, 3*cm])
    prod_t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0),  NEGRO),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [BLANCO, GRIS_CLARO]),
        ('GRID',          (0, 0), (-1, -1), 0.3, GRIS_MEDIO),
        ('LINEBELOW',     (0, 0), (-1, 0),  1,   DORADO),
        ('PADDING',       (0, 0), (-1, -1), 5),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN',         (1, 1), (1, -1),  'LEFT'),
        ('ALIGN',         (3, 1), (4, -1),  'RIGHT'),
    ]))
    story.append(prod_t)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════
    # TOTALES + QR
    # ══════════════════════════════════════════
    qr_buf = generar_qr(qr_text)
    qr_img = Image(qr_buf, width=3.5*cm, height=3.5*cm)

    # Columna QR
    col_qr = Table([
        [qr_img],
        [Paragraph("Escanea para verificar\nla autenticidad en la DIAN",
                   estilo('qrl', fontSize=6, textColor=GRIS, alignment=TA_CENTER, leading=8))],
    ], colWidths=[4*cm])
    col_qr.setStyle(TableStyle([
        ('ALIGN',   (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',  (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))

    # Columna totales — alineada con tabla productos
    tot_rows = [
        [Paragraph("Base gravable (sin IVA):", estilo('tl', fontSize=8, textColor=GRIS_TEXTO, alignment=TA_RIGHT)),
         Paragraph(fmt(subtotal), estilo('tv', fontSize=8, fontName='Helvetica-Bold', alignment=TA_RIGHT))],
        [Paragraph("IVA 19%:", estilo('tl', fontSize=8, textColor=GRIS_TEXTO, alignment=TA_RIGHT)),
         Paragraph(fmt(iva), estilo('tv', fontSize=8, fontName='Helvetica-Bold', alignment=TA_RIGHT))],
        [Paragraph("Descuentos:", estilo('tl', fontSize=8, textColor=GRIS_TEXTO, alignment=TA_RIGHT)),
         Paragraph(fmt(0), estilo('tv', fontSize=8, fontName='Helvetica-Bold', alignment=TA_RIGHT))],
    ]
    tot_t = Table(tot_rows, colWidths=[7*cm, 3*cm])
    tot_t.setStyle(TableStyle([
        ('ALIGN',   (0, 0), (-1, -1), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 3),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, GRIS_MEDIO),
    ]))

    # Fila TOTAL destacada
    total_row = Table([
        [Paragraph("<b>TOTAL A PAGAR:</b>",
                   estilo('totl', fontSize=11, fontName='Helvetica-Bold', textColor=NEGRO, alignment=TA_RIGHT)),
         Paragraph(f"<b>{fmt(total)}</b>",
                   estilo('totv', fontSize=11, fontName='Helvetica-Bold', textColor=DORADO, alignment=TA_RIGHT))],
    ], colWidths=[7*cm, 3*cm])
    total_row.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NEGRO),
        ('PADDING',    (0, 0), (-1, -1), 6),
        ('ALIGN',      (0, 0), (-1, -1), 'RIGHT'),
    ]))

    col_totales = [tot_t, Spacer(1, 4), total_row]

    bottom = Table([[col_qr, col_totales]],
                   colWidths=[4.5*cm, ANCHO_UTIL - 4.5*cm])
    bottom.setStyle(TableStyle([
        ('VALIGN',  (0, 0), (-1, -1), 'BOTTOM'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(bottom)
    story.append(Spacer(1, 12))

    # ══════════════════════════════════════════
    # CUFE
    # ══════════════════════════════════════════
    story.append(HRFlowable(width=ANCHO_UTIL, thickness=0.5, color=GRIS_MEDIO))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>CUFE</b> (Código Único de Factura Electrónica):",
        estilo('cufe_l', fontSize=7, textColor=GRIS_TEXTO, leading=10)
    ))
    story.append(Spacer(1, 2))
    # CUFE en bloques para legibilidad
    story.append(Paragraph(
        cufe_formateado(cufe),
        estilo('cufe_v', fontSize=6.5, textColor=NEGRO, fontName='Courier',
               leading=10, wordWrap='CJK', backColor=GRIS_CLARO)
    ))
    story.append(Spacer(1, 8))

    # ══════════════════════════════════════════
    # PIE DE PÁGINA
    # ══════════════════════════════════════════
    story.append(HRFlowable(width=ANCHO_UTIL, thickness=0.5, color=GRIS_MEDIO))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Representación gráfica de la Factura Electrónica de Venta. "
        "Documento tributario generado conforme a la <b>Resolución 000042 de 2020</b> y "
        "<b>Decreto 358 de 2020</b> de la DIAN. "
        "Este documento no requiere firma manuscrita ni sello.",
        estilo('pie', fontSize=6, textColor=GRIS, alignment=TA_JUSTIFY, leading=8)
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        f"Generado por EGOS — Wear Your Truth  |  hola@egos.com.co  |  {fecha.strftime('%d/%m/%Y %I:%M %p')} (Hora Colombia)",
        estilo('pie2', fontSize=6, textColor=GRIS, alignment=TA_CENTER, leading=8)
    ))

    doc.build(story)
    buf.seek(0)
    return buf.read()
