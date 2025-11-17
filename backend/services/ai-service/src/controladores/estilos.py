from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from servicios.servicio_estilos import ServicioEstilos

router = APIRouter()

def obtener_servicio_estilos():
    return ServicioEstilos()

@router.post("/analizar")
async def analizar_estilo_usuario(request: Dict[str, Any]):
    """Analizar y determinar el estilo dominante del usuario"""
    try:
        servicio = obtener_servicio_estilos()
        
        id_usuario = request.get("id_usuario")
        historial_compras = request.get("historial_compras", [])
        
        if not id_usuario:
            raise HTTPException(status_code=400, detail="ID de usuario requerido")
        
        estilo = await servicio.analizar_estilo_usuario(id_usuario, historial_compras)
        
        return {
            "mensaje": "Estilo analizado exitosamente",
            "datos": estilo
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al analizar estilo: {str(e)}")

@router.get("/usuario/{id_usuario}")
async def obtener_estilo_usuario(id_usuario: str):
    """Obtener el perfil de estilo del usuario"""
    try:
        servicio = obtener_servicio_estilos()
        estilo = await servicio.obtener_estilo_usuario(id_usuario)
        
        if not estilo:
            raise HTTPException(status_code=404, detail="Perfil de estilo no encontrado")
        
        return {
            "mensaje": "Perfil de estilo obtenido exitosamente",
            "datos": estilo
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estilo: {str(e)}")

@router.put("/usuario/{id_usuario}")
async def actualizar_estilo_usuario(id_usuario: str, request: Dict[str, Any]):
    """Actualizar el perfil de estilo del usuario"""
    try:
        servicio = obtener_servicio_estilos()
        
        estilo_dominante = request.get("estilo_dominante")
        preferencias = request.get("preferencias", {})
        
        estilo_actualizado = await servicio.actualizar_estilo_usuario(
            id_usuario, estilo_dominante, preferencias
        )
        
        return {
            "mensaje": "Perfil de estilo actualizado exitosamente",
            "datos": estilo_actualizado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar estilo: {str(e)}")