"""
Motor de Asientos Contables Automáticos
Genera asientos según eventos del sistema EGOS
"""
from datetime import datetime
from sqlalchemy.orm import Session
from database import (
    AsientoContable, MovimientoContable, SaldoCuenta,
    ContadorAsiento, TipoAsiento
)

IVA_RATE = 0.19
TARIFA_SIMPLE = 0.011  # 1.1% comercio al por menor


def _siguiente_numero(db: Session) -> int:
    contador = db.query(ContadorAsiento).filter(ContadorAsiento.id == 1).with_for_update().first()
    if not contador:
        from database import ContadorAsiento as CA
        contador = CA(id=1, ultimo_numero=0)
        db.add(contador)
    contador.ultimo_numero += 1
    db.commit()
    return contador.ultimo_numero


def _actualizar_saldo(db: Session, codigo: str, nombre: str, tipo: str,
                      naturaleza: str, periodo: str, debito: float, credito: float):
    saldo = db.query(SaldoCuenta).filter(
        SaldoCuenta.codigo_cuenta == codigo,
        SaldoCuenta.periodo == periodo
    ).first()

    if not saldo:
        saldo = SaldoCuenta(
            codigo_cuenta=codigo, nombre_cuenta=nombre,
            periodo=periodo, tipo_cuenta=tipo, naturaleza=naturaleza,
            saldo_inicial=0, total_debitos=0, total_creditos=0, saldo_final=0
        )
        db.add(saldo)

    saldo.total_debitos += debito
    saldo.total_creditos += credito

    if naturaleza == "Debito":
        saldo.saldo_final = saldo.saldo_inicial + saldo.total_debitos - saldo.total_creditos
    else:
        saldo.saldo_final = saldo.saldo_inicial + saldo.total_creditos - saldo.total_debitos


def registrar_venta(db: Session, pedido_id: str, total: float,
                    usuario_id: int = None, fecha: datetime = None) -> AsientoContable:
    """
    Asiento por venta:
    DB 130505 Clientes nacionales       (total con IVA)
       CR 413505 Ventas prendas          (base)
       CR 240805 IVA por pagar           (IVA 19%)
    """
    if fecha is None:
        fecha = datetime.now()

    base = round(total / (1 + IVA_RATE), 2)
    iva = round(total - base, 2)
    periodo = fecha.strftime("%Y-%m")
    numero = _siguiente_numero(db)

    asiento = AsientoContable(
        numero=numero, fecha=fecha, tipo=TipoAsiento.VENTA,
        descripcion=f"Venta pedido #{pedido_id}",
        referencia=pedido_id, usuario_id=usuario_id,
        total_debito=total, total_credito=total, periodo=periodo
    )
    db.add(asiento)
    db.flush()

    movimientos = [
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="130505",
            nombre_cuenta="Clientes nacionales",
            debito=total, credito=0,
            descripcion=f"Cuenta por cobrar pedido #{pedido_id}"
        ),
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="413505",
            nombre_cuenta="Ventas prendas de vestir",
            debito=0, credito=base,
            descripcion=f"Ingreso venta pedido #{pedido_id}"
        ),
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="240805",
            nombre_cuenta="IVA por pagar",
            debito=0, credito=iva,
            descripcion=f"IVA generado pedido #{pedido_id}"
        ),
    ]

    for m in movimientos:
        db.add(m)

    _actualizar_saldo(db, "130505", "Clientes nacionales", "Activo", "Debito", periodo, total, 0)
    _actualizar_saldo(db, "413505", "Ventas prendas de vestir", "Ingreso", "Credito", periodo, 0, base)
    _actualizar_saldo(db, "240805", "IVA por pagar", "Pasivo", "Credito", periodo, 0, iva)

    db.commit()
    print(f"✅ Asiento #{numero} — Venta ${total:,.0f} (base ${base:,.0f} + IVA ${iva:,.0f})")
    return asiento


def registrar_pago(db: Session, pedido_id: str, total: float,
                   metodo: str = "pago_en_linea", fecha: datetime = None) -> AsientoContable:
    """
    Asiento por pago recibido:
    DB 111010 Cuenta de ahorros / 110505 Caja    (total)
       CR 130505 Clientes nacionales              (total)
    """
    if fecha is None:
        fecha = datetime.now()

    periodo = fecha.strftime("%Y-%m")
    numero = _siguiente_numero(db)

    cuenta_debito = "111010" if metodo in ["pago_en_linea", "tarjeta"] else "110505"
    nombre_debito = "Cuenta de ahorros" if metodo in ["pago_en_linea", "tarjeta"] else "Caja general"

    asiento = AsientoContable(
        numero=numero, fecha=fecha, tipo=TipoAsiento.PAGO,
        descripcion=f"Pago recibido pedido #{pedido_id} — {metodo}",
        referencia=pedido_id, total_debito=total, total_credito=total, periodo=periodo
    )
    db.add(asiento)
    db.flush()

    movimientos = [
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta=cuenta_debito,
            nombre_cuenta=nombre_debito, debito=total, credito=0
        ),
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="130505",
            nombre_cuenta="Clientes nacionales", debito=0, credito=total
        ),
    ]
    for m in movimientos:
        db.add(m)

    _actualizar_saldo(db, cuenta_debito, nombre_debito, "Activo", "Debito", periodo, total, 0)
    _actualizar_saldo(db, "130505", "Clientes nacionales", "Activo", "Debito", periodo, 0, total)

    db.commit()
    print(f"✅ Asiento #{numero} — Pago ${total:,.0f}")
    return asiento


def registrar_devolucion(db: Session, pedido_id: str, total: float,
                         fecha: datetime = None) -> AsientoContable:
    """
    Asiento por devolución:
    DB 417505 Devoluciones ventas        (base)
    DB 240805 IVA por pagar              (IVA — se reversa)
       CR 130505 Clientes nacionales     (total)
    """
    if fecha is None:
        fecha = datetime.now()

    base = round(total / (1 + IVA_RATE), 2)
    iva = round(total - base, 2)
    periodo = fecha.strftime("%Y-%m")
    numero = _siguiente_numero(db)

    asiento = AsientoContable(
        numero=numero, fecha=fecha, tipo=TipoAsiento.DEVOLUCION,
        descripcion=f"Devolución pedido #{pedido_id}",
        referencia=pedido_id, total_debito=total, total_credito=total, periodo=periodo
    )
    db.add(asiento)
    db.flush()

    movimientos = [
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="417505",
            nombre_cuenta="Devoluciones ventas prendas",
            debito=base, credito=0
        ),
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="240805",
            nombre_cuenta="IVA por pagar",
            debito=iva, credito=0,
            descripcion="Reversa IVA por devolución"
        ),
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="130505",
            nombre_cuenta="Clientes nacionales",
            debito=0, credito=total
        ),
    ]
    for m in movimientos:
        db.add(m)

    _actualizar_saldo(db, "417505", "Devoluciones ventas prendas", "Ingreso", "Debito", periodo, base, 0)
    _actualizar_saldo(db, "240805", "IVA por pagar", "Pasivo", "Credito", periodo, iva, 0)
    _actualizar_saldo(db, "130505", "Clientes nacionales", "Activo", "Debito", periodo, 0, total)

    db.commit()
    print(f"✅ Asiento #{numero} — Devolución ${total:,.0f}")
    return asiento


def registrar_credito_interno(db: Session, credito_id: str, monto: float,
                               intereses: float = 0, fecha: datetime = None) -> AsientoContable:
    """
    Asiento por crédito interno otorgado:
    DB 130505 Clientes nacionales    (monto + intereses)
       CR 413505 Ventas              (monto)
       CR 421005 Intereses           (intereses)
       CR 240805 IVA por pagar       (IVA sobre monto)
    """
    if fecha is None:
        fecha = datetime.now()

    base = round(monto / (1 + IVA_RATE), 2)
    iva = round(monto - base, 2)
    total = monto + intereses
    periodo = fecha.strftime("%Y-%m")
    numero = _siguiente_numero(db)

    asiento = AsientoContable(
        numero=numero, fecha=fecha, tipo=TipoAsiento.CREDITO_INTERNO,
        descripcion=f"Crédito interno #{credito_id}",
        referencia=credito_id, total_debito=total, total_credito=total, periodo=periodo
    )
    db.add(asiento)
    db.flush()

    movimientos = [
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="130505",
            nombre_cuenta="Clientes nacionales", debito=total, credito=0
        ),
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="413505",
            nombre_cuenta="Ventas prendas de vestir", debito=0, credito=base
        ),
        MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="240805",
            nombre_cuenta="IVA por pagar", debito=0, credito=iva
        ),
    ]
    if intereses > 0:
        movimientos.append(MovimientoContable(
            asiento_id=asiento.id, codigo_cuenta="421005",
            nombre_cuenta="Intereses crédito interno", debito=0, credito=intereses
        ))

    for m in movimientos:
        db.add(m)

    db.commit()
    print(f"✅ Asiento #{numero} — Crédito interno ${monto:,.0f}")
    return asiento


def calcular_iva_bimestre(db: Session, anio: int, bimestre: int) -> dict:
    """Calcula IVA a pagar para un bimestre"""
    meses = {
        1: ["01", "02"], 2: ["03", "04"], 3: ["05", "06"],
        4: ["07", "08"], 5: ["09", "10"], 6: ["11", "12"]
    }
    periodos = [f"{anio}-{m}" for m in meses.get(bimestre, [])]

    iva_generado = 0
    iva_descontable = 0
    base_gravable = 0

    for periodo in periodos:
        saldo_iva = db.query(SaldoCuenta).filter(
            SaldoCuenta.codigo_cuenta == "240805",
            SaldoCuenta.periodo == periodo
        ).first()
        if saldo_iva:
            iva_generado += saldo_iva.total_creditos
            iva_descontable += saldo_iva.total_debitos

        saldo_ventas = db.query(SaldoCuenta).filter(
            SaldoCuenta.codigo_cuenta == "413505",
            SaldoCuenta.periodo == periodo
        ).first()
        if saldo_ventas:
            base_gravable += saldo_ventas.total_creditos

    iva_a_pagar = max(0, iva_generado - iva_descontable)

    return {
        "bimestre": bimestre,
        "anio": anio,
        "periodos": periodos,
        "base_gravable": round(base_gravable, 2),
        "iva_generado": round(iva_generado, 2),
        "iva_descontable": round(iva_descontable, 2),
        "iva_a_pagar": round(iva_a_pagar, 2)
    }


def calcular_anticipo_simple(db: Session, anio: int, bimestre: int) -> dict:
    """Calcula anticipo SIMPLE para un bimestre"""
    meses = {
        1: ["01", "02"], 2: ["03", "04"], 3: ["05", "06"],
        4: ["07", "08"], 5: ["09", "10"], 6: ["11", "12"]
    }
    periodos = [f"{anio}-{m}" for m in meses.get(bimestre, [])]

    ingresos_brutos = 0
    for periodo in periodos:
        saldo = db.query(SaldoCuenta).filter(
            SaldoCuenta.codigo_cuenta == "413505",
            SaldoCuenta.periodo == periodo
        ).first()
        if saldo:
            ingresos_brutos += saldo.total_creditos

    valor_anticipo = round(ingresos_brutos * TARIFA_SIMPLE, 2)

    return {
        "bimestre": bimestre,
        "anio": anio,
        "ingresos_brutos": round(ingresos_brutos, 2),
        "tarifa": TARIFA_SIMPLE,
        "tarifa_porcentaje": f"{TARIFA_SIMPLE * 100:.1f}%",
        "valor_anticipo": valor_anticipo
    }
