import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

# Configuración MongoDB Atlas
MONGODB_URI = "mongodb+srv://Vercel-Admin-serviceia:ZHCXKOwgzj4Gq2IV@serviceia.pi2owta.mongodb.net/?retryWrites=true&w=majority"

class DatabaseManager:
    client: AsyncIOMotorClient = None
    database = None

db_manager = DatabaseManager()

async def conectar_bd():
    """Conectar a MongoDB Atlas"""
    try:
        db_manager.client = AsyncIOMotorClient(MONGODB_URI)
        db_manager.database = db_manager.client.ai_db
        
        # Verificar conexión
        await db_manager.client.admin.command('ping')
        print("✅ AI Service conectado a MongoDB Atlas")
        
    except ConnectionFailure as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        raise

async def desconectar_bd():
    """Cerrar conexión"""
    if db_manager.client:
        db_manager.client.close()
        print("🔌 Conexión MongoDB cerrada")

def get_database():
    """Obtener instancia de base de datos"""
    return db_manager.database