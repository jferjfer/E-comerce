from motor.motor_asyncio import AsyncIOMotorClient

class BaseDatos:
    cliente: AsyncIOMotorClient = None
    bd = None

bd = BaseDatos()

async def conectar_bd():
    """Conectar directamente a MongoDB Atlas para producción"""
    import os
    # Usar variable de entorno o fallback
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb+srv://Vercel-Admin-catalogo:oTXaV4jaA4E5Qi4C@catalogo.eocsgaj.mongodb.net/?retryWrites=true&w=majority")
    
    bd.cliente = AsyncIOMotorClient(mongodb_uri)
    bd.bd = bd.cliente["catalogo"]
    print(f"✅ Catalog Service conectado a MongoDB Atlas: {mongodb_uri[:50]}...")
    print(f"✅ Base de datos: catalogo")

async def cerrar_bd():
    """Cerrar conexión a MongoDB"""
    if bd.cliente:
        bd.cliente.close()
        print("❌ Catalog Service desconectado de MongoDB")

def obtener_bd():
    """Obtener instancia de la base de datos"""
    return bd.bd