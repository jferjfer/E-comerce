from motor.motor_asyncio import AsyncIOMotorClient
import os

class BaseDatos:
    cliente: AsyncIOMotorClient = None
    bd = None
    conectado = False

bd = BaseDatos()

async def conectar_bd():
    """Conectar a MongoDB Atlas con manejo de errores"""
    try:
        # Usar variable de entorno
        mongodb_uri = os.getenv("MONGODB_URI", os.getenv("MONGODB_CATALOG_URI", ""))
        
        if not mongodb_uri:
            print("⚠️ No hay URI de MongoDB configurada, usando modo sin BD")
            bd.conectado = False
            return
        
        print(f"🔄 Intentando conectar a MongoDB...")
        bd.cliente = AsyncIOMotorClient(
            mongodb_uri, 
            serverSelectionTimeoutMS=30000,  # 30 segundos
            connectTimeoutMS=30000,
            socketTimeoutMS=30000
        )
        
        # Verificar conexión
        await bd.cliente.admin.command('ping')
        
        bd.bd = bd.cliente["catalogo"]
        bd.conectado = True
        print(f"✅ Catalog Service conectado a MongoDB Atlas")
        print(f"✅ Base de datos: catalogo")
        
    except Exception as e:
        print(f"⚠️ No se pudo conectar a MongoDB: {e}")
        print(f"⚠️ Catalog Service funcionará sin base de datos (productos hardcodeados)")
        bd.conectado = False
        bd.cliente = None
        bd.bd = None

async def cerrar_bd():
    """Cerrar conexión a MongoDB"""
    if bd.cliente:
        bd.cliente.close()
        print("❌ Catalog Service desconectado de MongoDB")

def obtener_bd():
    """Obtener instancia de la base de datos"""
    if bd.conectado:
        return bd.bd
    return None