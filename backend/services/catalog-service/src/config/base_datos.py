from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

class BaseDatos:
    cliente: AsyncIOMotorClient = None
    bd = None

bd = BaseDatos()

async def conectar_bd():
    """Conectar a MongoDB Atlas o local"""
    # Usar MongoDB Atlas si está disponible
    mongodb_uri = os.getenv("MONGODB_URI")
    
    if mongodb_uri:
        bd.cliente = AsyncIOMotorClient(mongodb_uri)
        bd.bd = bd.cliente["ecomerce"]  # Base de datos en Atlas
        print("✅ Conectado a MongoDB Atlas")
    else:
        # Fallback a MongoDB local
        host = os.getenv("MONGO_HOST", "localhost")
        puerto = int(os.getenv("MONGO_PUERTO", 27017))
        nombre_bd = os.getenv("MONGO_BD", "bd_catalogo")
        
        bd.cliente = AsyncIOMotorClient(f"mongodb://{host}:{puerto}")
        bd.bd = bd.cliente[nombre_bd]
        print(f"✅ Conectado a MongoDB local: {nombre_bd}")

async def cerrar_bd():
    """Cerrar conexión a MongoDB"""
    if bd.cliente:
        bd.cliente.close()
        print("❌ Conexión a MongoDB cerrada")

def obtener_bd():
    """Obtener instancia de la base de datos"""
    return bd.bd