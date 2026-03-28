"""
Generador de PDF para Factura Electrónica EGOS
"""
import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from typing import List, Dict

NEGRO = colors.HexColor('#111827')
DORADO = colors.HexColor('#c5a47e')
GRIS_CLARO = colors.HexColor('#f9fafb')
GRIS = colors.HexColor('#6b7280')

def generar_qr(texto: str) -> io.BytesIO:
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(texto)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer

def formatear_precio(valor: float) -> str:
    return f"$ {valor:,.0f}".replace(",", ".")

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
    """Genera el PDF de la factura electrónica"""

    if fecha is None:
        fecha = datetime.now()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )

    styles = getSampleStyleSheet()
    story = []

    # Estilos personalizados
    titulo_style = ParagraphStyle('titulo', fontSize=22, textColor=NEGRO,
                                   spaceAfter=2, fontName='Helvetica-Bold',
                                   alignment=TA_LEFT)
    subtitulo_style = ParagraphStyle('subtitulo', fontSize=9, textColor=DORADO,
                                      spaceAfter=8, fontName='Helvetica',
                                      alignment=TA_LEFT, letterSpacing=3)
    normal_style = ParagraphStyle('normal', fontSize=8, textColor=NEGRO,
                                   fontName='Helvetica', spaceAfter=2)
    label_style = ParagraphStyle('label', fontSize=7, textColor=GRIS,
                                  fontName='Helvetica', spaceAfter=1)
    cufe_style = ParagraphStyle('cufe', fontSize=6, textColor=GRIS,
                                 fontName='Helvetica', wordWrap='CJK')

    # ── ENCABEZADO ──
    header_data = [[
        # Columna izquierda: Logo/Nombre empresa
        [
            Paragraph("EGOS", titulo_style),
            Paragraph("WEAR YOUR TRUTH", subtitulo_style),
            Spacer(1, 4),
            Paragraph("Vertel & Catillo S.A.S", ParagraphStyle('emp', fontSize=8, fontName='Helvetica-Bold', textColor=NEGRO)),
            Paragraph("NIT: 900.205.170-8", normal_style),
            Paragraph("CRA 107 A BIS #69B-58, Bogotá D.C", normal_style),
            Paragraph("hola@egos.com.co", normal_style),
        ],
        # Columna derecha: Datos factura
        [
            Paragraph(f"FACTURA ELECTRÓNICA", ParagraphStyle('ftit', fontSize=11, fontName='Helvetica-Bold',
                                                               textColor=NEGRO, alignment=TA_RIGHT)),
            Paragraph(f"No. {numero_completo}", ParagraphStyle('fnum', fontSize=14, fontName='Helvetica-Bold',
                                                                 textColor=DORADO, alignment=TA_RIGHT)),
            Spacer(1, 4),
            Paragraph(f"Fecha: {fecha.strftime('%d/%m/%Y %H:%M')}", ParagraphStyle('fd', fontSize=8,
                                                                                     fontName='Helvetica',
                                                                                     alignment=TA_RIGHT, textColor=NEGRO)),
            Paragraph(f"Pedido: #{pedido_id}", ParagraphStyle('fp', fontSize=8, fontName='Helvetica',
                                                                alignment=TA_RIGHT, textColor=GRIS)),
            Spacer(1, 4),
            Paragraph("Resolución DIAN No. 18760000001", ParagraphStyle('fres', fontSize=7, fontName='Helvetica',
                                                                          alignment=TA_RIGHT, textColor=GRIS)),
            Paragraph("Rango: 980000000 - 985000000", ParagraphStyle('fran', fontSize=7, fontName='Helvetica',
                                                                       alignment=TA_RIGHT, textColor=GRIS)),
        ]
    ]]

    header_table = Table(header_data, colWidths=[10*cm, 8*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, DORADO),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    # ── DATOS CLIENTE ──
    story.append(Paragraph("DATOS DEL CLIENTE", ParagraphStyle('sec', fontSize=8, fontName='Helvetica-Bold',
                                                                  textColor=DORADO, spaceAfter=4, letterSpacing=2)))
    cliente_data = [
        [Paragraph("Nombre:", label_style), Paragraph(cliente.get("nombre", "Consumidor Final"), normal_style),
         Paragraph("Documento:", label_style), Paragraph(cliente.get("nit_cc", "222222222222"), normal_style)],
        [Paragraph("Email:", label_style), Paragraph(cliente.get("email", ""), normal_style),
         Paragraph("Dirección:", label_style), Paragraph(cliente.get("direccion", ""), normal_style)],
    ]
    cliente_table = Table(cliente_data, colWidths=[2.5*cm, 7*cm, 2.5*cm, 6*cm])
    cliente_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRIS_CLARO),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(cliente_table)
    story.append(Spacer(1, 12))

    # ── PRODUCTOS ──
    story.append(Paragraph("DETALLE DE PRODUCTOS", ParagraphStyle('sec2', fontSize=8, fontName='Helvetica-Bold',
                                                                     textColor=DORADO, spaceAfter=4, letterSpacing=2)))

    prod_header = [
        Paragraph("#", ParagraphStyle('ph', fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER)),
        Paragraph("Descripción", ParagraphStyle('ph', fontSize=8, fontName='Helvetica-Bold', textColor=colors.white)),
        Paragraph("Cant.", ParagraphStyle('ph', fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER)),
        Paragraph("Precio Unit.", ParagraphStyle('ph', fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_RIGHT)),
        Paragraph("IVA 19%", ParagraphStyle('ph', fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_RIGHT)),
        Paragraph("Subtotal", ParagraphStyle('ph', fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_RIGHT)),
    ]

    prod_data = [prod_header]
    for i, p in enumerate(productos, 1):
        precio = p["precio_unitario"]
        cant = p["cantidad"]
        sub = precio * cant
        iva_p = sub * 0.19
        prod_data.append([
            Paragraph(str(i), ParagraphStyle('pc', fontSize=8, fontName='Helvetica', alignment=TA_CENTER)),
            Paragraph(p.get("nombre", "Producto"), ParagraphStyle('pd', fontSize=8, fontName='Helvetica')),
            Paragraph(str(cant), ParagraphStyle('pc', fontSize=8, fontName='Helvetica', alignment=TA_CENTER)),
            Paragraph(formatear_precio(precio), ParagraphStyle('pr', fontSize=8, fontName='Helvetica', alignment=TA_RIGHT)),
            Paragraph(formatear_precio(iva_p), ParagraphStyle('pr', fontSize=8, fontName='Helvetica', alignment=TA_RIGHT)),
            Paragraph(formatear_precio(sub), ParagraphStyle('pr', fontSize=8, fontName='Helvetica', alignment=TA_RIGHT)),
        ])

    prod_table = Table(prod_data, colWidths=[1*cm, 7.5*cm, 1.5*cm, 3*cm, 2.5*cm, 2.5*cm])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NEGRO),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, GRIS_CLARO]),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(prod_table)
    story.append(Spacer(1, 12))

    # ── TOTALES + QR ──
    qr_buffer = generar_qr(qr_text)
    qr_img = Image(qr_buffer, width=3*cm, height=3*cm)

    totales_data = [
        ["", Paragraph("Subtotal:", ParagraphStyle('tl', fontSize=9, fontName='Helvetica', alignment=TA_RIGHT)),
         Paragraph(formatear_precio(subtotal), ParagraphStyle('tv', fontSize=9, fontName='Helvetica-Bold', alignment=TA_RIGHT))],
        ["", Paragraph("IVA (19%):", ParagraphStyle('tl', fontSize=9, fontName='Helvetica', alignment=TA_RIGHT)),
         Paragraph(formatear_precio(iva), ParagraphStyle('tv', fontSize=9, fontName='Helvetica-Bold', alignment=TA_RIGHT))],
        ["", Paragraph("TOTAL:", ParagraphStyle('tl', fontSize=11, fontName='Helvetica-Bold', textColor=DORADO, alignment=TA_RIGHT)),
         Paragraph(formatear_precio(total), ParagraphStyle('tv', fontSize=11, fontName='Helvetica-Bold', textColor=DORADO, alignment=TA_RIGHT))],
    ]

    bottom_data = [[
        [qr_img, Paragraph("Escanea para verificar en la DIAN", ParagraphStyle('qrl', fontSize=6, textColor=GRIS, alignment=TA_CENTER))],
        Table(totales_data, colWidths=[5*cm, 4*cm, 3*cm])
    ]]
    bottom_table = Table(bottom_data, colWidths=[9*cm, 9*cm])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
    ]))
    story.append(bottom_table)
    story.append(Spacer(1, 12))

    # ── CUFE ──
    story.append(Paragraph("CUFE (Código Único de Factura Electrónica):", label_style))
    story.append(Paragraph(cufe, cufe_style))
    story.append(Spacer(1, 8))

    # ── PIE ──
    story.append(Paragraph(
        "Esta es una representación gráfica de la Factura Electrónica de Venta. "
        "Documento tributario generado conforme al Decreto 2242 de 2015 y Resolución 000042 de 2020 de la DIAN.",
        ParagraphStyle('pie', fontSize=6, textColor=GRIS, alignment=TA_CENTER)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
