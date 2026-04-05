"""
Base de datos — Contabilidad EGOS
Plan Único de Cuentas (PUC) colombiano + libros contables
"""
import os
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Integer, Boolean, Enum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid
import enum

DATABASE_URL = os.getenv("DATABASE_URL", "")
TRANSACTION_DB_URL = os.getenv("TRANSACTION_DB_URL", "")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"sslmode": "require", "connect_timeout": 10}
)

# Motor separado para leer BD de transacciones
transaction_engine = None
TransactionSession = None

def init_transaction_db():
    global transaction_engine, TransactionSession
    if TRANSACTION_DB_URL:
        try:
            transaction_engine = create_engine(
                TRANSACTION_DB_URL,
                pool_pre_ping=True,
                pool_recycle=300,
                connect_args={"sslmode": "require", "connect_timeout": 10}
            )
            TransactionSession = sessionmaker(autocommit=False, autoflush=False, bind=transaction_engine)
            print("✅ Contabilidad conectada a BD Transacciones")
        except Exception as e:
            print(f"⚠️ No se pudo conectar a BD Transacciones: {e}")

def get_transaction_db():
    if TransactionSession:
        db = TransactionSession()
        try:
            yield db
        finally:
            db.close()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class TipoCuenta(str, enum.Enum):
    ACTIVO = "Activo"
    PASIVO = "Pasivo"
    PATRIMONIO = "Patrimonio"
    INGRESO = "Ingreso"
    GASTO = "Gasto"
    COSTO = "Costo"


class NaturalezaCuenta(str, enum.Enum):
    DEBITO = "Debito"
    CREDITO = "Credito"


class TipoAsiento(str, enum.Enum):
    VENTA = "Venta"
    DEVOLUCION = "Devolucion"
    PAGO = "Pago"
    CREDITO_INTERNO = "CreditoInterno"
    RETENCION = "Retencion"
    AJUSTE = "Ajuste"
    APERTURA = "Apertura"


class CuentaPUC(Base):
    """Plan Único de Cuentas colombiano"""
    __tablename__ = "cuenta_puc"

    codigo = Column(String(10), primary_key=True)
    nombre = Column(String(200), nullable=False)
    tipo = Column(String(20), nullable=False)
    naturaleza = Column(String(10), nullable=False)
    nivel = Column(Integer, nullable=False)  # 1=clase, 2=grupo, 3=cuenta, 4=subcuenta
    codigo_padre = Column(String(10), nullable=True)
    activa = Column(Boolean, default=True)
    descripcion = Column(Text, nullable=True)


class AsientoContable(Base):
    """Libro Diario — cada transacción"""
    __tablename__ = "asiento_contable"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    numero = Column(Integer, nullable=False)  # consecutivo
    fecha = Column(DateTime, nullable=False, default=datetime.now)
    tipo = Column(String(30), nullable=False)
    descripcion = Column(Text, nullable=False)
    referencia = Column(String(50), nullable=True)  # pedido_id, factura_id, etc.
    usuario_id = Column(Integer, nullable=True)
    total_debito = Column(Float, nullable=False, default=0)
    total_credito = Column(Float, nullable=False, default=0)
    estado = Column(String(20), default="Activo")  # Activo, Anulado
    periodo = Column(String(7), nullable=False)  # YYYY-MM
    movimientos = relationship("MovimientoContable", back_populates="asiento", cascade="all, delete-orphan")


class MovimientoContable(Base):
    """Líneas del asiento — débitos y créditos"""
    __tablename__ = "movimiento_contable"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asiento_id = Column(String, ForeignKey("asiento_contable.id"), nullable=False)
    codigo_cuenta = Column(String(10), ForeignKey("cuenta_puc.codigo"), nullable=False)
    nombre_cuenta = Column(String(200), nullable=False)
    debito = Column(Float, default=0)
    credito = Column(Float, default=0)
    descripcion = Column(Text, nullable=True)
    asiento = relationship("AsientoContable", back_populates="movimientos")


class SaldoCuenta(Base):
    """Saldos acumulados por cuenta y período — para libro mayor"""
    __tablename__ = "saldo_cuenta"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    codigo_cuenta = Column(String(10), nullable=False)
    nombre_cuenta = Column(String(200), nullable=False)
    periodo = Column(String(7), nullable=False)  # YYYY-MM
    saldo_inicial = Column(Float, default=0)
    total_debitos = Column(Float, default=0)
    total_creditos = Column(Float, default=0)
    saldo_final = Column(Float, default=0)
    tipo_cuenta = Column(String(20), nullable=False)
    naturaleza = Column(String(10), nullable=False)


class DeclaracionIVA(Base):
    """Registro bimestral IVA — Formulario 300"""
    __tablename__ = "declaracion_iva"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    periodo = Column(String(7), nullable=False)  # YYYY-MM (primer mes del bimestre)
    bimestre = Column(Integer, nullable=False)  # 1-6
    anio = Column(Integer, nullable=False)
    iva_generado = Column(Float, default=0)      # IVA en ventas
    iva_descontable = Column(Float, default=0)   # IVA en compras
    iva_a_pagar = Column(Float, default=0)       # generado - descontable
    base_gravable = Column(Float, default=0)
    estado = Column(String(20), default="Borrador")  # Borrador, Presentada, Pagada
    fecha_vencimiento = Column(DateTime, nullable=True)
    fecha_presentacion = Column(DateTime, nullable=True)


class AnticipoPSIMPLE(Base):
    """Anticipos bimestrales Régimen SIMPLE"""
    __tablename__ = "anticipo_simple"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    periodo = Column(String(7), nullable=False)
    bimestre = Column(Integer, nullable=False)
    anio = Column(Integer, nullable=False)
    ingresos_brutos = Column(Float, default=0)
    tarifa = Column(Float, default=0.011)  # 1.1% comercio por defecto
    valor_anticipo = Column(Float, default=0)
    estado = Column(String(20), default="Pendiente")
    fecha_vencimiento = Column(DateTime, nullable=True)


class ContadorAsiento(Base):
    """Consecutivo de asientos"""
    __tablename__ = "contador_asiento"
    id = Column(Integer, primary_key=True, default=1)
    ultimo_numero = Column(Integer, default=0)


class Compra(Base):
    """Registro de compras a proveedores"""
    __tablename__ = "compra"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    numero = Column(Integer, nullable=False)
    fecha = Column(DateTime, nullable=False, default=datetime.now)
    proveedor_nombre = Column(String(200), nullable=False)
    proveedor_nit = Column(String(20), nullable=True)
    tipo_factura = Column(String(20), default="Talonario")  # Talonario, Electronica
    numero_factura = Column(String(50), nullable=True)
    tipo_compra = Column(String(20), nullable=False)  # Mercancia, Servicio, Gasto
    descripcion = Column(Text, nullable=False)
    subtotal = Column(Float, nullable=False)
    iva = Column(Float, default=0)  # 0 si no cobra IVA
    total = Column(Float, nullable=False)
    forma_pago = Column(String(20), default="Contado")  # Contado, Credito
    plazo_dias = Column(Integer, default=0)  # si es crédito
    estado = Column(String(20), default="Pagada")  # Pagada, Pendiente
    asiento_id = Column(String, nullable=True)
    periodo = Column(String(7), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.now)


class ContadorCompra(Base):
    """Consecutivo de compras"""
    __tablename__ = "contador_compra"
    id = Column(Integer, primary_key=True, default=1)
    ultimo_numero = Column(Integer, default=0)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        if not db.query(ContadorAsiento).first():
            db.add(ContadorAsiento(id=1, ultimo_numero=0))
            db.commit()
        if not db.query(ContadorCompra).first():
            db.add(ContadorCompra(id=1, ultimo_numero=0))
            db.commit()
        if db.query(CuentaPUC).count() == 0:
            _poblar_puc(db)
        else:
            _agregar_cuentas_faltantes(db)
        db.close()
        init_transaction_db()
        print("✅ Contabilidad: tablas y PUC inicializados")
    except Exception as e:
        print(f"⚠️ Error inicializando contabilidad: {e}")


def _poblar_puc(db):
    """Plan Único de Cuentas PUC colombiano — cuentas relevantes para EGOS"""
    cuentas = [
        # CLASE 1 — ACTIVO
        ("1", "ACTIVO", "Activo", "Debito", 1, None),
        ("11", "EFECTIVO Y EQUIVALENTES AL EFECTIVO", "Activo", "Debito", 2, "1"),
        ("1105", "Caja", "Activo", "Debito", 3, "11"),
        ("110505", "Caja general", "Activo", "Debito", 4, "1105"),
        ("1110", "Depósitos en instituciones financieras", "Activo", "Debito", 3, "11"),
        ("111005", "Cuenta corriente", "Activo", "Debito", 4, "1110"),
        ("111010", "Cuenta de ahorros", "Activo", "Debito", 4, "1110"),
        ("13", "DEUDORES", "Activo", "Debito", 2, "1"),
        ("1305", "Clientes", "Activo", "Debito", 3, "13"),
        ("130505", "Clientes nacionales", "Activo", "Debito", 4, "1305"),
        ("1355", "Anticipo de impuestos y contribuciones", "Activo", "Debito", 3, "13"),
        ("135515", "Retención en la fuente", "Activo", "Debito", 4, "1355"),
        ("135540", "IVA retenido", "Activo", "Debito", 4, "1355"),
        ("14", "INVENTARIOS", "Activo", "Debito", 2, "1"),
        ("1435", "Mercancías no fabricadas por la empresa", "Activo", "Debito", 3, "14"),
        ("143505", "Prendas de vestir", "Activo", "Debito", 4, "1435"),

        # CLASE 2 — PASIVO
        ("2", "PASIVO", "Pasivo", "Credito", 1, None),
        ("24", "IMPUESTOS, GRAVÁMENES Y TASAS", "Pasivo", "Credito", 2, "2"),
        ("2408", "Impuesto sobre las ventas por pagar", "Pasivo", "Credito", 3, "24"),
        ("240805", "IVA por pagar", "Pasivo", "Credito", 4, "2408"),
        ("2365", "Retención en la fuente", "Pasivo", "Credito", 3, "24"),
        ("236505", "Retención renta por pagar", "Pasivo", "Credito", 4, "2365"),
        ("236540", "Retención IVA por pagar", "Pasivo", "Credito", 4, "2365"),
        ("2370", "Retenciones y aportes de nómina", "Pasivo", "Credito", 3, "24"),
        ("25", "OBLIGACIONES LABORALES", "Pasivo", "Credito", 2, "2"),
        ("2505", "Salarios por pagar", "Pasivo", "Credito", 3, "25"),
        ("26", "PASIVOS ESTIMADOS Y PROVISIONES", "Pasivo", "Credito", 2, "2"),
        ("2615", "Para obligaciones fiscales", "Pasivo", "Credito", 3, "26"),
        ("261505", "Impuesto SIMPLE por pagar", "Pasivo", "Credito", 4, "2615"),
        ("28", "OTROS PASIVOS", "Pasivo", "Credito", 2, "2"),
        ("2805", "Anticipos y avances recibidos", "Pasivo", "Credito", 3, "28"),

        # CLASE 3 — PATRIMONIO
        ("3", "PATRIMONIO", "Patrimonio", "Credito", 1, None),
        ("31", "CAPITAL SOCIAL", "Patrimonio", "Credito", 2, "3"),
        ("3105", "Capital suscrito y pagado", "Patrimonio", "Credito", 3, "31"),
        ("310505", "Capital VERTEL & CATILLO S.A.S", "Patrimonio", "Credito", 4, "3105"),
        ("33", "RESERVAS", "Patrimonio", "Credito", 2, "3"),
        ("3305", "Reserva legal", "Patrimonio", "Credito", 3, "33"),
        ("36", "RESULTADOS DEL EJERCICIO", "Patrimonio", "Credito", 2, "3"),
        ("3605", "Utilidad del ejercicio", "Patrimonio", "Credito", 3, "36"),
        ("3610", "Pérdida del ejercicio", "Patrimonio", "Debito", 3, "36"),
        ("37", "RESULTADOS DE EJERCICIOS ANTERIORES", "Patrimonio", "Credito", 2, "3"),
        ("3705", "Utilidades acumuladas", "Patrimonio", "Credito", 3, "37"),

        # CLASE 4 — INGRESOS
        ("4", "INGRESOS", "Ingreso", "Credito", 1, None),
        ("41", "OPERACIONALES", "Ingreso", "Credito", 2, "4"),
        ("4135", "Comercio al por menor", "Ingreso", "Credito", 3, "41"),
        ("413505", "Ventas prendas de vestir", "Ingreso", "Credito", 4, "4135"),
        ("413510", "Ventas accesorios", "Ingreso", "Credito", 4, "4135"),
        ("4175", "Devoluciones en ventas (CR)", "Ingreso", "Debito", 3, "41"),
        ("417505", "Devoluciones ventas prendas", "Ingreso", "Debito", 4, "4175"),
        ("42", "NO OPERACIONALES", "Ingreso", "Credito", 2, "4"),
        ("4210", "Financieros", "Ingreso", "Credito", 3, "42"),
        ("421005", "Intereses crédito interno", "Ingreso", "Credito", 4, "4210"),

        # CLASE 5 — GASTOS
        ("5", "GASTOS", "Gasto", "Debito", 1, None),
        ("51", "OPERACIONALES DE ADMINISTRACIÓN", "Gasto", "Debito", 2, "5"),
        ("5105", "Gastos de personal", "Gasto", "Debito", 3, "51"),
        ("5135", "Servicios", "Gasto", "Debito", 3, "51"),
        ("513530", "Servicios de tecnología", "Gasto", "Debito", 4, "5135"),
        ("513535", "Servicios de hosting/cloud", "Gasto", "Debito", 4, "5135"),
        ("5145", "Impuestos", "Gasto", "Debito", 3, "51"),
        ("514505", "Impuesto SIMPLE", "Gasto", "Debito", 4, "5145"),
        ("5195", "Diversos", "Gasto", "Debito", 3, "51"),
        ("519595", "Otros gastos administrativos", "Gasto", "Debito", 4, "5195"),
        ("53", "NO OPERACIONALES", "Gasto", "Debito", 2, "5"),
        ("5305", "Financieros", "Gasto", "Debito", 3, "53"),
        ("530505", "Gastos bancarios", "Gasto", "Debito", 4, "5305"),

        # CLASE 6 — COSTOS
        ("6", "COSTOS DE VENTAS", "Costo", "Debito", 1, None),
        ("61", "COSTO DE VENTAS", "Costo", "Debito", 2, "6"),
        ("6135", "Comercio al por menor", "Costo", "Debito", 3, "61"),
        ("613505", "Costo prendas de vestir vendidas", "Costo", "Debito", 4, "6135"),
    ]

    for codigo, nombre, tipo, naturaleza, nivel, padre in cuentas:
        db.add(CuentaPUC(
            codigo=codigo, nombre=nombre, tipo=tipo,
            naturaleza=naturaleza, nivel=nivel, codigo_padre=padre
        ))
    db.commit()
    print(f"✅ PUC poblado con {len(cuentas)} cuentas")


def _agregar_cuentas_faltantes(db):
    """Agrega cuentas PUC nuevas si no existen (para actualizaciones)"""
    cuentas_nuevas = [
        # Proveedores (Pasivo)
        ("22", "PROVEEDORES", "Pasivo", "Credito", 2, "2"),
        ("2205", "Proveedores nacionales", "Pasivo", "Credito", 3, "22"),
        ("220505", "Proveedores prendas de vestir", "Pasivo", "Credito", 4, "2205"),
        ("220510", "Proveedores servicios", "Pasivo", "Credito", 4, "2205"),
        # IVA descontable (Activo)
        ("2408", "Impuesto sobre las ventas por pagar", "Pasivo", "Credito", 3, "24"),
        ("240810", "IVA descontable compras", "Activo", "Debito", 4, "2408"),
        # Gastos adicionales
        ("513540", "Publicidad y marketing", "Gasto", "Debito", 4, "5135"),
        ("513545", "Transporte y fletes", "Gasto", "Debito", 4, "5135"),
        ("513550", "Arrendamientos", "Gasto", "Debito", 4, "5135"),
        ("513555", "Servicios públicos", "Gasto", "Debito", 4, "5135"),
        ("513560", "Papelería y útiles", "Gasto", "Debito", 4, "5135"),
    ]
    agregadas = 0
    for codigo, nombre, tipo, naturaleza, nivel, padre in cuentas_nuevas:
        if not db.query(CuentaPUC).filter(CuentaPUC.codigo == codigo).first():
            db.add(CuentaPUC(
                codigo=codigo, nombre=nombre, tipo=tipo,
                naturaleza=naturaleza, nivel=nivel, codigo_padre=padre
            ))
            agregadas += 1
    if agregadas > 0:
        db.commit()
        print(f"✅ {agregadas} cuentas PUC nuevas agregadas")
