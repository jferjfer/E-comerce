from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from typing import Optional, List
from datetime import datetime, timedelta
import httpx
import json
from sqlalchemy.orm import Session
from database import get_db, init_db, CreditoInterno, TransaccionCredito

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("✅ Credit Service conectado a PostgreSQL")
    yield
    # Shutdown
    pass

app = FastAPI(title="Credit Service v2.0", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración APIs externas
ADDI_API_KEY = os.getenv("ADDI_API_KEY", "")
ADDI_API_URL = os.getenv("ADDI_API_URL", "https://api.addi.com/v1")
SISTECREDITO_API_KEY = os.getenv("SISTECREDITO_API_KEY", "")
SISTECREDITO_API_URL = os.getenv("SISTECREDITO_API_URL", "https://api.sistecredito.com/v1")

# Base de datos en memoria (solo para evaluaciones temporales)
clientes_historial = {}

class PerfilCliente(BaseModel):
    usuario_id: int
    fecha_registro: str
    total_compras_historico: float
    numero_compras: int

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

def calcular_limite_credito(total_compras: float, meses_antiguedad: int) -> float:
    """Calcula el límite de crédito según historial"""
    if total_compras < 1_000_000:
        return 0
    elif total_compras <= 3_000_000:
        factor = 0.5
    elif total_compras <= 5_000_000:
        factor = 0.7
    elif total_compras <= 10_000_000:
        factor = 1.0
    else:
        factor = 1.5
    
    limite_base = total_compras * factor
    
    if 6 <= meses_antiguedad < 12:
        bono = 200_000
    elif 12 <= meses_antiguedad < 24:
        bono = 500_000
    else:
        bono = 1_000_000
    
    return min(limite_base + bono, 15_000_000)

def calcular_tasa_interes(plazo_meses: int, meses_antiguedad: int) -> float:
    """Calcula tasa de interés mensual"""
    if plazo_meses <= 3:
        tasa_base = 2.5
    elif plazo_meses <= 6:
        tasa_base = 2.2
    else:
        tasa_base = 1.9
    
    if 12 <= meses_antiguedad < 24:
        descuento = 0.3
    elif meses_antiguedad >= 24:
        descuento = 0.5
    else:
        descuento = 0
    
    return tasa_base - descuento

def calcular_cuota(monto: float, tasa_mensual: float, plazo_meses: int) -> dict:
    """Calcula cuota y tabla de amortización"""
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
            "saldo": round(saldo - capital_mensual, 2)
        })
        saldo -= capital_mensual
    
    return {
        "cuota_mensual": round(cuota_mensual, 2),
        "interes_total": round(interes_total, 2),
        "total_pagar": round(total_pagar, 2),
        "tabla_amortizacion": tabla
    }

@app.get("/salud")
async def verificar_salud(db: Session = Depends(get_db)):
    try:
        total_creditos = db.query(CreditoInterno).count()
        monto_total = db.query(CreditoInterno).with_entities(CreditoInterno.saldo_usado).all()
        monto_prestado = sum([c[0] or 0 for c in monto_total])
    except:
        total_creditos = 0
        monto_prestado = 0
    
    return {
        "estado": "activo",
        "servicio": "credito",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "creditos_activos": total_creditos,
            "monto_total_prestado": monto_prestado
        },
        "integraciones": {
            "addi_configurado": bool(ADDI_API_KEY),
            "sistecredito_configurado": bool(SISTECREDITO_API_KEY),
            "postgresql_conectado": True
        }
    }

@app.post("/api/credito/evaluar")
async def evaluar_cliente(perfil: PerfilCliente):
    """Evalúa si el cliente califica para crédito propio"""
    print(f"💳 Evaluando cliente {perfil.usuario_id}")
    
    fecha_registro = datetime.fromisoformat(perfil.fecha_registro)
    meses_antiguedad = (datetime.now() - fecha_registro).days // 30
    
    if meses_antiguedad < 6:
        return {
            "califica": False,
            "razon": f"Antigüedad insuficiente: {meses_antiguedad} meses (mínimo 6)",
            "meses_antiguedad": meses_antiguedad
        }
    
    if perfil.total_compras_historico < 1_000_000:
        return {
            "califica": False,
            "razon": f"Compras insuficientes: ${perfil.total_compras_historico:,.0f} (mínimo $1,000,000)",
            "total_compras": perfil.total_compras_historico
        }
    
    limite = calcular_limite_credito(perfil.total_compras_historico, meses_antiguedad)
    
    clientes_historial[perfil.usuario_id] = {
        "meses_antiguedad": meses_antiguedad,
        "total_compras": perfil.total_compras_historico,
        "limite_aprobado": limite,
        "fecha_evaluacion": datetime.now().isoformat()
    }
    
    return {
        "califica": True,
        "limite_aprobado": limite,
        "meses_antiguedad": meses_antiguedad,
        "total_compras": perfil.total_compras_historico,
        "mensaje": "Cliente califica para crédito propio"
    }

@app.post("/api/credito/interno/solicitar")
async def solicitar_credito_interno(solicitud: SolicitudCreditoInterno, db: Session = Depends(get_db)):
    """Solicita crédito propio"""
    usuario_id = solicitud.usuario_id
    monto = solicitud.monto_solicitado
    plazo = solicitud.plazo_meses
    
    print(f"💳 Solicitud crédito interno: Usuario {usuario_id}, ${monto:,.0f} a {plazo} meses")
    
    if usuario_id not in clientes_historial:
        raise HTTPException(status_code=400, detail="Debe evaluar al cliente primero")
    
    historial = clientes_historial[usuario_id]
    limite = historial["limite_aprobado"]
    
    if monto > limite:
        return {
            "aprobado": False,
            "razon": f"Monto excede límite aprobado de ${limite:,.0f}",
            "limite_disponible": limite
        }
    
    tasa = calcular_tasa_interes(plazo, historial["meses_antiguedad"])
    calculo = calcular_cuota(monto, tasa, plazo)
    
    credito_id = f"CI-{usuario_id}-{int(datetime.now().timestamp())}"
    
    # Guardar en PostgreSQL
    nuevo_credito = CreditoInterno(
        id=credito_id,
        usuario_id=usuario_id,
        limite_credito=limite,
        saldo_usado=monto,
        plazo_meses=plazo,
        tasa_mensual=tasa,
        cuota_mensual=calculo["cuota_mensual"],
        interes_total=calculo["interes_total"],
        total_pagar=calculo["total_pagar"],
        estado="Activo",
        fecha_vencimiento=datetime.now() + timedelta(days=plazo*30),
        tabla_amortizacion=json.dumps(calculo["tabla_amortizacion"])
    )
    
    db.add(nuevo_credito)
    db.commit()
    db.refresh(nuevo_credito)
    
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

@app.get("/api/credito/interno/{credito_id}")
async def obtener_credito_interno(credito_id: str, db: Session = Depends(get_db)):
    credito = db.query(CreditoInterno).filter(CreditoInterno.id == credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    return {
        "credito": {
            "id": credito.id,
            "usuario_id": credito.usuario_id,
            "monto_aprobado": credito.saldo_usado,
            "limite_credito": credito.limite_credito,
            "saldo_usado": credito.saldo_usado,
            "saldo_disponible": credito.limite_credito - credito.saldo_usado,
            "plazo_meses": credito.plazo_meses,
            "tasa_mensual": credito.tasa_mensual,
            "cuota_mensual": credito.cuota_mensual,
            "interes_total": credito.interes_total,
            "total_pagar": credito.total_pagar,
            "estado": credito.estado,
            "fecha_aprobacion": credito.fecha_aprobacion.isoformat(),
            "fecha_vencimiento": credito.fecha_vencimiento.isoformat() if credito.fecha_vencimiento else None,
            "tabla_amortizacion": json.loads(credito.tabla_amortizacion) if credito.tabla_amortizacion else []
        }
    }

@app.get("/api/credito/interno/usuario/{usuario_id}")
async def obtener_creditos_usuario(usuario_id: int):
    creditos = [c for c in creditos_internos.values() if c["usuario_id"] == usuario_id]
    return {"creditos": creditos, "total": len(creditos)}

@app.post("/api/credito/interno/cargo")
async def realizar_cargo(cargo: CargoCredito):
    credito = creditos_internos.get(cargo.credito_id)
    
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    if credito["saldo_disponible"] < cargo.monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    credito["saldo_usado"] += cargo.monto
    credito["saldo_disponible"] -= cargo.monto
    
    transaccion_id = f"TXN-{int(datetime.now().timestamp())}"
    transacciones[transaccion_id] = {
        "id": transaccion_id,
        "credito_id": cargo.credito_id,
        "tipo": "Cargo",
        "monto": cargo.monto,
        "pedido_id": cargo.pedido_id,
        "fecha": datetime.now().isoformat()
    }
    
    return {
        "mensaje": "Cargo realizado exitosamente",
        "transaccion_id": transaccion_id,
        "saldo_disponible": credito["saldo_disponible"]
    }

@app.post("/api/credito/interno/pago")
async def realizar_pago(pago: PagoCredito):
    credito = creditos_internos.get(pago.credito_id)
    
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    credito["saldo_usado"] -= pago.monto
    credito["saldo_disponible"] += pago.monto
    
    if credito["saldo_usado"] <= 0:
        credito["estado"] = "Pagado"
    
    transaccion_id = f"TXN-{int(datetime.now().timestamp())}"
    transacciones[transaccion_id] = {
        "id": transaccion_id,
        "credito_id": pago.credito_id,
        "tipo": "Pago",
        "monto": pago.monto,
        "fecha": datetime.now().isoformat()
    }
    
    return {
        "mensaje": "Pago aplicado exitosamente",
        "transaccion_id": transaccion_id,
        "saldo_disponible": credito["saldo_disponible"],
        "estado": credito["estado"]
    }

@app.get("/api/credito/interno/{credito_id}/transacciones")
async def obtener_transacciones(credito_id: str):
    txns = [t for t in transacciones.values() if t["credito_id"] == credito_id]
    return {"transacciones": txns, "total": len(txns)}

# ============================================
# INTEGRACIONES EXTERNAS (PREPARADAS)
# ============================================

@app.post("/api/credito/externo/addi/solicitar")
async def solicitar_addi(usuario_id: int, monto: float, plazo_meses: int):
    """Solicita crédito con ADDI (requiere API key configurada)"""
    
    if not ADDI_API_KEY:
        return {
            "error": "ADDI no configurado",
            "mensaje": "Configure ADDI_API_KEY en variables de entorno",
            "simulacion": True
        }
    
    # TODO: Integración real con ADDI
    # async with httpx.AsyncClient() as client:
    #     response = await client.post(
    #         f"{ADDI_API_URL}/credit/apply",
    #         headers={"Authorization": f"Bearer {ADDI_API_KEY}"},
    #         json={"user_id": usuario_id, "amount": monto, "term": plazo_meses}
    #     )
    #     return response.json()
    
    return {
        "proveedor": "ADDI",
        "mensaje": "Integración pendiente - Configure API key",
        "documentacion": "https://docs.addi.com/api"
    }

@app.post("/api/credito/externo/sistecredito/solicitar")
async def solicitar_sistecredito(usuario_id: int, monto: float, plazo_meses: int):
    """Solicita crédito con Sistecredito (requiere API key configurada)"""
    
    if not SISTECREDITO_API_KEY:
        return {
            "error": "Sistecredito no configurado",
            "mensaje": "Configure SISTECREDITO_API_KEY en variables de entorno",
            "simulacion": True
        }
    
    # TODO: Integración real con Sistecredito
    # async with httpx.AsyncClient() as client:
    #     response = await client.post(
    #         f"{SISTECREDITO_API_URL}/solicitudes",
    #         headers={"X-API-Key": SISTECREDITO_API_KEY},
    #         json={"cliente_id": usuario_id, "monto": monto, "plazo": plazo_meses}
    #     )
    #     return response.json()
    
    return {
        "proveedor": "SISTECREDITO",
        "mensaje": "Integración pendiente - Configure API key",
        "documentacion": "https://docs.sistecredito.com"
    }

@app.get("/api/credito/comparar/{monto}/{plazo}")
async def comparar_opciones(monto: float, plazo: int, usuario_id: int = None):
    """Compara opciones de crédito disponibles"""
    
    opciones = []
    
    # Solo mostrar crédito propio si el cliente califica
    if usuario_id and usuario_id in clientes_historial:
        historial = clientes_historial[usuario_id]
        if historial.get("limite_aprobado", 0) >= monto:
            tasa_propio = calcular_tasa_interes(plazo, historial["meses_antiguedad"])
            calculo_propio = calcular_cuota(monto, tasa_propio, plazo)
            opciones.append({
                "proveedor": "ESTILO_MODA",
                "tipo": "Crédito Propio",
                "disponible": True,
                "tasa_mensual": tasa_propio,
                "cuota_mensual": calculo_propio["cuota_mensual"],
                "interes_total": calculo_propio["interes_total"],
                "total_pagar": calculo_propio["total_pagar"],
                "requisitos": "6 meses antigüedad + $1M en compras"
            })
    
    # ADDI
    if plazo <= 12:
        opciones.append({
            "proveedor": "ADDI",
            "tipo": "Crédito Externo",
            "disponible": bool(ADDI_API_KEY),
            "tasa_mensual": 2.8,
            "cuota_mensual": calcular_cuota(monto, 2.8, plazo)["cuota_mensual"],
            "interes_total": calcular_cuota(monto, 2.8, plazo)["interes_total"],
            "total_pagar": calcular_cuota(monto, 2.8, plazo)["total_pagar"],
            "requisitos": "Aprobación inmediata",
            "estado_integracion": "Configurado" if ADDI_API_KEY else "Pendiente"
        })
    
    # Sistecredito
    if plazo <= 18:
        opciones.append({
            "proveedor": "SISTECREDITO",
            "tipo": "Crédito Externo",
            "disponible": bool(SISTECREDITO_API_KEY),
            "tasa_mensual": 2.4,
            "cuota_mensual": calcular_cuota(monto, 2.4, plazo)["cuota_mensual"],
            "interes_total": calcular_cuota(monto, 2.4, plazo)["interes_total"],
            "total_pagar": calcular_cuota(monto, 2.4, plazo)["total_pagar"],
            "requisitos": "Aprobación en 24h",
            "estado_integracion": "Configurado" if SISTECREDITO_API_KEY else "Pendiente"
        })
    
    opciones.sort(key=lambda x: x["cuota_mensual"])
    
    return {
        "monto": monto,
        "plazo_meses": plazo,
        "opciones": opciones,
        "mejor_opcion": opciones[0]["proveedor"]
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3008))
    print(f"🚀 Credit Service v2.0 iniciando en puerto {puerto}")
    print(f"📋 ADDI: {'✅ Configurado' if ADDI_API_KEY else '⚠️ Pendiente'}")
    print(f"📋 Sistecredito: {'✅ Configurado' if SISTECREDITO_API_KEY else '⚠️ Pendiente'}")
    uvicorn.run("main:app", host="0.0.0.0", port=puerto, reload=True)
