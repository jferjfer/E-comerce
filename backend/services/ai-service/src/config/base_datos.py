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
    # URL específica para AI Service
    mongodb_uri = "mongodb+srv://Vercel-Admin-serviceia:ZHCXKOwgzj4Gq2IV@serviceia.pi2owta.mongodb.net/?retryWrites=true&w=majority"
    nombre_bd = "ai_db"
    
    bd.cliente = AsyncIOMotorClient(mongodb_uri)
    bd.bd = bd.cliente[nombre_bd]
    
    print(f"✅ AI Service conectado a MongoDB Atlas: {nombre_bd}")

async def cerrar_bd():
    """Cerrar conexión a MongoDB"""
    if bd.cliente:
        bd.cliente.close()
        print("❌ Conexión a MongoDB cerrada")

def obtener_bd():
    """Obtener instancia de la base de datos"""
    return bd.bd