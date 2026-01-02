import os
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_IykA6tTPxhE3@ep-tiny-butterfly-adf8yext-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class CreditoInterno(Base):
    __tablename__ = "credito_interno"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(Integer, unique=True, nullable=False)
    limite_credito = Column(Float, nullable=False)
    saldo_usado = Column(Float, default=0.0)
    plazo_meses = Column(Integer)
    tasa_mensual = Column(Float)
    cuota_mensual = Column(Float)
    interes_total = Column(Float)
    total_pagar = Column(Float)
    estado = Column(String, default="Activo")
    fecha_aprobacion = Column(DateTime, default=datetime.now)
    fecha_vencimiento = Column(DateTime)
    tabla_amortizacion = Column(Text)

class TransaccionCredito(Base):
    __tablename__ = "transaccion_credito"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    credito_id = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    monto = Column(Float, nullable=False)
    pedido_id = Column(String)
    descripcion = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.now)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas de crédito creadas/verificadas")
    except Exception as e:
        print(f"⚠️ Error creando tablas: {e}")
