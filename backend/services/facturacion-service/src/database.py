import os
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"sslmode": "require", "connect_timeout": 10}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Factura(Base):
    __tablename__ = "factura_electronica"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    numero = Column(Integer, nullable=False)  # número secuencial
    prefijo = Column(String, default="SETG")
    numero_completo = Column(String, unique=True)  # SETG980000001
    pedido_id = Column(String, nullable=False)
    usuario_id = Column(Integer, nullable=False)

    # Datos cliente
    cliente_nombre = Column(String, nullable=False)
    cliente_email = Column(String, nullable=False)
    cliente_nit_cc = Column(String)
    cliente_direccion = Column(String)

    # Valores
    subtotal = Column(Float, nullable=False)
    iva = Column(Float, nullable=False)
    total = Column(Float, nullable=False)

    # DIAN
    cufe = Column(String, unique=True, nullable=True)
    qr_code = Column(Text, nullable=True)
    xml_enviado = Column(Text, nullable=True)
    xml_respuesta = Column(Text, nullable=True)
    estado = Column(String, default="Pendiente")  # Pendiente, Enviada, Aceptada, Rechazada
    mensaje_dian = Column(Text, nullable=True)

    # Control
    pdf_url = Column(String, nullable=True)
    enviada_cliente = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=datetime.now)
    fecha_envio_dian = Column(DateTime, nullable=True)

class ContadorFactura(Base):
    __tablename__ = "contador_factura"

    id = Column(Integer, primary_key=True, default=1)
    ultimo_numero = Column(Integer, default=979999999)  # empieza en 980000000

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        # Inicializar contador si no existe
        db = SessionLocal()
        contador = db.query(ContadorFactura).first()
        if not contador:
            db.add(ContadorFactura(id=1, ultimo_numero=979999999))
            db.commit()
        db.close()
        print("✅ Tablas de facturación creadas/verificadas")
    except Exception as e:
        print(f"⚠️ Error creando tablas: {e}")
