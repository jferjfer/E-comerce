from motor.motor_asyncio import AsyncIOMotorClient

class BaseDatos:
    cliente: AsyncIOMotorClient = None
    bd = None

bd = BaseDatos()

async def conectar_bd():
    """Conectar directamente a MongoDB Atlas para producción"""
    # Conexión directa a MongoDB Atlas
    mongodb_uri = "mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority"
    
    bd.cliente = AsyncIOMotorClient(mongodb_uri)
    bd.bd = bd.cliente["ecomerce"]
    print("✅ Catalog Service conectado a MongoDB Atlas (Producción)")

async def cerrar_bd():
    """Cerrar conexión a MongoDB"""
    if bd.cliente:
        bd.cliente.close()
        print("❌ Catalog Service desconectado de MongoDB")

def obtener_bd():
    """Obtener instancia de la base de datos"""
    return bd.bd