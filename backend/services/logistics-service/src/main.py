from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from typing import List, Optional
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import random
from motor.motor_asyncio import AsyncIOMotorClient

# ============================================
# MONGODB
# ============================================
mongo_client = None
db_catalogo = None

async def conectar_mongo():
    global mongo_client, db_catalogo
    uri = os.getenv('MONGODB_CATALOG_URI', '')
    if not uri:
        print('⚠️ MONGODB_CATALOG_URI no configurado, usando inventario en memoria')
        return
    try:
        mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        await mongo_client.admin.command('ping')
        db_catalogo = mongo_client['catalogo']
        print('✅ Logistics conectado a MongoDB')
    except Exception as e:
        print(f'⚠️ No se pudo conectar a MongoDB: {e}')
        db_catalogo = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    await conectar_mongo()
    yield
    if mongo_client:
        mongo_client.close()

app = FastAPI(title="Logistics Service v2.1", version="2.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://egoscolombia.com.co", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacenes fijos (estructura, no cambia)
ALMACENES = {
    "ALM-BOG": {"id": "ALM-BOG", "nombre": "Almacén Bogotá Centro", "ciudad": "Bogotá", "capacidad": 10000},
    "ALM-MED": {"id": "ALM-MED", "nombre": "Almacén Medellín Norte", "ciudad": "Medellín", "capacidad": 8000},
    "ALM-CAL": {"id": "ALM-CAL", "nombre": "Almacén Cali Sur", "ciudad": "Cali", "capacidad": 6000}
}

# Inventario en memoria como fallback
almacenes = ALMACENES
inventario = {
    "ALM-BOG": {"1": 50, "2": 30, "3": 25, "4": 40, "5": 35},
    "ALM-MED": {"1": 30, "2": 45, "3": 20, "4": 25, "5": 30},
    "ALM-CAL": {"1": 25, "2": 35, "3": 30, "4": 20, "5": 25}
}

# Helpers MongoDB
async def get_inventario_mongo(almacen_id: str) -> dict:
    if db_catalogo is None:
        return inventario.get(almacen_id, {})
    doc = await db_catalogo.inventario.find_one({"almacen_id": almacen_id})
    return doc.get('stock', {}) if doc else inventario.get(almacen_id, {})

async def set_inventario_mongo(almacen_id: str, producto_id: str, cantidad: int):
    if db_catalogo is None:
        if almacen_id not in inventario:
            inventario[almacen_id] = {}
        inventario[almacen_id][producto_id] = cantidad
        return
    await db_catalogo.inventario.update_one(
        {"almacen_id": almacen_id},
        {"$set": {f"stock.{producto_id}": cantidad, "fecha_actualizacion": datetime.now().isoformat()}},
        upsert=True
    )
    # Sincronizar en_stock del producto en catálogo
    total = sum(
        (await get_inventario_mongo(a)).get(producto_id, 0)
        for a in ALMACENES
    )
    await db_catalogo.productos.update_one(
        {"id": producto_id},
        {"$set": {"en_stock": total > 0}}
    )

envios = {}
domicilios = {}

class SolicitudEnvio(BaseModel):
    pedido_id: str
    usuario_id: int
    productos: List[dict]
    direccion: str
    ciudad: str
    telefono: str
    tipo_envio: str = "estandar"

class ActualizarInventario(BaseModel):
    almacen_id: str
    producto_id: str
    cantidad: int

class RegistrarDomicilio(BaseModel):
    usuario_id: int
    nombre: str
    direccion: str
    ciudad: str
    telefono: str

@app.get("/salud")
async def verificar_salud():
    total_productos = 0
    for aid in ALMACENES:
        stock = await get_inventario_mongo(aid)
        total_productos += sum(stock.values())
    return {
        "estado": "activo",
        "servicio": "logistica",
        "version": "2.1.0",
        "mongodb_conectado": db_catalogo is not None,
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "almacenes_activos": len(ALMACENES),
            "productos_en_stock": total_productos
        }
    }

@app.get("/api/almacenes")
async def listar_almacenes():
    return {"almacenes": list(ALMACENES.values()), "total": len(ALMACENES)}

@app.get("/api/inventario/{producto_id}")
async def consultar_inventario_producto(producto_id: str):
    disponibilidad = []
    total_disponible = 0
    for almacen_id, almacen in ALMACENES.items():
        stock = await get_inventario_mongo(almacen_id)
        cantidad = stock.get(producto_id, 0)
        total_disponible += cantidad
        if cantidad > 0:
            disponibilidad.append({
                "almacen_id": almacen_id,
                "almacen_nombre": almacen["nombre"],
                "ciudad": almacen["ciudad"],
                "cantidad": cantidad
            })
    return {"producto_id": producto_id, "total_disponible": total_disponible, "disponible": total_disponible > 0, "almacenes": disponibilidad}

@app.get("/api/inventario/almacen/{almacen_id}")
async def consultar_inventario_almacen(almacen_id: str):
    if almacen_id not in ALMACENES:
        raise HTTPException(status_code=404, detail="Almacén no encontrado")
    stock = await get_inventario_mongo(almacen_id)
    productos = [{"producto_id": pid, "cantidad": cant} for pid, cant in stock.items()]
    return {"almacen": ALMACENES[almacen_id], "productos": productos, "total_productos": len(productos)}

@app.put("/api/inventario/actualizar")
async def actualizar_inventario(actualizacion: ActualizarInventario):
    if actualizacion.almacen_id not in ALMACENES:
        raise HTTPException(status_code=404, detail="Almacén no encontrado")
    await set_inventario_mongo(actualizacion.almacen_id, actualizacion.producto_id, actualizacion.cantidad)
    print(f"📦 Inventario actualizado: {actualizacion.almacen_id} - Producto {actualizacion.producto_id}: {actualizacion.cantidad}")
    return {"mensaje": "Inventario actualizado", "almacen_id": actualizacion.almacen_id, "producto_id": actualizacion.producto_id, "nueva_cantidad": actualizacion.cantidad}

@app.post("/api/envios/crear")
async def crear_envio(solicitud: SolicitudEnvio):
    print(f"🚚 Creando envío para pedido {solicitud.pedido_id}")
    almacen_seleccionado = next(
        (aid for aid, a in ALMACENES.items() if a["ciudad"].lower() == solicitud.ciudad.lower()),
        "ALM-BOG"
    )
    for producto in solicitud.productos:
        producto_id = str(producto["id"])
        cantidad = producto["cantidad"]
        stock = await get_inventario_mongo(almacen_seleccionado)
        if stock.get(producto_id, 0) >= cantidad:
            await set_inventario_mongo(almacen_seleccionado, producto_id, stock[producto_id] - cantidad)
        else:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para producto {producto_id}")
    
    # Calcular fecha de entrega
    dias_entrega = 1 if solicitud.tipo_envio == "express" else 3
    fecha_entrega = datetime.now() + timedelta(days=dias_entrega)
    
    # Calcular costo
    costo_envio = 25000 if solicitud.tipo_envio == "express" else 15000
    
    # Crear envío
    envio_id = f"ENV-{int(datetime.now().timestamp())}"
    numero_guia = f"EST{random.randint(100000, 999999)}"
    
    envios[envio_id] = {
        "id": envio_id,
        "pedido_id": solicitud.pedido_id,
        "numero_guia": numero_guia,
        "almacen_origen": almacen_seleccionado,
        "direccion_destino": solicitud.direccion,
        "ciudad": solicitud.ciudad,
        "telefono": solicitud.telefono,
        "estado": "Preparando",
        "tipo_envio": solicitud.tipo_envio,
        "costo": costo_envio,
        "fecha_creacion": datetime.now().isoformat(),
        "fecha_estimada": fecha_entrega.isoformat(),
        "tracking": [
            {"fecha": datetime.now().isoformat(), "estado": "Preparando", "ubicacion": almacenes[almacen_seleccionado]["nombre"]}
        ]
    }
    
    return {
        "envio_id": envio_id,
        "numero_guia": numero_guia,
        "fecha_estimada": fecha_entrega.strftime("%Y-%m-%d"),
        "costo_envio": costo_envio,
        "almacen_origen": almacenes[almacen_seleccionado]["nombre"]
    }

@app.get("/api/envios/tracking/{numero_guia}")
async def rastrear_envio(numero_guia: str):
    envio = next((e for e in envios.values() if e["numero_guia"] == numero_guia), None)
    
    if not envio:
        raise HTTPException(status_code=404, detail="Envío no encontrado")
    
    return {
        "numero_guia": numero_guia,
        "estado": envio["estado"],
        "fecha_estimada": envio["fecha_estimada"],
        "tracking": envio["tracking"]
    }

@app.put("/api/envios/{envio_id}/actualizar-estado")
async def actualizar_estado_envio(envio_id: str, nuevo_estado: str):
    if envio_id not in envios:
        raise HTTPException(status_code=404, detail="Envío no encontrado")
    
    envio = envios[envio_id]
    envio["estado"] = nuevo_estado
    
    envio["tracking"].append({
        "fecha": datetime.now().isoformat(),
        "estado": nuevo_estado,
        "ubicacion": "Centro de distribución"
    })
    
    print(f"📦 Estado actualizado: {envio_id} -> {nuevo_estado}")
    
    return {"mensaje": "Estado actualizado", "nuevo_estado": nuevo_estado}

@app.post("/api/domicilios")
async def registrar_domicilio(domicilio: RegistrarDomicilio):
    domicilio_id = f"DOM-{domicilio.usuario_id}-{int(datetime.now().timestamp())}"
    
    domicilios[domicilio_id] = {
        "id": domicilio_id,
        "usuario_id": domicilio.usuario_id,
        "nombre": domicilio.nombre,
        "direccion": domicilio.direccion,
        "ciudad": domicilio.ciudad,
        "telefono": domicilio.telefono,
        "fecha_creacion": datetime.now().isoformat()
    }
    
    return {"domicilio_id": domicilio_id, "mensaje": "Domicilio registrado"}

@app.get("/api/domicilios/{usuario_id}")
async def obtener_domicilios(usuario_id: int):
    domicilios_usuario = [d for d in domicilios.values() if d["usuario_id"] == usuario_id]
    return {"domicilios": domicilios_usuario, "total": len(domicilios_usuario)}

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3009))
    print(f"🚀 Logistics Service v2.0 iniciando en puerto {puerto}")
    uvicorn.run(app, host="0.0.0.0", port=puerto)
