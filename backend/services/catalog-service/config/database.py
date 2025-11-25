import motor.motor_asyncio
import os
from typing import Optional

# Cliente MongoDB global
client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
database = None

async def conectar_bd():
    """Conectar a MongoDB"""
    global client, database
    
    # URL de MongoDB Atlas para Catalog Service
    mongodb_url = os.getenv("MONGODB_URL", "mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority")
    database_name = os.getenv("DATABASE_NAME", "ecomerce")
    
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
        database = client[database_name]
        
        # Verificar conexión
        await client.admin.command('ping')
        print(f"✅ Conectado a MongoDB: {database_name}")
        
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        # Usar datos en memoria como fallback
        database = None

async def desconectar_bd():
    """Desconectar de MongoDB"""
    global client
    if client:
        client.close()
        print("✅ Desconectado de MongoDB")

def get_database():
    """Obtener instancia de la base de datos"""
    return database