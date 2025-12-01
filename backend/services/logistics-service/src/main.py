from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum

app = FastAPI(title="Logistics Service", version="2.0.0")

# Modelos
class EstadoEnvio(str, Enum):
    PENDIENTE = "pendiente"
    PREPARANDO = "preparando"
    EN_TRANSITO = "en_transito"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"

class SolicitudEnvio(BaseModel):
    pedido_id: int
    direccion_entrega: str
    ciudad: str
    telefono: str
    tipo_envio: str = "estandar"

class RespuestaEnvio(BaseModel):
    envio_id: str
    numero_seguimiento: str
    fecha_estimada: str
    costo_envio: float

class Inventario(BaseModel):
    producto_id: int
    cantidad_disponible: int
    ubicacion_almacen: str

# Datos simulados
inventario_db = {
    1: {"cantidad": 50, "almacen": "Bogotá Centro"},
    2: {"cantidad": 30, "almacen": "Medellín Norte"},
    3: {"cantidad": 25, "almacen": "Cali Sur"}
}

envios_db = {}

@app.get("/salud")
async def verificar_salud():
    return {"estado": "activo", "servicio": "Logistics Service", "version": "2.0.0"}

@app.post("/api/logistica/crear-envio", response_model=RespuestaEnvio)
async def crear_envio(solicitud: SolicitudEnvio):
    import uuid
    envio_id = str(uuid.uuid4())[:8]
    numero_seguimiento = f"EST{envio_id.upper()}"
    
    # Calcular fecha estimada
    dias_entrega = 3 if solicitud.tipo_envio == "estandar" else 1
    fecha_estimada = (datetime.now() + timedelta(days=dias_entrega)).strftime("%Y-%m-%d")
    
    # Calcular costo
    costo_envio = 15000 if solicitud.tipo_envio == "estandar" else 25000
    
    envios_db[envio_id] = {
        "pedido_id": solicitud.pedido_id,
        "estado": EstadoEnvio.PENDIENTE,
        "direccion": solicitud.direccion_entrega,
        "fecha_creacion": datetime.now().isoformat()
    }
    
    return RespuestaEnvio(
        envio_id=envio_id,
        numero_seguimiento=numero_seguimiento,
        fecha_estimada=fecha_estimada,
        costo_envio=costo_envio
    )

@app.get("/api/logistica/seguimiento/{numero_seguimiento}")
async def rastrear_envio(numero_seguimiento: str):
    return {
        "numero_seguimiento": numero_seguimiento,
        "estado": "en_transito",
        "ubicacion_actual": "Centro de distribución Bogotá",
        "fecha_estimada_entrega": "2024-12-01",
        "historial": [
            {"fecha": "2024-11-28", "evento": "Paquete recibido en origen"},
            {"fecha": "2024-11-29", "evento": "En tránsito"}
        ]
    }

@app.get("/api/logistica/inventario/{producto_id}")
async def consultar_inventario(producto_id: int):
    if producto_id in inventario_db:
        return {
            "producto_id": producto_id,
            "cantidad_disponible": inventario_db[producto_id]["cantidad"],
            "almacen": inventario_db[producto_id]["almacen"],
            "disponible": inventario_db[producto_id]["cantidad"] > 0
        }
    else:
        return {
            "producto_id": producto_id,
            "cantidad_disponible": 0,
            "almacen": "No disponible",
            "disponible": False
        }

@app.put("/api/logistica/inventario/{producto_id}")
async def actualizar_inventario(producto_id: int, nueva_cantidad: int):
    if producto_id in inventario_db:
        inventario_db[producto_id]["cantidad"] = nueva_cantidad
        return {"mensaje": "Inventario actualizado", "nueva_cantidad": nueva_cantidad}
    else:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3009)