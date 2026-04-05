"""
Contabilidad Service v1.0 — EGOS
Contabilidad automática para VERTEL & CATILLO S.A.S
NIT: 902.051.708-6 | CIIU: 4771/4642 | Régimen SIMPLE
"""
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import uvicorn
import os

from database import (
    get_db, init_db, AsientoContable, MovimientoContable,
    SaldoCuenta, CuentaPUC, DeclaracionIVA, AnticipoPSIMPLE,
    get_transaction_db, TransactionSession
)
from motor_contable import (
    registrar_venta, registrar_pago, registrar_devolucion,
    registrar_credito_interno, calcular_iva_bimestre,
    calcular_anticipo_simple, registrar_compra
)

EMPRESA = {
    "razon_social": "VERTEL & CATILLO S.A.S",
    "nit": "902.051.708-6",
    "direccion": "Carrera 107 A Bis 69 B 58, Bogotá D.C.",
    "email": "servicioalcliente@egoscolombia.com",
    "regimen": "SIMPLE",
    "ciiu_principal": "4771",
    "rep_legal": "JOSE FERNANDO VERTEL LOBATO"
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from database import init_transaction_db
    init_transaction_db()
    print("✅ Contabilidad Service v1.0 iniciado")
    yield


app = FastAPI(
    title="EGOS Contabilidad Service",
    description="Contabilidad automática — VERTEL & CATILLO S.A.S",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# MODELOS
# ============================================
class EventoVenta(BaseModel):
    pedido_id: str
    total: float
    usuario_id: Optional[int] = None
    metodo_pago: Optional[str] = "pago_en_linea"
    fecha: Optional[str] = None

class EventoDevolucion(BaseModel):
    pedido_id: str
    total: float
    fecha: Optional[str] = None

class EventoCredito(BaseModel):
    credito_id: str
    monto: float
    intereses: Optional[float] = 0
    fecha: Optional[str] = None

class AsientoManual(BaseModel):
    descripcion: str
    referencia: Optional[str] = None
    movimientos: List[dict]


class RegistrarCompra(BaseModel):
    proveedor_nombre: str
    descripcion: str
    subtotal: float
    tipo_compra: str = "Mercancia"  # Mercancia, Servicio, Publicidad, Transporte, Arriendo, Servicios_publicos, Papeleria, Otro
    iva: float = 0
    forma_pago: str = "Contado"  # Contado, Credito
    proveedor_nit: Optional[str] = None
    numero_factura: Optional[str] = None
    tipo_factura: str = "Talonario"  # Talonario, Electronica
    plazo_dias: int = 0
    fecha: Optional[str] = None


# ============================================
# ENDPOINTS — EVENTOS AUTOMÁTICOS
# ============================================

@app.post("/api/contabilidad/eventos/venta")
async def evento_venta(evento: EventoVenta, db: Session = Depends(get_db)):
    """Registra asiento contable automático por venta"""
    try:
        fecha = datetime.fromisoformat(evento.fecha) if evento.fecha else datetime.now()
        asiento = registrar_venta(db, evento.pedido_id, evento.total, evento.usuario_id, fecha)

        # También registrar el pago inmediatamente
        registrar_pago(db, evento.pedido_id, evento.total, evento.metodo_pago or "pago_en_linea", fecha)

        return {
            "mensaje": "Asiento de venta registrado",
            "asiento_id": asiento.id,
            "numero": asiento.numero,
            "total": evento.total
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contabilidad/eventos/devolucion")
async def evento_devolucion(evento: EventoDevolucion, db: Session = Depends(get_db)):
    """Registra asiento contable automático por devolución"""
    try:
        fecha = datetime.fromisoformat(evento.fecha) if evento.fecha else datetime.now()
        asiento = registrar_devolucion(db, evento.pedido_id, evento.total, fecha)
        return {
            "mensaje": "Asiento de devolución registrado",
            "asiento_id": asiento.id,
            "numero": asiento.numero
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contabilidad/eventos/credito")
async def evento_credito(evento: EventoCredito, db: Session = Depends(get_db)):
    """Registra asiento contable por crédito interno"""
    try:
        fecha = datetime.fromisoformat(evento.fecha) if evento.fecha else datetime.now()
        asiento = registrar_credito_interno(db, evento.credito_id, evento.monto, evento.intereses or 0, fecha)
        return {
            "mensaje": "Asiento de crédito registrado",
            "asiento_id": asiento.id,
            "numero": asiento.numero
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS — LIBRO DIARIO
# ============================================

@app.get("/api/contabilidad/libro-diario")
async def libro_diario(
    periodo: Optional[str] = Query(None, description="YYYY-MM"),
    tipo: Optional[str] = Query(None),
    pagina: int = Query(1),
    limite: int = Query(50),
    db: Session = Depends(get_db)
):
    """Libro diario con todos los asientos"""
    query = db.query(AsientoContable)

    if periodo:
        query = query.filter(AsientoContable.periodo == periodo)
    if tipo:
        query = query.filter(AsientoContable.tipo == tipo)

    total = query.count()
    asientos = query.order_by(AsientoContable.numero.desc()).offset((pagina - 1) * limite).limit(limite).all()

    resultado = []
    for a in asientos:
        movs = db.query(MovimientoContable).filter(MovimientoContable.asiento_id == a.id).all()
        resultado.append({
            "id": a.id,
            "numero": a.numero,
            "fecha": a.fecha.isoformat(),
            "tipo": a.tipo,
            "descripcion": a.descripcion,
            "referencia": a.referencia,
            "total_debito": a.total_debito,
            "total_credito": a.total_credito,
            "periodo": a.periodo,
            "estado": a.estado,
            "movimientos": [{
                "codigo": m.codigo_cuenta,
                "cuenta": m.nombre_cuenta,
                "debito": m.debito,
                "credito": m.credito,
                "descripcion": m.descripcion
            } for m in movs]
        })

    return {
        "asientos": resultado,
        "total": total,
        "pagina": pagina,
        "total_paginas": (total + limite - 1) // limite
    }


# ============================================
# ENDPOINTS — LIBRO MAYOR
# ============================================

@app.get("/api/contabilidad/libro-mayor")
async def libro_mayor(
    periodo: Optional[str] = Query(None),
    codigo_cuenta: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Libro mayor — saldos por cuenta"""
    query = db.query(SaldoCuenta)

    if periodo:
        query = query.filter(SaldoCuenta.periodo == periodo)
    if codigo_cuenta:
        query = query.filter(SaldoCuenta.codigo_cuenta == codigo_cuenta)

    saldos = query.order_by(SaldoCuenta.codigo_cuenta, SaldoCuenta.periodo).all()

    return {
        "saldos": [{
            "codigo": s.codigo_cuenta,
            "cuenta": s.nombre_cuenta,
            "periodo": s.periodo,
            "tipo": s.tipo_cuenta,
            "naturaleza": s.naturaleza,
            "saldo_inicial": s.saldo_inicial,
            "total_debitos": s.total_debitos,
            "total_creditos": s.total_creditos,
            "saldo_final": s.saldo_final
        } for s in saldos],
        "total": len(saldos)
    }


# ============================================
# ENDPOINTS — BALANCE GENERAL
# ============================================

@app.get("/api/contabilidad/balance-general")
async def balance_general(
    periodo: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Balance General — Activos, Pasivos y Patrimonio"""
    if not periodo:
        periodo = datetime.now().strftime("%Y-%m")

    saldos = db.query(SaldoCuenta).filter(SaldoCuenta.periodo == periodo).all()

    activos = {}
    pasivos = {}
    patrimonio = {}
    utilidad_ejercicio = 0

    for s in saldos:
        item = {
            "codigo": s.codigo_cuenta,
            "cuenta": s.nombre_cuenta,
            "saldo": s.saldo_final
        }
        if s.tipo_cuenta == "Activo" and s.saldo_final != 0:
            activos[s.codigo_cuenta] = item
        elif s.tipo_cuenta == "Pasivo" and s.saldo_final != 0:
            pasivos[s.codigo_cuenta] = item
        elif s.tipo_cuenta == "Patrimonio" and s.saldo_final != 0:
            patrimonio[s.codigo_cuenta] = item
        elif s.tipo_cuenta == "Ingreso" and s.saldo_final != 0:
            utilidad_ejercicio += s.saldo_final
        elif s.tipo_cuenta in ("Gasto", "Costo") and s.saldo_final != 0:
            utilidad_ejercicio -= s.saldo_final

    # Agregar utilidad del ejercicio al patrimonio
    if utilidad_ejercicio != 0:
        patrimonio["3605"] = {
            "codigo": "3605",
            "cuenta": "Utilidad del ejercicio",
            "saldo": round(utilidad_ejercicio, 2)
        }

    total_activos = sum(v["saldo"] for v in activos.values())
    total_pasivos = sum(v["saldo"] for v in pasivos.values())
    total_patrimonio = sum(v["saldo"] for v in patrimonio.values())
    diferencia = abs(total_activos - (total_pasivos + total_patrimonio))

    return {
        "empresa": EMPRESA["razon_social"],
        "nit": EMPRESA["nit"],
        "periodo": periodo,
        "activos": {
            "cuentas": list(activos.values()),
            "total": round(total_activos, 2)
        },
        "pasivos": {
            "cuentas": list(pasivos.values()),
            "total": round(total_pasivos, 2)
        },
        "patrimonio": {
            "cuentas": list(patrimonio.values()),
            "total": round(total_patrimonio, 2)
        },
        "ecuacion": {
            "activos": round(total_activos, 2),
            "pasivos_mas_patrimonio": round(total_pasivos + total_patrimonio, 2),
            "cuadra": diferencia < 1
        }
    }


# ============================================
# ENDPOINTS — ESTADO DE RESULTADOS (P&G)
# ============================================

@app.get("/api/contabilidad/estado-resultados")
async def estado_resultados(
    periodo: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Estado de Resultados — Ingresos, Costos y Gastos"""
    if not periodo:
        periodo = datetime.now().strftime("%Y-%m")

    saldos = db.query(SaldoCuenta).filter(SaldoCuenta.periodo == periodo).all()

    ingresos = {}
    costos = {}
    gastos = {}

    for s in saldos:
        item = {"codigo": s.codigo_cuenta, "cuenta": s.nombre_cuenta, "valor": s.saldo_final}
        if s.tipo_cuenta == "Ingreso" and s.saldo_final != 0:
            ingresos[s.codigo_cuenta] = item
        elif s.tipo_cuenta == "Costo" and s.saldo_final != 0:
            costos[s.codigo_cuenta] = item
        elif s.tipo_cuenta == "Gasto" and s.saldo_final != 0:
            gastos[s.codigo_cuenta] = item

    total_ingresos = sum(v["valor"] for v in ingresos.values())
    total_costos = sum(v["valor"] for v in costos.values())
    total_gastos = sum(v["valor"] for v in gastos.values())
    utilidad_bruta = total_ingresos - total_costos
    utilidad_neta = utilidad_bruta - total_gastos

    return {
        "empresa": EMPRESA["razon_social"],
        "nit": EMPRESA["nit"],
        "periodo": periodo,
        "ingresos": {
            "cuentas": list(ingresos.values()),
            "total": round(total_ingresos, 2)
        },
        "costos": {
            "cuentas": list(costos.values()),
            "total": round(total_costos, 2)
        },
        "gastos": {
            "cuentas": list(gastos.values()),
            "total": round(total_gastos, 2)
        },
        "utilidad_bruta": round(utilidad_bruta, 2),
        "utilidad_neta": round(utilidad_neta, 2),
        "margen_bruto": round((utilidad_bruta / total_ingresos * 100) if total_ingresos > 0 else 0, 2),
        "margen_neto": round((utilidad_neta / total_ingresos * 100) if total_ingresos > 0 else 0, 2)
    }


# ============================================
# ENDPOINTS — IVA BIMESTRAL
# ============================================

@app.get("/api/contabilidad/iva/{anio}/{bimestre}")
async def iva_bimestral(anio: int, bimestre: int, db: Session = Depends(get_db)):
    """Calcula IVA a pagar para un bimestre — Formulario 300"""
    if bimestre < 1 or bimestre > 6:
        raise HTTPException(status_code=400, detail="Bimestre debe ser entre 1 y 6")

    resultado = calcular_iva_bimestre(db, anio, bimestre)

    # Fechas de vencimiento bimestrales (aproximadas)
    meses_vencimiento = {1: 3, 2: 5, 3: 7, 4: 9, 5: 11, 6: 1}
    mes_venc = meses_vencimiento[bimestre]
    anio_venc = anio if bimestre < 6 else anio + 1
    fecha_vencimiento = f"{anio_venc}-{mes_venc:02d}-15"

    return {
        **resultado,
        "formulario": "300",
        "fecha_vencimiento_aprox": fecha_vencimiento,
        "empresa": EMPRESA["razon_social"],
        "nit": EMPRESA["nit"]
    }


# ============================================
# ENDPOINTS — RÉGIMEN SIMPLE
# ============================================

@app.get("/api/contabilidad/simple/{anio}/{bimestre}")
async def anticipo_simple(anio: int, bimestre: int, db: Session = Depends(get_db)):
    """Calcula anticipo SIMPLE para un bimestre — Formulario 260"""
    resultado = calcular_anticipo_simple(db, anio, bimestre)

    meses_vencimiento = {1: 3, 2: 5, 3: 7, 4: 9, 5: 11, 6: 1}
    mes_venc = meses_vencimiento[bimestre]
    anio_venc = anio if bimestre < 6 else anio + 1

    return {
        **resultado,
        "formulario": "260",
        "fecha_vencimiento_aprox": f"{anio_venc}-{mes_venc:02d}-15",
        "empresa": EMPRESA["razon_social"],
        "nit": EMPRESA["nit"],
        "ciiu": EMPRESA["ciiu_principal"]
    }


# ============================================
# ENDPOINTS — DASHBOARD
# ============================================

@app.get("/api/contabilidad/dashboard")
async def dashboard(db: Session = Depends(get_db)):
    """Dashboard contable — lee de BD transacciones en tiempo real"""
    ahora = datetime.now()
    periodo_actual = ahora.strftime("%Y-%m")
    periodo_anterior = (ahora.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
    anio = ahora.year
    bimestre_actual = ((ahora.month - 1) // 2) + 1

    # Leer pedidos directamente de BD transacciones
    ventas_mes = 0
    ventas_mes_anterior = 0
    devoluciones_mes = 0
    total_pedidos = 0
    ventas_historico = []

    from database import transaction_engine
    if transaction_engine:
        try:
            from sqlalchemy.orm import sessionmaker as sm
            TSession = sm(autocommit=False, autoflush=False, bind=transaction_engine)
            tdb = TSession()

            # Ventas mes actual
            res = tdb.execute(__import__('sqlalchemy').text("""
                SELECT COALESCE(SUM(total), 0)
                FROM pedido
                WHERE TO_CHAR(fecha_creacion, 'YYYY-MM') = :periodo
                AND estado != 'Cancelado'
            """), {"periodo": periodo_actual})
            ventas_mes = float(res.scalar() or 0)

            # Ventas mes anterior
            res = tdb.execute(__import__('sqlalchemy').text("""
                SELECT COALESCE(SUM(total), 0)
                FROM pedido
                WHERE TO_CHAR(fecha_creacion, 'YYYY-MM') = :periodo
                AND estado != 'Cancelado'
            """), {"periodo": periodo_anterior})
            ventas_mes_anterior = float(res.scalar() or 0)

            # Total pedidos
            res = tdb.execute(__import__('sqlalchemy').text("SELECT COUNT(*) FROM pedido"))
            total_pedidos = int(res.scalar() or 0)

            # Devoluciones mes actual
            res = tdb.execute(__import__('sqlalchemy').text("""
                SELECT COALESCE(SUM(p.total), 0)
                FROM devolucion d
                JOIN pedido p ON d.id_pedido = p.id
                WHERE TO_CHAR(d.fecha_creacion, 'YYYY-MM') = :periodo
                AND d.estado IN ('Aprobada', 'Completada')
            """), {"periodo": periodo_actual})
            devoluciones_mes = float(res.scalar() or 0)

            # Ventas últimos 6 meses
            for i in range(5, -1, -1):
                year = ahora.year
                month = ahora.month - i
                if month <= 0:
                    month += 12
                    year -= 1
                p = f"{year}-{month:02d}"
                res = tdb.execute(__import__('sqlalchemy').text("""
                    SELECT COALESCE(SUM(total), 0)
                    FROM pedido
                    WHERE TO_CHAR(fecha_creacion, 'YYYY-MM') = :periodo
                    AND estado != 'Cancelado'
                """), {"periodo": p})
                v = float(res.scalar() or 0)
                ventas_historico.append({"periodo": p, "ventas": round(v, 2)})

            tdb.close()
        except Exception as e:
            print(f"⚠️ Error leyendo BD transacciones: {e}")
    else:
        # Fallback: leer de saldos contables
        ventas_mes = float(db.query(func.sum(SaldoCuenta.total_creditos)).filter(
            SaldoCuenta.codigo_cuenta == "413505",
            SaldoCuenta.periodo == periodo_actual
        ).scalar() or 0)
        for i in range(5, -1, -1):
            mes = (ahora.replace(day=1) - timedelta(days=i * 30))
            p = mes.strftime("%Y-%m")
            v = float(db.query(func.sum(SaldoCuenta.total_creditos)).filter(
                SaldoCuenta.codigo_cuenta == "413505",
                SaldoCuenta.periodo == p
            ).scalar() or 0)
            ventas_historico.append({"periodo": p, "ventas": round(v, 2)})

    # IVA y SIMPLE calculados sobre ventas reales
    base_mes = round(ventas_mes / 1.19, 2)
    iva_mes = round(ventas_mes - base_mes, 2)

    base_bimestre = 0
    iva_bimestre_valor = 0
    if transaction_engine:
        try:
            from sqlalchemy.orm import sessionmaker as sm2
            TSession2 = sm2(autocommit=False, autoflush=False, bind=transaction_engine)
            tdb = TSession2()
            meses_bimestre = {
                1: ["01", "02"], 2: ["03", "04"], 3: ["05", "06"],
                4: ["07", "08"], 5: ["09", "10"], 6: ["11", "12"]
            }
            for mes in meses_bimestre.get(bimestre_actual, []):
                periodo_b = f"{anio}-{mes}"
                res = tdb.execute(__import__('sqlalchemy').text("""
                    SELECT COALESCE(SUM(total), 0) FROM pedido
                    WHERE TO_CHAR(fecha_creacion, 'YYYY-MM') = :periodo
                    AND estado != 'Cancelado'
                """), {"periodo": periodo_b})
                base_bimestre += float(res.scalar() or 0)
            tdb.close()
            iva_bimestre_valor = round(base_bimestre - round(base_bimestre / 1.19, 2), 2)
        except Exception as e:
            print(f"⚠️ Error calculando IVA bimestre: {e}")

    total_asientos = db.query(func.count(AsientoContable.id)).filter(
        AsientoContable.periodo == periodo_actual
    ).scalar() or 0

    variacion_ventas = 0
    if ventas_mes_anterior > 0:
        variacion_ventas = round(((ventas_mes - ventas_mes_anterior) / ventas_mes_anterior) * 100, 1)

    return {
        "empresa": EMPRESA,
        "periodo_actual": periodo_actual,
        "resumen": {
            "ventas_mes": round(ventas_mes, 2),
            "ventas_mes_anterior": round(ventas_mes_anterior, 2),
            "variacion_ventas": variacion_ventas,
            "devoluciones_mes": round(devoluciones_mes, 2),
            "ventas_netas": round(ventas_mes - devoluciones_mes, 2),
            "iva_por_pagar": round(iva_mes, 2),
            "cuentas_por_cobrar": round(ventas_mes, 2),
            "efectivo_disponible": round(ventas_mes - devoluciones_mes, 2),
            "total_asientos_mes": total_asientos,
            "total_pedidos": total_pedidos
        },
        "obligaciones_fiscales": {
            "iva_bimestre": {
                "bimestre": bimestre_actual,
                "iva_a_pagar": iva_bimestre_valor,
                "base_gravable": round(base_bimestre / 1.19, 2) if base_bimestre > 0 else 0
            },
            "anticipo_simple": {
                "bimestre": bimestre_actual,
                "valor": round(base_bimestre * 0.011, 2),
                "ingresos_brutos": round(base_bimestre, 2)
            }
        },
        "ventas_historico": ventas_historico
    }
    ahora = datetime.now()
    periodo_actual = ahora.strftime("%Y-%m")
    periodo_anterior = (ahora.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
    anio = ahora.year
    bimestre_actual = ((ahora.month - 1) // 2) + 1

    # Ventas del mes actual
    ventas_mes = db.query(func.sum(SaldoCuenta.total_creditos)).filter(
        SaldoCuenta.codigo_cuenta == "413505",
        SaldoCuenta.periodo == periodo_actual
    ).scalar() or 0

    # Ventas mes anterior
    ventas_mes_anterior = db.query(func.sum(SaldoCuenta.total_creditos)).filter(
        SaldoCuenta.codigo_cuenta == "413505",
        SaldoCuenta.periodo == periodo_anterior
    ).scalar() or 0

    # Devoluciones del mes
    devoluciones_mes = db.query(func.sum(SaldoCuenta.total_debitos)).filter(
        SaldoCuenta.codigo_cuenta == "417505",
        SaldoCuenta.periodo == periodo_actual
    ).scalar() or 0

    # IVA por pagar acumulado
    iva_por_pagar = db.query(func.sum(SaldoCuenta.saldo_final)).filter(
        SaldoCuenta.codigo_cuenta == "240805"
    ).scalar() or 0

    # Cuentas por cobrar
    cxc = db.query(func.sum(SaldoCuenta.saldo_final)).filter(
        SaldoCuenta.codigo_cuenta == "130505"
    ).scalar() or 0

    # Efectivo disponible
    efectivo = db.query(func.sum(SaldoCuenta.saldo_final)).filter(
        SaldoCuenta.codigo_cuenta.in_(["110505", "111010"])
    ).scalar() or 0

    # Total asientos del mes
    total_asientos = db.query(func.count(AsientoContable.id)).filter(
        AsientoContable.periodo == periodo_actual
    ).scalar() or 0

    # Ventas por mes (últimos 6 meses)
    ventas_historico = []
    for i in range(5, -1, -1):
        mes = (ahora.replace(day=1) - timedelta(days=i * 30))
        p = mes.strftime("%Y-%m")
        v = db.query(func.sum(SaldoCuenta.total_creditos)).filter(
            SaldoCuenta.codigo_cuenta == "413505",
            SaldoCuenta.periodo == p
        ).scalar() or 0
        ventas_historico.append({"periodo": p, "ventas": round(v, 2)})

    # IVA bimestre actual
    iva_bimestre = calcular_iva_bimestre(db, anio, bimestre_actual)
    simple_bimestre = calcular_anticipo_simple(db, anio, bimestre_actual)

    variacion_ventas = 0
    if ventas_mes_anterior > 0:
        variacion_ventas = round(((ventas_mes - ventas_mes_anterior) / ventas_mes_anterior) * 100, 1)

    return {
        "empresa": EMPRESA,
        "periodo_actual": periodo_actual,
        "resumen": {
            "ventas_mes": round(ventas_mes, 2),
            "ventas_mes_anterior": round(ventas_mes_anterior, 2),
            "variacion_ventas": variacion_ventas,
            "devoluciones_mes": round(devoluciones_mes, 2),
            "ventas_netas": round(ventas_mes - devoluciones_mes, 2),
            "iva_por_pagar": round(iva_por_pagar, 2),
            "cuentas_por_cobrar": round(cxc, 2),
            "efectivo_disponible": round(efectivo, 2),
            "total_asientos_mes": total_asientos
        },
        "obligaciones_fiscales": {
            "iva_bimestre": {
                "bimestre": bimestre_actual,
                "iva_a_pagar": iva_bimestre["iva_a_pagar"],
                "base_gravable": iva_bimestre["base_gravable"]
            },
            "anticipo_simple": {
                "bimestre": bimestre_actual,
                "valor": simple_bimestre["valor_anticipo"],
                "ingresos_brutos": simple_bimestre["ingresos_brutos"]
            }
        },
        "ventas_historico": ventas_historico
    }


# ============================================
# ENDPOINTS — COMPRAS Y GASTOS
# ============================================

@app.post("/api/contabilidad/compras")
async def registrar_compra_endpoint(compra: RegistrarCompra, db: Session = Depends(get_db)):
    """Registra una compra a proveedor con asiento contable automático"""
    try:
        fecha = datetime.fromisoformat(compra.fecha) if compra.fecha else datetime.now()
        asiento = registrar_compra(
            db=db,
            proveedor_nombre=compra.proveedor_nombre,
            descripcion=compra.descripcion,
            subtotal=compra.subtotal,
            tipo_compra=compra.tipo_compra,
            iva=compra.iva,
            forma_pago=compra.forma_pago,
            proveedor_nit=compra.proveedor_nit,
            numero_factura=compra.numero_factura,
            tipo_factura=compra.tipo_factura,
            plazo_dias=compra.plazo_dias,
            fecha=fecha
        )
        return {
            "mensaje": "Compra registrada exitosamente",
            "asiento_id": asiento.id,
            "numero_asiento": asiento.numero,
            "total": compra.subtotal + compra.iva
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contabilidad/compras")
async def listar_compras(
    periodo: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    forma_pago: Optional[str] = Query(None),
    pagina: int = Query(1),
    limite: int = Query(50),
    db: Session = Depends(get_db)
):
    """Lista todas las compras registradas"""
    from database import Compra
    query = db.query(Compra)
    if periodo:
        query = query.filter(Compra.periodo == periodo)
    if tipo:
        query = query.filter(Compra.tipo_compra == tipo)
    if forma_pago:
        query = query.filter(Compra.forma_pago == forma_pago)

    total = query.count()
    compras = query.order_by(Compra.fecha.desc()).offset((pagina-1)*limite).limit(limite).all()

    return {
        "compras": [{
            "id": c.id,
            "numero": c.numero,
            "fecha": c.fecha.isoformat(),
            "proveedor": c.proveedor_nombre,
            "nit": c.proveedor_nit,
            "tipo_factura": c.tipo_factura,
            "numero_factura": c.numero_factura,
            "tipo_compra": c.tipo_compra,
            "descripcion": c.descripcion,
            "subtotal": c.subtotal,
            "iva": c.iva,
            "total": c.total,
            "forma_pago": c.forma_pago,
            "plazo_dias": c.plazo_dias,
            "estado": c.estado,
            "periodo": c.periodo
        } for c in compras],
        "total": total,
        "pagina": pagina,
        "total_paginas": (total + limite - 1) // limite
    }


@app.get("/api/contabilidad/compras/resumen")
async def resumen_compras(
    periodo: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Resumen de compras por tipo"""
    from database import Compra
    if not periodo:
        periodo = datetime.now().strftime("%Y-%m")

    compras = db.query(Compra).filter(Compra.periodo == periodo).all()

    por_tipo = {}
    total_iva_descontable = 0
    total_compras = 0
    pendientes = 0

    for c in compras:
        if c.tipo_compra not in por_tipo:
            por_tipo[c.tipo_compra] = {"cantidad": 0, "subtotal": 0, "iva": 0, "total": 0}
        por_tipo[c.tipo_compra]["cantidad"] += 1
        por_tipo[c.tipo_compra]["subtotal"] += c.subtotal
        por_tipo[c.tipo_compra]["iva"] += c.iva
        por_tipo[c.tipo_compra]["total"] += c.total
        total_iva_descontable += c.iva
        total_compras += c.total
        if c.estado == "Pendiente":
            pendientes += c.total

    return {
        "periodo": periodo,
        "total_compras": round(total_compras, 2),
        "total_iva_descontable": round(total_iva_descontable, 2),
        "cuentas_por_pagar": round(pendientes, 2),
        "por_tipo": por_tipo,
        "cantidad_total": len(compras)
    }


# ============================================
# ENDPOINTS — PUC
# ============================================

@app.get("/api/contabilidad/puc")
async def obtener_puc(
    nivel: Optional[int] = Query(None),
    tipo: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Plan Único de Cuentas"""
    query = db.query(CuentaPUC).filter(CuentaPUC.activa == True)
    if nivel:
        query = query.filter(CuentaPUC.nivel == nivel)
    if tipo:
        query = query.filter(CuentaPUC.tipo == tipo)

    cuentas = query.order_by(CuentaPUC.codigo).all()
    return {
        "cuentas": [{
            "codigo": c.codigo,
            "nombre": c.nombre,
            "tipo": c.tipo,
            "naturaleza": c.naturaleza,
            "nivel": c.nivel,
            "codigo_padre": c.codigo_padre
        } for c in cuentas],
        "total": len(cuentas)
    }


# ============================================
# ENDPOINTS — INFORMACIÓN EXÓGENA
# ============================================

@app.get("/api/contabilidad/exogena/{anio}")
async def informacion_exogena(anio: int, db: Session = Depends(get_db)):
    """
    Resumen para Información Exógena (Medios Magnéticos)
    Responsabilidad 14 del RUT
    """
    periodos = [f"{anio}-{m:02d}" for m in range(1, 13)]

    total_ventas = 0
    total_iva = 0
    total_devoluciones = 0

    for periodo in periodos:
        v = db.query(func.sum(SaldoCuenta.total_creditos)).filter(
            SaldoCuenta.codigo_cuenta == "413505",
            SaldoCuenta.periodo == periodo
        ).scalar() or 0
        total_ventas += v

        i = db.query(func.sum(SaldoCuenta.total_creditos)).filter(
            SaldoCuenta.codigo_cuenta == "240805",
            SaldoCuenta.periodo == periodo
        ).scalar() or 0
        total_iva += i

        d = db.query(func.sum(SaldoCuenta.total_debitos)).filter(
            SaldoCuenta.codigo_cuenta == "417505",
            SaldoCuenta.periodo == periodo
        ).scalar() or 0
        total_devoluciones += d

    return {
        "empresa": EMPRESA["razon_social"],
        "nit": EMPRESA["nit"],
        "anio": anio,
        "resumen_exogena": {
            "ingresos_brutos": round(total_ventas, 2),
            "devoluciones": round(total_devoluciones, 2),
            "ingresos_netos": round(total_ventas - total_devoluciones, 2),
            "iva_generado": round(total_iva, 2),
            "obligacion": "Responsabilidad 14 — Informante de Exógena",
            "vencimiento": f"Según calendario DIAN {anio + 1}"
        },
        "nota": "Presentar si ingresos brutos superan 500 millones COP en el año"
    }


@app.get("/salud")
async def salud(db: Session = Depends(get_db)):
    total_asientos = db.query(func.count(AsientoContable.id)).scalar() or 0
    total_cuentas = db.query(func.count(CuentaPUC.codigo)).scalar() or 0
    return {
        "estado": "activo",
        "servicio": "contabilidad",
        "version": "1.0.0",
        "empresa": EMPRESA["razon_social"],
        "nit": EMPRESA["nit"],
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "total_asientos": total_asientos,
            "cuentas_puc": total_cuentas
        }
    }


if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3012))
    print(f"🚀 Contabilidad Service v1.0 en puerto {puerto}")
    uvicorn.run(app, host="0.0.0.0", port=puerto)
