import motor.motor_asyncio
import os
from typing import Optional

# Cliente MongoDB global
client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
database = None

async def conectar_bd():
    """Conectar a MongoDB"""
    global client, database
    
    # URL de MongoDB Atlas para AI Service
    mongodb_url = os.getenv("MONGODB_URL", "mongodb+srv://Vercel-Admin-serviceia:ZHCXKOwgzj4Gq2IV@serviceia.pi2owta.mongodb.net/?retryWrites=true&w=majority")
    database_name = os.getenv("DATABASE_NAME", "ai_db")
    
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
        database = client[database_name]
        
        # Verificar conexión
        await client.admin.command('ping')
        print(f"✅ AI Service conectado a MongoDB: {database_name}")
        
    except Exception as e:
        print(f"❌ Error conectando AI Service a MongoDB: {e}")
        # Usar datos en memoria como fallback
        database = None

async def desconectar_bd():
    """Desconectar de MongoDB"""
    global client
    if client:
        client.close()
        print("✅ AI Service desconectado de MongoDB")

def get_database():
    """Obtener instancia de la base de datos"""
    return database