from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

class BaseDatos:
    cliente: AsyncIOMotorClient = None
    bd = None

bd = BaseDatos()

async def conectar_bd():
    """Conectar a MongoDB Atlas para AI Service"""
    mongodb_uri = os.getenv("MONGODB_AI_URI", os.getenv("MONGODB_CATALOG_URI", ""))
    nombre_bd = "ai_db"

    if not mongodb_uri:
        print("⚠️ No hay URI de MongoDB configurada para AI Service")
        return

    try:
        bd.cliente = AsyncIOMotorClient(mongodb_uri, serverSelectionTimeoutMS=10000)
        await bd.cliente.admin.command('ping')
        bd.bd = bd.cliente[nombre_bd]
        print(f"✅ AI Service conectado a MongoDB Atlas: {nombre_bd}")
    except Exception as e:
        print(f"⚠️ AI Service no pudo conectar a MongoDB: {e}")
        bd.cliente = None
        bd.bd = None

async def cerrar_bd():
    """Cerrar conexión a MongoDB"""
    if bd.cliente:
        bd.cliente.close()
        print("❌ Conexión a MongoDB cerrada")

def obtener_bd():
    """Obtener instancia de la base de datos"""
    return bd.bd