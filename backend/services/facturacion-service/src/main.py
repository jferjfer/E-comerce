from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import os
import smtplib
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import httpx

from database import get_db, init_db, Factura, ContadorFactura
from generador_xml import generar_xml_factura
from generador_nota_credito import generar_nota_credito
from generador_nota_debito import generar_nota_debito
from firmador_xml import firmar_xml
from cliente_dian import enviar_factura_dian
from generador_pdf import generar_pdf_factura

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT") or 587)
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://egoscolombia.com.co")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:3011")
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://catalog-service:3002")

# Zona horaria Colombia UTC-5
COLOMBIA_TZ = timezone(timedelta(hours=-5))

def ahora_colombia():
    return datetime.now(COLOMBIA_TZ).replace(tzinfo=None)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("✅ Facturacion Service v1.0 iniciado")
    yield

app = FastAPI(title="EGOS Facturacion Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://egoscolombia.com.co",
        "https://www.egoscolombia.com.co",
        "https://api.egoscolombia.com.co",
        "http://localhost:3005",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELOS
# ============================================
class ProductoFactura(BaseModel):
    id: str
    nombre: str
    precio_unitario: float
    cantidad: int

class ClienteFactura(BaseModel):
    nombre: str
    email: str
    nit_cc: Optional[str] = "222222222222"
    direccion: Optional[str] = ""

class SolicitudFactura(BaseModel):
    pedido_id: str
    usuario_id: int
    cliente: ClienteFactura
    productos: List[ProductoFactura]
    descuento_bono: Optional[float] = 0
    codigo_bono: Optional[str] = None

class SolicitudNotaCredito(BaseModel):
    factura_numero: str
    cufe_factura: str
    fecha_factura: str
    cliente: ClienteFactura
    productos: List[ProductoFactura]
    motivo: Optional[str] = "Devolución de mercancía"
    codigo_motivo: Optional[str] = "2"

class SolicitudNotaDebito(BaseModel):
    factura_numero: str
    cufe_factura: str
    fecha_factura: str
    cliente: ClienteFactura
    productos: List[ProductoFactura]
    motivo: Optional[str] = "Intereses por mora"
    codigo_motivo: Optional[str] = "1"

class ActualizarCufe(BaseModel):
    cufe: str

# ============================================
# HELPERS
# ============================================
def obtener_siguiente_numero(db: Session) -> int:
    contador = db.query(ContadorFactura).filter(ContadorFactura.id == 1).with_for_update().first()
    if not contador:
        contador = ContadorFactura(id=1, ultimo_numero=979999999)
        db.add(contador)
    contador.ultimo_numero += 1
    db.commit()
    return contador.ultimo_numero

def enviar_email_factura(email: str, nombre: str, numero: str, pdf_bytes: bytes, pedido_id: str):
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT") or 587)
    frontend_url = os.getenv("FRONTEND_URL", "https://egoscolombia.com.co")

    if not smtp_user or not smtp_pass:
        print(f"⚠️ SMTP no configurado, no se envió factura a {email}")
        return

    try:
        msg = MIMEMultipart()
        msg["Subject"] = f"🧾 Tu factura electrónica EGOS - {numero}"
        msg["From"] = f'"EGOS" <{smtp_user}>'
        msg["To"] = email

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
          <div style="background:#111827;padding:40px 30px;text-align:center">
            <h1 style="color:#c5a47e;margin:0;font-size:32px;letter-spacing:8px">EGOS</h1>
            <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:12px;letter-spacing:3px">WEAR YOUR TRUTH</p>
          </div>
          <div style="background:white;padding:40px 30px">
            <p style="font-size:16px;color:#333">Hola <strong>{nombre}</strong>,</p>
            <p style="color:#555;line-height:1.6">
              Adjunto encontrarás tu <strong>Factura Electrónica {numero}</strong> correspondiente al pedido <strong>#{pedido_id}</strong>.
            </p>
            <p style="color:#555;font-size:14px">
              Este documento fue generado y validado ante la <strong>DIAN</strong> conforme a la normativa de facturación electrónica colombiana.
            </p>
            <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:24px 0;border-left:3px solid #c5a47e">
              <p style="margin:0;color:#666;font-size:13px">
                Puedes verificar la autenticidad de tu factura en el portal de la DIAN usando el CUFE incluido en el documento.
              </p>
            </div>
            <div style="text-align:center;margin:30px 0">
              <a href="{frontend_url}/orders" style="background:#111827;color:#c5a47e;padding:14px 32px;text-decoration:none;border-radius:4px;font-size:14px;font-weight:bold;letter-spacing:2px;display:inline-block">
                VER MIS PEDIDOS
              </a>
            </div>
          </div>
          <div style="background:#f0f0f0;padding:20px 30px;text-align:center">
            <p style="color:#888;font-size:11px;margin:0">
              EGOS — Wear Your Truth<br>
              Este es un correo automático, no respondas a este mensaje.
            </p>
          </div>
        </div>
        """

        msg.attach(MIMEText(html, "html"))

        # Adjuntar PDF
        pdf_part = MIMEBase("application", "pdf")
        pdf_part.set_payload(pdf_bytes)
        encoders.encode_base64(pdf_part)
        pdf_part.add_header("Content-Disposition", f'attachment; filename="{numero}.pdf"')
        msg.attach(pdf_part)

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, email, msg.as_string())

        print(f"📧 Factura {numero} enviada a {email}")
    except Exception as e:
        print(f"⚠️ Error enviando factura por email: {e}")

async def procesar_factura_background(
    pedido_id: str,
    usuario_id: int,
    cliente_data: dict,
    productos_data: list,
    db_session,
    descuento_bono: float = 0,
    codigo_bono: str = None
):
    """Procesa la factura en background"""
    db = next(get_db())
    try:
        # Verificar si ya existe factura para este pedido
        existente = db.query(Factura).filter(Factura.pedido_id == pedido_id).first()
        if existente:
            print(f"⚠️ Ya existe factura para pedido {pedido_id}: {existente.numero_completo}")
            return

        # Obtener número secuencial
        numero = obtener_siguiente_numero(db)
        fecha = ahora_colombia()  # Hora Colombia UTC-5

        # Enriquecer productos con nombres y precios reales desde catalog-service
        productos_enriquecidos = []
        async with httpx.AsyncClient(timeout=10) as client:
            for p in productos_data:
                nombre = p.get('nombre', '')
                precio = p.get('precio_unitario', 0)
                # Si el nombre es generico o precio es 0, consultar catalog
                if not nombre or nombre.startswith('Producto ') or precio == 0:
                    try:
                        res = await client.get(f"{CATALOG_SERVICE_URL}/api/productos/{p['id']}")
                        if res.status_code == 200:
                            prod = res.json().get('producto', {})
                            nombre = prod.get('nombre', nombre)
                            precio = prod.get('precio', precio)
                    except Exception as e:
                        print(f"⚠️ No se pudo obtener producto {p['id']}: {e}")
                productos_enriquecidos.append({
                    'id': p['id'],
                    'nombre': nombre or f"Producto {p['id']}",
                    'precio_unitario': float(precio),
                    'cantidad': p.get('cantidad', 1)
                })

        # Generar XML con productos enriquecidos
        xml_string, cufe, numero_completo, qr_text, subtotal, iva, total = generar_xml_factura(
            numero=numero,
            pedido_id=pedido_id,
            cliente=cliente_data,
            productos=productos_enriquecidos,
            fecha=fecha
        )

        # Guardar factura en BD
        factura = Factura(
            numero=numero,
            numero_completo=numero_completo,
            pedido_id=pedido_id,
            usuario_id=usuario_id,
            cliente_nombre=cliente_data.get("nombre", ""),
            cliente_email=cliente_data.get("email", ""),
            cliente_nit_cc=cliente_data.get("nit_cc", ""),
            cliente_direccion=cliente_data.get("direccion", ""),
            subtotal=subtotal,
            iva=iva,
            total=total,
            cufe=cufe,
            qr_code=qr_text,
            xml_enviado=xml_string,
            estado="Pendiente"
        )
        db.add(factura)
        db.commit()

        print(f"✅ Factura {numero_completo} creada en BD")

        # Enviar a DIAN (firmar primero)
        try:
            xml_firmado = firmar_xml(xml_string)
            resultado_dian = enviar_factura_dian(xml_firmado, numero_completo)
        except Exception as e:
            print(f"⚠️ Error firmando XML, enviando sin firma: {e}")
            resultado_dian = enviar_factura_dian(xml_string, numero_completo)

        factura.estado = resultado_dian["estado"]
        factura.mensaje_dian = resultado_dian["mensaje"]
        factura.xml_respuesta = resultado_dian.get("xml_respuesta", "")
        factura.fecha_envio_dian = datetime.now()
        db.commit()

        print(f"📤 DIAN: {resultado_dian['estado']} - {resultado_dian['mensaje']}")

        # Generar PDF con productos enriquecidos
        pdf_bytes = generar_pdf_factura(
            numero_completo=numero_completo,
            cufe=cufe,
            pedido_id=pedido_id,
            cliente=cliente_data,
            productos=productos_enriquecidos,
            subtotal=subtotal,
            iva=iva,
            total=total,
            qr_text=qr_text,
            fecha=fecha,
            descuento_bono=descuento_bono,
            codigo_bono=codigo_bono
        )

        # Enviar por email
        enviar_email_factura(
            email=cliente_data.get("email", ""),
            nombre=cliente_data.get("nombre", ""),
            numero=numero_completo,
            pdf_bytes=pdf_bytes,
            pedido_id=pedido_id
        )

        factura.enviada_cliente = True
        db.commit()

        print(f"✅ Factura {numero_completo} procesada completamente")

    except Exception as e:
        print(f"❌ Error procesando factura: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

# ============================================
# ENDPOINTS
# ============================================

@app.get("/salud")
async def salud(db: Session = Depends(get_db)):
    try:
        total = db.query(Factura).count()
        aceptadas = db.query(Factura).filter(Factura.estado == "Aceptada").count()
    except:
        total = 0
        aceptadas = 0

    return {
        "estado": "activo",
        "servicio": "facturacion",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "total_facturas": total,
            "aceptadas": aceptadas
        }
    }

@app.post("/api/facturas/generar")
async def generar_factura(
    solicitud: SolicitudFactura,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Genera factura electrónica para un pedido"""

    # Verificar si ya existe
    existente = db.query(Factura).filter(Factura.pedido_id == solicitud.pedido_id).first()
    if existente:
        return {
            "mensaje": "Ya existe una factura para este pedido",
            "numero": existente.numero_completo,
            "estado": existente.estado,
            "cufe": existente.cufe
        }

    # Procesar en background para no bloquear el checkout
    background_tasks.add_task(
        procesar_factura_background,
        solicitud.pedido_id,
        solicitud.usuario_id,
        solicitud.cliente.model_dump(),
        [p.model_dump() for p in solicitud.productos],
        db,
        solicitud.descuento_bono or 0,
        solicitud.codigo_bono
    )

    return {
        "mensaje": "Factura en proceso de generación",
        "pedido_id": solicitud.pedido_id,
        "estado": "Procesando"
    }

@app.get("/api/facturas/pedido/{pedido_id}")
async def obtener_factura_pedido(pedido_id: str, db: Session = Depends(get_db)):
    """Obtiene la factura de un pedido"""
    factura = db.query(Factura).filter(Factura.pedido_id == pedido_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    return {
        "id": factura.id,
        "numero": factura.numero_completo,
        "pedido_id": factura.pedido_id,
        "cliente_nombre": factura.cliente_nombre,
        "cliente_email": factura.cliente_email,
        "subtotal": factura.subtotal,
        "iva": factura.iva,
        "total": factura.total,
        "cufe": factura.cufe,
        "estado": factura.estado,
        "mensaje_dian": factura.mensaje_dian,
        "fecha_creacion": factura.fecha_creacion.isoformat() if factura.fecha_creacion else None,
        "enviada_cliente": factura.enviada_cliente
    }

@app.get("/api/facturas/usuario/{usuario_id}")
async def obtener_facturas_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Obtiene todas las facturas de un usuario"""
    facturas = db.query(Factura).filter(
        Factura.usuario_id == usuario_id
    ).order_by(Factura.fecha_creacion.desc()).all()

    return {
        "facturas": [{
            "id": f.id,
            "numero": f.numero_completo,
            "pedido_id": f.pedido_id,
            "total": f.total,
            "estado": f.estado,
            "cufe": f.cufe,
            "fecha": f.fecha_creacion.isoformat() if f.fecha_creacion else None
        } for f in facturas],
        "total": len(facturas)
    }

@app.get("/api/facturas/{factura_id}/pdf")
async def descargar_pdf(factura_id: str, db: Session = Depends(get_db)):
    """Descarga el PDF de una factura"""
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    # Obtener productos reales del pedido desde transaction-service
    productos = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                f"http://transaction-service:3003/api/admin/pedidos",
                params={"pedido_id": factura.pedido_id}
            )
            # Intentar obtener productos del XML guardado
            pass
    except:
        pass

    # Si no hay productos, usar los del XML de la factura
    if not productos and factura.xml_enviado:
        import re
        nombres = re.findall(r'<cbc:Description>([^<]+)</cbc:Description>', factura.xml_enviado)
        precios = re.findall(r'<cbc:PriceAmount[^>]*>([^<]+)</cbc:PriceAmount>', factura.xml_enviado)
        cantidades = re.findall(r'<cbc:InvoicedQuantity[^>]*>([^<]+)</cbc:InvoicedQuantity>', factura.xml_enviado)
        for i, nombre in enumerate(nombres):
            productos.append({
                'nombre': nombre,
                'precio_unitario': float(precios[i]) if i < len(precios) else 0,
                'cantidad': int(float(cantidades[i])) if i < len(cantidades) else 1
            })

    pdf_bytes = generar_pdf_factura(
        numero_completo=factura.numero_completo,
        cufe=factura.cufe or "",
        pedido_id=factura.pedido_id,
        cliente={
            "nombre": factura.cliente_nombre,
            "email": factura.cliente_email,
            "nit_cc": factura.cliente_nit_cc,
            "direccion": factura.cliente_direccion
        },
        productos=productos,
        subtotal=factura.subtotal,
        iva=factura.iva,
        total=factura.total,
        qr_text=factura.qr_code or "",
        fecha=factura.fecha_creacion
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{factura.numero_completo}.pdf"'}
    )

@app.get("/api/facturas/admin/todas")
async def listar_facturas_admin(
    estado: str = None,
    db: Session = Depends(get_db)
):
    """Lista todas las facturas (admin)"""
    query = db.query(Factura)
    if estado:
        query = query.filter(Factura.estado == estado)
    facturas = query.order_by(Factura.fecha_creacion.desc()).limit(100).all()

    return {
        "facturas": [{
            "id": f.id,
            "numero": f.numero_completo,
            "pedido_id": f.pedido_id,
            "cliente_nombre": f.cliente_nombre,
            "cliente_email": f.cliente_email,
            "total": f.total,
            "estado": f.estado,
            "cufe": f.cufe,
            "enviada_cliente": f.enviada_cliente,
            "fecha": f.fecha_creacion.isoformat() if f.fecha_creacion else None
        } for f in facturas],
        "total": len(facturas)
    }

@app.post("/api/facturas/{factura_id}/reenviar")
async def reenviar_factura(factura_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Reenvía la factura al cliente por email"""
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    # Extraer productos del XML guardado
    productos = []
    if factura.xml_enviado:
        import re
        nombres = re.findall(r'<cbc:Description>([^<]+)</cbc:Description>', factura.xml_enviado)
        precios = re.findall(r'<cbc:PriceAmount[^>]*>([^<]+)</cbc:PriceAmount>', factura.xml_enviado)
        cantidades = re.findall(r'<cbc:InvoicedQuantity[^>]*>([^<]+)</cbc:InvoicedQuantity>', factura.xml_enviado)
        for i, nombre in enumerate(nombres):
            productos.append({
                'nombre': nombre,
                'precio_unitario': float(precios[i]) if i < len(precios) else 0,
                'cantidad': int(float(cantidades[i])) if i < len(cantidades) else 1
            })

    pdf_bytes = generar_pdf_factura(
        numero_completo=factura.numero_completo,
        cufe=factura.cufe or "",
        pedido_id=factura.pedido_id,
        cliente={
            "nombre": factura.cliente_nombre,
            "email": factura.cliente_email,
            "nit_cc": factura.cliente_nit_cc,
            "direccion": factura.cliente_direccion
        },
        productos=productos,
        subtotal=factura.subtotal,
        iva=factura.iva,
        total=factura.total,
        qr_text=factura.qr_code or "",
        fecha=factura.fecha_creacion
    )

    background_tasks.add_task(
        enviar_email_factura,
        factura.cliente_email,
        factura.cliente_nombre,
        factura.numero_completo,
        pdf_bytes,
        factura.pedido_id
    )

    factura.enviada_cliente = True
    db.commit()

    return {"mensaje": f"Factura {factura.numero_completo} reenviada a {factura.cliente_email}"}


# ============================================
# ENDPOINTS NOTAS CRÉDITO
# ============================================

@app.post("/api/notas-credito/generar")
async def generar_nota_credito_endpoint(
    solicitud: SolicitudNotaCredito,
    db: Session = Depends(get_db)
):
    """Genera una nota crédito electrónica"""
    try:
        numero = obtener_siguiente_numero(db)
        fecha = ahora_colombia()

        xml_string, cude, numero_completo, subtotal, iva, total = generar_nota_credito(
            numero=numero,
            factura_referencia=solicitud.factura_numero,
            cufe_factura=solicitud.cufe_factura,
            fecha_factura=solicitud.fecha_factura,
            cliente=solicitud.cliente.model_dump(),
            productos=[p.model_dump() for p in solicitud.productos],
            motivo=solicitud.motivo,
            codigo_motivo=solicitud.codigo_motivo,
            fecha=fecha
        )

        # Firmar y enviar a DIAN
        try:
            xml_firmado = firmar_xml(xml_string)
            resultado_dian = enviar_factura_dian(xml_firmado, numero_completo)
        except Exception as e:
            print(f"⚠️ Error firmando nota crédito: {e}")
            resultado_dian = enviar_factura_dian(xml_string, numero_completo)

        print(f"📝 Nota Crédito {numero_completo} - DIAN: {resultado_dian['estado']}")

        return {
            "mensaje": "Nota crédito generada",
            "numero": numero_completo,
            "cude": cude,
            "subtotal": subtotal,
            "iva": iva,
            "total": total,
            "estado_dian": resultado_dian["estado"],
            "mensaje_dian": resultado_dian["mensaje"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS NOTAS DÉBITO
# ============================================

@app.post("/api/notas-debito/generar")
async def generar_nota_debito_endpoint(
    solicitud: SolicitudNotaDebito,
    db: Session = Depends(get_db)
):
    """Genera una nota débito electrónica"""
    try:
        numero = obtener_siguiente_numero(db)
        fecha = ahora_colombia()

        xml_string, cude, numero_completo, subtotal, iva, total = generar_nota_debito(
            numero=numero,
            factura_referencia=solicitud.factura_numero,
            cufe_factura=solicitud.cufe_factura,
            fecha_factura=solicitud.fecha_factura,
            cliente=solicitud.cliente.model_dump(),
            productos=[p.model_dump() for p in solicitud.productos],
            motivo=solicitud.motivo,
            codigo_motivo=solicitud.codigo_motivo,
            fecha=fecha
        )

        # Firmar y enviar a DIAN
        try:
            xml_firmado = firmar_xml(xml_string)
            resultado_dian = enviar_factura_dian(xml_firmado, numero_completo)
        except Exception as e:
            print(f"⚠️ Error firmando nota débito: {e}")
            resultado_dian = enviar_factura_dian(xml_string, numero_completo)

        print(f"📝 Nota Débito {numero_completo} - DIAN: {resultado_dian['estado']}")

        return {
            "mensaje": "Nota débito generada",
            "numero": numero_completo,
            "cude": cude,
            "subtotal": subtotal,
            "iva": iva,
            "total": total,
            "estado_dian": resultado_dian["estado"],
            "mensaje_dian": resultado_dian["mensaje"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SET DE PRUEBAS DIAN — 50 documentos
# ============================================

@app.post("/api/dian/set-pruebas/consultar-zipkeys")
async def consultar_zipkeys(db: Session = Depends(get_db)):
    """Consulta el estado de los ZipKeys pendientes y actualiza la BD"""
    from cliente_dian import consultar_estado_zip

    facturas_pendientes = db.query(Factura).filter(
        Factura.pedido_id.like("TEST-%"),
        Factura.estado == "Enviada",
        Factura.mensaje_dian.like("%ZipKey%")
    ).all()

    actualizadas = 0
    for factura in facturas_pendientes:
        try:
            # Extraer ZipKey del mensaje
            import re
            match = re.search(r'ZipKey: ([\w-]+)', factura.mensaje_dian or '')
            if not match:
                continue
            zip_key = match.group(1)
            resultado = consultar_estado_zip(zip_key)
            respuesta = resultado.get('respuesta', '')

            if 'Aceptada' in respuesta or 'aceptada' in respuesta or 'ACCEPTED' in respuesta:
                factura.estado = 'Aceptada'
                factura.mensaje_dian = f'Aceptada por DIAN. ZipKey: {zip_key}'
                actualizadas += 1
            elif 'Rechazada' in respuesta or 'rechazada' in respuesta or 'REJECTED' in respuesta:
                factura.estado = 'Rechazada'
                factura.mensaje_dian = f'Rechazada por DIAN: {respuesta[:200]}'
                actualizadas += 1
            else:
                print(f'⏳ {factura.numero_completo} aún procesando: {respuesta[:100]}')
        except Exception as e:
            print(f'⚠️ Error consultando ZipKey {factura.numero_completo}: {e}')

    db.commit()
    return {
        'consultadas': len(facturas_pendientes),
        'actualizadas': actualizadas
    }


@app.post("/api/dian/set-pruebas")
async def enviar_set_pruebas(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Envía el set completo de pruebas a la DIAN: 30 facturas + 10 notas crédito + 10 notas débito"""
    background_tasks.add_task(procesar_set_pruebas, db)
    return {
        "mensaje": "Set de pruebas iniciado en background",
        "documentos": {"facturas": 30, "notas_credito": 10, "notas_debito": 10, "total": 50},
        "test_set_id": "c5f5fbef-6621-420b-b986-857b2f1588d5"
    }

@app.get("/api/dian/set-pruebas/estado")
async def estado_set_pruebas(db: Session = Depends(get_db)):
    """Consulta el estado del set de pruebas"""
    facturas = db.query(Factura).filter(Factura.pedido_id.like("TEST-%")).all()
    aceptadas = [f for f in facturas if f.estado == "Aceptada"]
    rechazadas = [f for f in facturas if f.estado == "Rechazada"]
    pendientes = [f for f in facturas if f.estado in ["Pendiente", "Enviada"]]

    return {
        "total_enviados": len(facturas),
        "aceptados": len(aceptadas),
        "rechazados": len(rechazadas),
        "pendientes": len(pendientes),
        "documentos": [{
            "numero": f.numero_completo,
            "estado": f.estado,
            "mensaje_dian": f.mensaje_dian,
            "fecha": f.fecha_creacion.isoformat() if f.fecha_creacion else None
        } for f in facturas]
    }


async def procesar_set_pruebas(db_session):
    """Procesa los 50 documentos del set de pruebas DIAN"""
    db = next(get_db())
    resultados = []

    # Clientes de prueba
    clientes = [
        {"nombre": "Consumidor Final", "email": "test@egoscolombia.com", "nit_cc": "222222222222", "direccion": "Bogotá D.C."},
        {"nombre": "Empresa Prueba S.A.S", "email": "empresa@test.com", "nit_cc": "900123456", "direccion": "Medellín, Antioquia"},
        {"nombre": "Juan Pérez", "email": "juan@test.com", "nit_cc": "1234567890", "direccion": "Cali, Valle"},
    ]

    # Productos de prueba
    productos_base = [
        [{"id": "TEST1", "nombre": "Vestido Midi Floral", "precio_unitario": 95900.0, "cantidad": 1}],
        [{"id": "TEST2", "nombre": "Blusa Seda Off-Shoulder", "precio_unitario": 72900.0, "cantidad": 2}],
        [{"id": "TEST3", "nombre": "Jean Skinny Tiro Alto", "precio_unitario": 89900.0, "cantidad": 1}],
        [{"id": "TEST4", "nombre": "Blazer Ejecutivo", "precio_unitario": 185900.0, "cantidad": 1}],
        [{"id": "TEST5", "nombre": "Zapatos Formales", "precio_unitario": 145900.0, "cantidad": 1}],
        [{"id": "TEST1", "nombre": "Vestido Midi Floral", "precio_unitario": 95900.0, "cantidad": 1},
         {"id": "TEST2", "nombre": "Blusa Seda Off-Shoulder", "precio_unitario": 72900.0, "cantidad": 1}],
    ]

    print(f"🧪 Iniciando set de pruebas DIAN — 50 documentos")

    # ── 30 FACTURAS ──
    facturas_generadas = []
    for i in range(30):
        try:
            numero = obtener_siguiente_numero(db)
            fecha = ahora_colombia()
            cliente = clientes[i % len(clientes)]
            productos = productos_base[i % len(productos_base)]
            pedido_id = f"TEST-FAC-{i+1:03d}"

            xml_string, cufe, numero_completo, qr_text, subtotal, iva, total = generar_xml_factura(
                numero=numero, pedido_id=pedido_id,
                cliente=cliente, productos=productos, fecha=fecha
            )

            # Firmar
            try:
                xml_firmado = firmar_xml(xml_string)
            except Exception as e:
                print(f"⚠️ Firma fallida factura {i+1}: {e}")
                xml_firmado = xml_string

            resultado = enviar_factura_dian(xml_firmado, numero_completo)

            # Guardar en BD
            factura = Factura(
                numero=numero, numero_completo=numero_completo,
                pedido_id=pedido_id, usuario_id=0,
                cliente_nombre=cliente["nombre"], cliente_email=cliente["email"],
                cliente_nit_cc=cliente["nit_cc"], cliente_direccion=cliente["direccion"],
                subtotal=subtotal, iva=iva, total=total,
                cufe=cufe, qr_code=qr_text, xml_enviado=xml_firmado,
                estado=resultado["estado"], mensaje_dian=resultado["mensaje"],
                xml_respuesta=resultado.get("xml_respuesta", "")
            )
            db.add(factura)
            db.commit()

            facturas_generadas.append({"numero": numero_completo, "cufe": cufe, "fecha": fecha.strftime("%Y-%m-%d")})
            print(f"✅ Factura prueba {i+1}/30: {numero_completo} — {resultado['estado']}")

        except Exception as e:
            print(f"❌ Error factura prueba {i+1}: {e}")
            import traceback; traceback.print_exc()

    # ── 10 NOTAS CRÉDITO ──
    for i in range(10):
        try:
            numero = obtener_siguiente_numero(db)
            fecha = ahora_colombia()
            ref = facturas_generadas[i] if i < len(facturas_generadas) else facturas_generadas[0]
            cliente = clientes[i % len(clientes)]
            productos = productos_base[i % len(productos_base)]

            xml_string, cude, numero_completo, subtotal, iva, total = generar_nota_credito(
                numero=numero,
                factura_referencia=ref["numero"],
                cufe_factura=ref["cufe"],
                fecha_factura=ref["fecha"],
                cliente=cliente, productos=productos,
                motivo="Devolución de mercancía — Set de pruebas",
                codigo_motivo="2", fecha=fecha
            )

            try:
                xml_firmado = firmar_xml(xml_string)
            except:
                xml_firmado = xml_string

            resultado = enviar_factura_dian(xml_firmado, numero_completo)

            factura = Factura(
                numero=numero, numero_completo=numero_completo,
                pedido_id=f"TEST-NC-{i+1:03d}", usuario_id=0,
                cliente_nombre=cliente["nombre"], cliente_email=cliente["email"],
                cliente_nit_cc=cliente["nit_cc"], cliente_direccion=cliente["direccion"],
                subtotal=subtotal, iva=iva, total=total,
                cufe=cude, xml_enviado=xml_firmado,
                estado=resultado["estado"], mensaje_dian=resultado["mensaje"]
            )
            db.add(factura)
            db.commit()
            print(f"✅ Nota Crédito prueba {i+1}/10: {numero_completo} — {resultado['estado']}")

        except Exception as e:
            print(f"❌ Error nota crédito prueba {i+1}: {e}")

    # ── 10 NOTAS DÉBITO ──
    for i in range(10):
        try:
            numero = obtener_siguiente_numero(db)
            fecha = ahora_colombia()
            ref = facturas_generadas[i] if i < len(facturas_generadas) else facturas_generadas[0]
            cliente = clientes[i % len(clientes)]
            productos = [{"id": "TEST-INT", "nombre": "Intereses por mora", "precio_unitario": 5000.0, "cantidad": 1}]

            xml_string, cude, numero_completo, subtotal, iva, total = generar_nota_debito(
                numero=numero,
                factura_referencia=ref["numero"],
                cufe_factura=ref["cufe"],
                fecha_factura=ref["fecha"],
                cliente=cliente, productos=productos,
                motivo="Intereses por mora — Set de pruebas",
                codigo_motivo="1", fecha=fecha
            )

            try:
                xml_firmado = firmar_xml(xml_string)
            except:
                xml_firmado = xml_string

            resultado = enviar_factura_dian(xml_firmado, numero_completo)

            factura = Factura(
                numero=numero, numero_completo=numero_completo,
                pedido_id=f"TEST-ND-{i+1:03d}", usuario_id=0,
                cliente_nombre=cliente["nombre"], cliente_email=cliente["email"],
                cliente_nit_cc=cliente["nit_cc"], cliente_direccion=cliente["direccion"],
                subtotal=subtotal, iva=iva, total=total,
                cufe=cude, xml_enviado=xml_firmado,
                estado=resultado["estado"], mensaje_dian=resultado["mensaje"]
            )
            db.add(factura)
            db.commit()
            print(f"✅ Nota Débito prueba {i+1}/10: {numero_completo} — {resultado['estado']}")

        except Exception as e:
            print(f"❌ Error nota débito prueba {i+1}: {e}")

    print(f"🎉 Set de pruebas completado")
    db.close()

if __name__ == "__main__":
    import uvicorn
    puerto = int(os.getenv("PUERTO", 3010))
    print(f"🚀 EGOS Facturacion Service iniciando en puerto {puerto}")
    uvicorn.run(app, host="0.0.0.0", port=puerto)
