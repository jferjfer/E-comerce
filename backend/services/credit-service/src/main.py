from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import secrets
import string
import httpx
import json
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import get_db, init_db, CreditoInterno, TransaccionCredito, Bono
from contextlib import asynccontextmanager
import asyncio

# ============================================
# SMTP - Correos
# ============================================
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://egoscolombia.com.co")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:3011")

# ============================================
# REGLAS DE NEGOCIO
# ============================================
MONTO_MINIMO_COMPRAS = 2_000_000
MESES_MINIMOS = 6
MESES_BONO_ANTIGUEDAD = 18
COMPRAS_MINIMAS_RENOVACION = 9
MONTO_BONO = 100_000
LIMITE_MAXIMO_CREDITO = 5_000_000
DIAS_VENCIMIENTO_BONO = 30

def calcular_limite_credito(total_compras: float, meses_antiguedad: int) -> float:
    if total_compras < MONTO_MINIMO_COMPRAS:
        return 0

    if total_compras <= 4_000_000:
        factor = 0.15
    elif total_compras <= 7_000_000:
        factor = 0.20
    elif total_compras <= 12_000_000:
        factor = 0.25
    else:
        factor = 0.30

    limite_base = total_compras * factor

    # Bono antigüedad: solo después de 18 meses, máximo $100k
    bono = 100_000 if meses_antiguedad >= MESES_BONO_ANTIGUEDAD else 0

    return min(limite_base + bono, LIMITE_MAXIMO_CREDITO)

def calcular_tasa_interes(plazo_meses: int) -> float:
    if plazo_meses <= 3:
        return 2.5
    elif plazo_meses <= 6:
        return 2.2
    else:
        return 1.9

def calcular_cuota(monto: float, tasa_mensual: float, plazo_meses: int) -> dict:
    interes_total = monto * (tasa_mensual / 100) * plazo_meses
    total_pagar = monto + interes_total
    cuota_mensual = total_pagar / plazo_meses

    tabla = []
    saldo = monto
    capital_mensual = monto / plazo_meses

    for mes in range(1, plazo_meses + 1):
        interes_mes = monto * (tasa_mensual / 100)
        tabla.append({
            "mes": mes,
            "cuota": round(cuota_mensual, 2),
            "capital": round(capital_mensual, 2),
            "interes": round(interes_mes, 2),
            "saldo": round(max(0, saldo - capital_mensual), 2)
        })
        saldo -= capital_mensual

    return {
        "cuota_mensual": round(cuota_mensual, 2),
        "interes_total": round(interes_total, 2),
        "total_pagar": round(total_pagar, 2),
        "tabla_amortizacion": tabla
    }

def generar_codigo_bono(usuario_id: int) -> str:
    # Formato: EGOS + 6 caracteres aleatorios — corto, familiar, sin guiones
    # 32^6 = 1.073.741.824 combinaciones posibles
    chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    aleatorio = ''.join(secrets.choice(chars) for _ in range(6))
    return f"EGOS{aleatorio}"

# ============================================
# CORREOS
# ============================================
def enviar_correo_bono(email: str, nombre: str, codigo: str, fecha_vencimiento: datetime):
    if not SMTP_USER or not SMTP_PASS:
        print(f"⚠️ SMTP no configurado. Código bono: {codigo}")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🎁 ¡{nombre_corto}, te ganaste un bono de $100.000! — EGOS"
        msg["From"] = f'"EGOS" <{SMTP_USER}>'
        msg["To"] = email

        fecha_str = fecha_vencimiento.strftime("%d de %B de %Y")
        nombre_corto = nombre.split()[0] if nombre else "Cliente"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;background:#ffffff">

            <!-- HEADER -->
            <div style="background:#111827;padding:36px 40px;text-align:center">
              <div style="margin-bottom:4px">
                <span style="font-size:36px;font-weight:900;color:#c5a47e;letter-spacing:-2px">E</span>
              </div>
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:10px;text-transform:uppercase">EGOS</div>
              <div style="font-size:10px;color:#c5a47e;letter-spacing:4px;margin-top:2px;text-transform:uppercase">Wear Your Truth</div>
            </div>

            <!-- BANNER MOTIVACIONAL -->
            <div style="background:linear-gradient(135deg,#c5a47e,#a67c52);padding:40px;text-align:center">
              <div style="font-size:52px;margin-bottom:12px">🎁</div>
              <h1 style="color:#111827;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px">
                ¡{nombre_corto}, te lo mereces!
              </h1>
              <p style="color:#111827;margin:10px 0 0;font-size:14px;opacity:0.8">
                Tu lealtad con EGOS tiene recompensa
              </p>
            </div>

            <!-- CUERPO -->
            <div style="padding:40px">

              <p style="font-size:17px;color:#111827;margin:0 0 16px">
                Hola <strong>{nombre_corto}</strong> 👋
              </p>

              <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">
                Llevas más de <strong>18 meses</strong> siendo parte de la familia EGOS y eso
                no pasa desapercibido. Tu confianza y fidelidad son lo que nos impulsa a seguir
                creando moda que te represente. Por eso, hoy queremos darte algo especial.
              </p>

              <!-- BONO -->
              <div style="background:#111827;border-radius:16px;padding:32px;text-align:center;margin-bottom:28px">
                <p style="margin:0 0 8px;font-size:12px;color:#c5a47e;letter-spacing:3px;text-transform:uppercase">Tu bono exclusivo</p>
                <p style="margin:0 0 4px;font-size:42px;font-weight:900;color:#c5a47e">&#36;100.000</p>
                <p style="margin:0 0 24px;font-size:12px;color:#9ca3af">COP — descuento directo en tu próxima compra</p>
                <div style="background:#1f2937;border-radius:10px;padding:16px;display:inline-block;min-width:260px">
                  <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;letter-spacing:2px">CÓDIGO DE BONO</p>
                  <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;font-family:monospace;letter-spacing:4px">{codigo}</p>
                </div>
                <p style="margin:16px 0 0;font-size:12px;color:#6b7280">
                  ⏰ Válido hasta el <strong style="color:#c5a47e">{fecha_str}</strong>
                </p>
              </div>

              <!-- INSTRUCCIONES -->
              <div style="background:#faf8f5;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #f0ebe4">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827">¿Cómo usar tu bono?</p>
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
                  <span style="background:#c5a47e;color:#111827;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">1</span>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">Elige los productos que quieras en <strong style="color:#111827">egoscolombia.com.co</strong></p>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
                  <span style="background:#c5a47e;color:#111827;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">2</span>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">Ve al carrito y selecciona tu método de pago</p>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px">
                  <span style="background:#c5a47e;color:#111827;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">3</span>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">Ingresa el código <strong style="color:#111827;font-family:monospace">{codigo}</strong> en el campo de bono y se descontarán <strong style="color:#111827">&#36;100.000</strong> automáticamente</p>
                </div>
              </div>

              <!-- AVISO IMPORTANTE -->
              <div style="background:#fff8e1;border-left:4px solid #c5a47e;border-radius:0 8px 8px 0;padding:16px;margin-bottom:28px">
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#111827">⚠️ Importante antes de usar tu bono</p>
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7">
                  Este bono se consume en su totalidad al realizar una compra, sin importar el valor del pedido.
                  Si tu compra es menor a <strong style="color:#111827">&#36;100.000</strong>, el saldo restante
                  <strong style="color:#111827">no se acumula ni se devuelve</strong>.
                  Te recomendamos usarlo en una compra igual o superior a <strong style="color:#111827">&#36;100.000</strong>
                  para aprovecharlo al máximo.
                </p>
              </div>
              <div style="text-align:center">
                <a href="{FRONTEND_URL}" style="display:inline-block;background:#c5a47e;color:#111827;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:1px">
                  Ir a la Tienda
                </a>
              </div>

            </div>

            <!-- FOOTER -->
            <div style="background:#111827;padding:28px 40px;text-align:center">
              <p style="margin:0 0 8px;font-size:11px;color:#c5a47e;letter-spacing:3px;text-transform:uppercase">EGOS — Wear Your Truth</p>
              <p style="margin:0;font-size:11px;color:#6b7280">Este bono es personal e intransferible · egoscolombia.com.co</p>
              <p style="margin:8px 0 0;font-size:10px;color:#4b5563">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>

          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, email, msg.as_string())

        print(f"📧 Correo motivacional de bono enviado a {email}")
    except Exception as e:
        print(f"⚠️ Error enviando correo de bono: {e}")

# ============================================
# CRON - Verificación nocturna de bonos
# ============================================
async def verificar_bonos_nocturnos():
    """Corre al iniciar y luego cada 24h."""
    while True:
        print("🌙 Iniciando verificación de bonos...")
        try:
            db = next(get_db())

            # Obtener todos los clientes activos desde auth-service
            async with httpx.AsyncClient(timeout=10) as client:
                try:
                    res = await client.get(f"{AUTH_SERVICE_URL}/api/usuarios/todos/clientes")
                    if res.status_code != 200:
                        print(f"⚠️ No se pudo obtener lista de clientes: {res.status_code}")
                        await asyncio.sleep(86400)
                        continue
                    usuarios = res.json().get("usuarios", [])
                    print(f"👥 Verificando {len(usuarios)} clientes...")
                except Exception as e:
                    print(f"⚠️ Error consultando usuarios: {e}")
                    await asyncio.sleep(86400)
                    continue

            for usuario in usuarios:
                if usuario.get("rol") != "cliente":
                    continue

                usuario_id = usuario.get("id")
                email = usuario.get("email")
                nombre = usuario.get("nombre", "Cliente")
                fecha_registro = usuario.get("fecha_creacion")

                if not fecha_registro:
                    continue

                # Calcular antigüedad
                fecha_reg = datetime.fromisoformat(fecha_registro.replace("Z", ""))
                meses = (datetime.now() - fecha_reg).days // 30

                if meses < MESES_BONO_ANTIGUEDAD:
                    continue

                # Verificar compras en últimos 12 meses (desde transaction-service)
                try:
                    async with httpx.AsyncClient(timeout=10) as client:
                        res = await client.get(
                            f"http://transaction-service:3003/api/admin/compras-count/{usuario_id}",
                            params={"meses": 12}
                        )
                        num_compras = res.json().get("total", 0) if res.status_code == 200 else 0
                except:
                    num_compras = 0

                # Primera vez: solo necesita 18 meses
                # Renovación: necesita 9 compras en últimos 12 meses
                periodo_actual = datetime.now().strftime("%Y-%m")
                bono_existente = db.query(Bono).filter(
                    Bono.usuario_id == usuario_id,
                    Bono.periodo == periodo_actual
                ).first()

                if bono_existente:
                    continue  # Ya tiene bono este período

                # Verificar si es primera vez o renovación
                bonos_anteriores = db.query(Bono).filter(Bono.usuario_id == usuario_id).count()
                es_primera_vez = bonos_anteriores == 0

                if not es_primera_vez and num_compras < COMPRAS_MINIMAS_RENOVACION:
                    print(f"⚠️ Usuario {usuario_id}: solo {num_compras} compras, no califica renovación")
                    continue

                # Generar código único — verificar en BD antes de guardar
                intentos = 0
                while intentos < 10:
                    codigo = generar_codigo_bono(usuario_id)
                    existe = db.query(Bono).filter(Bono.codigo == codigo).first()
                    if not existe:
                        break
                    intentos += 1
                    print(f"⚠️ Código {codigo} ya existe, generando otro...")

                fecha_vencimiento = datetime.now() + timedelta(days=DIAS_VENCIMIENTO_BONO)

                nuevo_bono = Bono(
                    codigo=codigo,
                    usuario_id=usuario_id,
                    monto=MONTO_BONO,
                    estado="Disponible",
                    fecha_vencimiento=fecha_vencimiento,
                    periodo=periodo_actual
                )
                db.add(nuevo_bono)
                db.commit()

                # Enviar correo
                enviar_correo_bono(email, nombre, codigo, fecha_vencimiento)
                print(f"✅ Bono generado para usuario {usuario_id}: {codigo}")

        except Exception as e:
            print(f"❌ Error en verificación de bonos: {e}")

        # Esperar 24h antes de la próxima verificación
        print("🕒 Próxima verificación de bonos en 24 horas")
        await asyncio.sleep(86400)

# ============================================
# APP
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("✅ Credit Service v3.0 conectado a PostgreSQL")
    # Iniciar cron en background
    asyncio.create_task(verificar_bonos_nocturnos())
    yield

app = FastAPI(title="Credit Service v3.0", version="3.0.0", lifespan=lifespan)

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
class PerfilCliente(BaseModel):
    usuario_id: int
    fecha_registro: str
    total_compras_historico: float
    numero_compras: int = 0

class SolicitudCreditoInterno(BaseModel):
    usuario_id: int
    monto_solicitado: float
    plazo_meses: int

class PagoCredito(BaseModel):
    credito_id: str
    monto: float

class CargoCredito(BaseModel):
    credito_id: str
    pedido_id: str
    monto: float

class ValidarBono(BaseModel):
    codigo: str
    usuario_id: int

class AplicarBono(BaseModel):
    codigo: str
    usuario_id: int
    pedido_id: str

# ============================================
# ENDPOINTS CRÉDITO
# ============================================
@app.get("/api/credito/comparar/{monto}/{plazo}")
async def comparar_opciones(monto: float, plazo: int, usuario_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Compara opciones de crédito propio vs aliados"""
    opciones = []

    # Opción EGOS (crédito interno) — solo si el usuario califica
    disponible_egos = False
    if usuario_id:
        credito = db.query(CreditoInterno).filter(
            CreditoInterno.usuario_id == usuario_id,
            CreditoInterno.estado == "Activo"
        ).first()
        disponible_egos = credito is not None and (credito.limite_credito - credito.saldo_usado) >= monto

    tasa_egos = calcular_tasa_interes(plazo)
    calculo_egos = calcular_cuota(monto, tasa_egos, plazo)
    opciones.append({
        "proveedor": "EGOS",
        "tipo": "Crédito Propio",
        "disponible": disponible_egos,
        "tasa_mensual": tasa_egos,
        "cuota_mensual": calculo_egos["cuota_mensual"],
        "interes_total": calculo_egos["interes_total"],
        "total_pagar": calculo_egos["total_pagar"],
        "requisitos": "Mínimo 6 meses de antigüedad y $2.000.000 en compras",
        "estado_integracion": "Activo"
    })

    # Opción ADDI
    tasa_addi = 2.9
    calculo_addi = calcular_cuota(monto, tasa_addi, plazo)
    opciones.append({
        "proveedor": "ADDI",
        "tipo": "Crédito Externo",
        "disponible": False,
        "tasa_mensual": tasa_addi,
        "cuota_mensual": calculo_addi["cuota_mensual"],
        "interes_total": calculo_addi["interes_total"],
        "total_pagar": calculo_addi["total_pagar"],
        "requisitos": "Cédula colombiana y cuenta bancaria",
        "estado_integracion": "Próximamente"
    })

    # Opción Sistecredito
    tasa_siste = 3.2
    calculo_siste = calcular_cuota(monto, tasa_siste, plazo)
    opciones.append({
        "proveedor": "Sistecredito",
        "tipo": "Crédito Externo",
        "disponible": False,
        "tasa_mensual": tasa_siste,
        "cuota_mensual": calculo_siste["cuota_mensual"],
        "interes_total": calculo_siste["interes_total"],
        "total_pagar": calculo_siste["total_pagar"],
        "requisitos": "Historial crediticio positivo",
        "estado_integracion": "Próximamente"
    })

    return {"opciones": opciones, "monto": monto, "plazo": plazo}


@app.get("/salud")
async def verificar_salud(db: Session = Depends(get_db)):
    try:
        total_creditos = db.query(CreditoInterno).count()
        bonos_activos = db.query(Bono).filter(Bono.estado == "Disponible").count()
    except:
        total_creditos = 0
        bonos_activos = 0

    return {
        "estado": "activo",
        "servicio": "credito",
        "version": "3.0.0",
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "creditos_activos": total_creditos,
            "bonos_disponibles": bonos_activos
        },
        "reglas": {
            "monto_minimo_compras": MONTO_MINIMO_COMPRAS,
            "meses_minimos": MESES_MINIMOS,
            "meses_bono": MESES_BONO_ANTIGUEDAD,
            "compras_renovacion": COMPRAS_MINIMAS_RENOVACION,
            "limite_maximo": LIMITE_MAXIMO_CREDITO
        }
    }

@app.post("/api/credito/evaluar")
async def evaluar_cliente(perfil: PerfilCliente, db: Session = Depends(get_db)):
    print(f"💳 Evaluando cliente {perfil.usuario_id}")

    fecha_registro = datetime.fromisoformat(perfil.fecha_registro.replace("Z", ""))
    meses_antiguedad = (datetime.now() - fecha_registro).days // 30

    if meses_antiguedad < MESES_MINIMOS:
        return {
            "califica": False,
            "razon": f"Antigüedad insuficiente: {meses_antiguedad} meses (mínimo {MESES_MINIMOS})",
            "meses_antiguedad": meses_antiguedad
        }

    if perfil.total_compras_historico < MONTO_MINIMO_COMPRAS:
        return {
            "califica": False,
            "razon": f"Compras insuficientes: ${perfil.total_compras_historico:,.0f} (mínimo ${MONTO_MINIMO_COMPRAS:,.0f})",
            "total_compras": perfil.total_compras_historico
        }

    limite = calcular_limite_credito(perfil.total_compras_historico, meses_antiguedad)

    # Verificar si tiene bono disponible
    bono = db.query(Bono).filter(
        Bono.usuario_id == perfil.usuario_id,
        Bono.estado == "Disponible",
        Bono.fecha_vencimiento > datetime.now()
    ).first()

    return {
        "califica": True,
        "limite_aprobado": limite,
        "meses_antiguedad": meses_antiguedad,
        "total_compras": perfil.total_compras_historico,
        "tiene_bono": bono is not None,
        "codigo_bono": bono.codigo if bono else None,
        "monto_bono": bono.monto if bono else 0,
        "mensaje": "Cliente califica para crédito propio"
    }

@app.post("/api/credito/interno/solicitar")
async def solicitar_credito_interno(solicitud: SolicitudCreditoInterno, db: Session = Depends(get_db)):
    usuario_id = solicitud.usuario_id
    monto = solicitud.monto_solicitado
    plazo = solicitud.plazo_meses

    print(f"💳 Solicitud crédito: Usuario {usuario_id}, ${monto:,.0f} a {plazo} meses")

    # Verificar si ya tiene crédito activo
    credito_existente = db.query(CreditoInterno).filter(
        CreditoInterno.usuario_id == usuario_id,
        CreditoInterno.estado == "Activo"
    ).first()

    if credito_existente:
        saldo_disponible = credito_existente.limite_credito - credito_existente.saldo_usado
        if saldo_disponible < monto:
            return {
                "aprobado": False,
                "razon": f"Saldo insuficiente. Disponible: ${saldo_disponible:,.0f}",
                "saldo_disponible": saldo_disponible
            }
        tasa = calcular_tasa_interes(plazo)
        calculo = calcular_cuota(monto, tasa, plazo)
        return {
            "aprobado": True,
            "credito_id": credito_existente.id,
            "monto_aprobado": monto,
            "plazo_meses": plazo,
            "tasa_mensual": tasa,
            "cuota_mensual": calculo["cuota_mensual"],
            "interes_total": calculo["interes_total"],
            "total_pagar": calculo["total_pagar"],
            "mensaje": "Crédito aprobado con línea existente"
        }

    # Verificar requisitos mínimos consultando auth-service
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"{AUTH_SERVICE_URL}/api/usuarios/{usuario_id}")
            if res.status_code == 200:
                usuario = res.json().get("usuario", {})
                fecha_registro = usuario.get("fecha_creacion", "")
                total_compras = float(usuario.get("total_compras_historico", 0) or 0)

                if fecha_registro:
                    fecha_reg = datetime.fromisoformat(fecha_registro.replace("Z", ""))
                    meses_antiguedad = (datetime.now() - fecha_reg).days // 30

                    if meses_antiguedad < MESES_MINIMOS:
                        return {
                            "aprobado": False,
                            "razon": f"Antigüedad insuficiente: {meses_antiguedad} meses (mínimo {MESES_MINIMOS})"
                        }

                    if total_compras < MONTO_MINIMO_COMPRAS:
                        return {
                            "aprobado": False,
                            "razon": f"Compras insuficientes: ${total_compras:,.0f} (mínimo ${MONTO_MINIMO_COMPRAS:,.0f})"
                        }

                    limite_maximo = calcular_limite_credito(total_compras, meses_antiguedad)
                    if monto > limite_maximo:
                        return {
                            "aprobado": False,
                            "razon": f"Monto solicitado excede el límite aprobado: ${limite_maximo:,.0f}"
                        }
    except Exception as e:
        print(f"⚠️ No se pudo verificar perfil del usuario: {e}")

    # Crear nueva línea de crédito
    tasa = calcular_tasa_interes(plazo)
    calculo = calcular_cuota(monto, tasa, plazo)
    credito_id = f"CI-{usuario_id}-{int(datetime.now().timestamp())}"

    nuevo_credito = CreditoInterno(
        id=credito_id,
        usuario_id=usuario_id,
        limite_credito=monto,
        saldo_usado=monto,
        plazo_meses=plazo,
        tasa_mensual=tasa,
        cuota_mensual=calculo["cuota_mensual"],
        interes_total=calculo["interes_total"],
        total_pagar=calculo["total_pagar"],
        estado="Activo",
        fecha_vencimiento=datetime.now() + timedelta(days=plazo * 30),
        tabla_amortizacion=json.dumps(calculo["tabla_amortizacion"])
    )

    db.add(nuevo_credito)
    db.commit()

    return {
        "aprobado": True,
        "credito_id": credito_id,
        "monto_aprobado": monto,
        "plazo_meses": plazo,
        "tasa_mensual": tasa,
        "cuota_mensual": calculo["cuota_mensual"],
        "interes_total": calculo["interes_total"],
        "total_pagar": calculo["total_pagar"],
        "mensaje": "Crédito aprobado exitosamente"
    }

@app.post("/api/credito/interno/cargo")
async def realizar_cargo(cargo: CargoCredito, db: Session = Depends(get_db)):
    credito = db.query(CreditoInterno).filter(CreditoInterno.id == cargo.credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    saldo_disponible = credito.limite_credito - credito.saldo_usado
    if saldo_disponible < cargo.monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")

    credito.saldo_usado += cargo.monto

    txn = TransaccionCredito(
        id=f"TXN-{int(datetime.now().timestamp())}",
        credito_id=cargo.credito_id,
        tipo="Cargo",
        monto=cargo.monto,
        pedido_id=cargo.pedido_id
    )
    db.add(txn)
    db.commit()

    return {
        "mensaje": "Cargo realizado exitosamente",
        "transaccion_id": txn.id,
        "saldo_disponible": credito.limite_credito - credito.saldo_usado
    }

@app.post("/api/credito/interno/pago")
async def realizar_pago(pago: PagoCredito, db: Session = Depends(get_db)):
    credito = db.query(CreditoInterno).filter(CreditoInterno.id == pago.credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    credito.saldo_usado = max(0, credito.saldo_usado - pago.monto)
    if credito.saldo_usado <= 0:
        credito.estado = "Pagado"

    txn = TransaccionCredito(
        id=f"TXN-{int(datetime.now().timestamp())}",
        credito_id=pago.credito_id,
        tipo="Pago",
        monto=pago.monto
    )
    db.add(txn)
    db.commit()

    return {
        "mensaje": "Pago aplicado exitosamente",
        "saldo_disponible": credito.limite_credito - credito.saldo_usado,
        "estado": credito.estado
    }

@app.get("/api/credito/interno/usuario/{usuario_id}")
async def obtener_creditos_usuario(usuario_id: int, db: Session = Depends(get_db)):
    creditos = db.query(CreditoInterno).filter(CreditoInterno.usuario_id == usuario_id).all()
    return {
        "creditos": [{
            "id": c.id,
            "limite_credito": c.limite_credito,
            "saldo_usado": c.saldo_usado,
            "saldo_disponible": c.limite_credito - c.saldo_usado,
            "estado": c.estado,
            "cuota_mensual": c.cuota_mensual,
            "plazo_meses": c.plazo_meses
        } for c in creditos],
        "total": len(creditos)
    }

# ============================================
# ENDPOINTS BONOS
# ============================================

@app.post("/api/bonos/validar")
async def validar_bono(datos: ValidarBono, db: Session = Depends(get_db)):
    """Valida si un código de bono es válido para el usuario"""
    bono = db.query(Bono).filter(Bono.codigo == datos.codigo).first()

    if not bono:
        return {"valido": False, "razon": "Código de bono no existe"}

    # Solo el dueño puede usarlo
    if bono.usuario_id != datos.usuario_id:
        return {"valido": False, "razon": "Este bono no pertenece a tu cuenta"}

    # Ya fue usado — muerto para siempre
    if bono.estado == "Usado":
        return {"valido": False, "razon": "Este bono ya fue utilizado en un pedido anterior"}

    # Vencido
    if bono.estado == "Vencido" or bono.fecha_vencimiento < datetime.now():
        if bono.estado != "Vencido":
            bono.estado = "Vencido"
            db.commit()
        return {"valido": False, "razon": "Este bono ha vencido"}

    return {
        "valido": True,
        "monto": bono.monto,
        "fecha_vencimiento": bono.fecha_vencimiento.isoformat(),
        "codigo": bono.codigo
    }


@app.post("/api/bonos/aplicar")
async def aplicar_bono(datos: AplicarBono, db: Session = Depends(get_db)):
    """Aplica un bono a un pedido exitoso — lo mata para siempre"""
    bono = db.query(Bono).filter(Bono.codigo == datos.codigo).first()

    if not bono:
        raise HTTPException(status_code=404, detail="Bono no encontrado")

    # Solo el dueño puede usarlo
    if bono.usuario_id != datos.usuario_id:
        raise HTTPException(status_code=403, detail="Este bono no pertenece a tu cuenta")

    # Ya fue usado — no se puede usar dos veces
    if bono.estado == "Usado":
        raise HTTPException(status_code=400, detail="Este bono ya fue utilizado")

    # Vencido
    if bono.estado == "Vencido" or bono.fecha_vencimiento < datetime.now():
        if bono.estado != "Vencido":
            bono.estado = "Vencido"
            db.commit()
        raise HTTPException(status_code=400, detail="Este bono ha vencido")

    # Verificar que el pedido_id no esté ya asociado a otro bono (idempotencia)
    bono_pedido = db.query(Bono).filter(
        Bono.pedido_id == datos.pedido_id,
        Bono.estado == "Usado"
    ).first()
    if bono_pedido and bono_pedido.codigo != datos.codigo:
        raise HTTPException(status_code=400, detail="Este pedido ya tiene un bono aplicado")

    # Aplicar — el bono muere aquí
    bono.estado = "Usado"
    bono.fecha_uso = datetime.now()
    bono.pedido_id = datos.pedido_id
    db.commit()

    print(f"✅ Bono {datos.codigo} aplicado al pedido {datos.pedido_id} — CONSUMIDO")

    return {
        "mensaje": "Bono aplicado exitosamente",
        "monto_descontado": bono.monto,
        "pedido_id": datos.pedido_id,
        "estado": "Usado"
    }

@app.get("/api/bonos/usuario/{usuario_id}")
async def obtener_bonos_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los bonos de un usuario"""
    bonos = db.query(Bono).filter(Bono.usuario_id == usuario_id).order_by(Bono.fecha_generacion.desc()).all()

    # Marcar vencidos automáticamente
    for b in bonos:
        if b.estado == "Disponible" and b.fecha_vencimiento < datetime.now():
            b.estado = "Vencido"
    db.commit()

    return {
        "bonos": [{
            "codigo": b.codigo,
            "monto": b.monto,
            "estado": b.estado,
            "fecha_generacion": b.fecha_generacion.isoformat(),
            "fecha_vencimiento": b.fecha_vencimiento.isoformat(),
            "fecha_uso": b.fecha_uso.isoformat() if b.fecha_uso else None
        } for b in bonos],
        "total": len(bonos),
        "disponibles": sum(1 for b in bonos if b.estado == "Disponible")
    }

@app.post("/api/bonos/generar-manual/{usuario_id}")
async def generar_bono_manual(usuario_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Solo para testing/admin — genera un bono manualmente"""
    # Generar código único verificando en BD
    intentos = 0
    codigo = None
    while intentos < 10:
        candidato = generar_codigo_bono(usuario_id)
        existe = db.query(Bono).filter(Bono.codigo == candidato).first()
        if not existe:
            codigo = candidato
            break
        intentos += 1

    if not codigo:
        raise HTTPException(status_code=500, detail="No se pudo generar un código único")

    fecha_vencimiento = datetime.now() + timedelta(days=DIAS_VENCIMIENTO_BONO)
    periodo = datetime.now().strftime("%Y-%m")

    nuevo_bono = Bono(
        codigo=codigo,
        usuario_id=usuario_id,
        monto=MONTO_BONO,
        estado="Disponible",
        fecha_vencimiento=fecha_vencimiento,
        periodo=periodo
    )
    db.add(nuevo_bono)
    db.commit()

    return {
        "mensaje": "Bono generado exitosamente",
        "codigo": codigo,
        "monto": MONTO_BONO,
        "fecha_vencimiento": fecha_vencimiento.isoformat()
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3008))
    print(f"🚀 Credit Service v3.0 iniciando en puerto {puerto}")
    uvicorn.run(app, host="0.0.0.0", port=puerto)
