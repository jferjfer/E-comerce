from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from servicios.servicio_recomendaciones import ServicioRecomendaciones

router = APIRouter()

def obtener_servicio_recomendaciones():
    return ServicioRecomendaciones()

@router.post("/generar-por-estilo")
async def generar_recomendaciones_estilo(request: Dict[str, Any]):
    """Generar recomendaciones basadas en el estilo del usuario"""
    try:
        servicio = obtener_servicio_recomendaciones()
        
        id_usuario = request.get("id_usuario")
        estilo_dominante = request.get("estilo_dominante", "Clasica")
        
        if not id_usuario:
            raise HTTPException(status_code=400, detail="ID de usuario requerido")
        
        recomendacion = await servicio.generar_recomendaciones_estilo(id_usuario, estilo_dominante)
        
        return {
            "mensaje": "Recomendaciones generadas exitosamente",
            "datos": recomendacion
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar recomendaciones: {str(e)}")

@router.post("/generar-colaborativas")
async def generar_recomendaciones_colaborativas(request: Dict[str, Any]):
    """Generar recomendaciones basadas en filtrado colaborativo"""
    try:
        servicio = obtener_servicio_recomendaciones()
        
        id_usuario = request.get("id_usuario")
        
        if not id_usuario:
            raise HTTPException(status_code=400, detail="ID de usuario requerido")
        
        recomendacion = await servicio.generar_recomendaciones_colaborativas(id_usuario)
        
        return {
            "mensaje": "Recomendaciones colaborativas generadas exitosamente",
            "datos": recomendacion
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar recomendaciones: {str(e)}")

@router.get("/usuario/{id_usuario}")
async def obtener_recomendaciones_usuario(id_usuario: str):
    """Obtener todas las recomendaciones activas del usuario"""
    try:
        servicio = obtener_servicio_recomendaciones()
        recomendaciones = await servicio.obtener_recomendaciones_usuario(id_usuario)
        
        return {
            "mensaje": "Recomendaciones obtenidas exitosamente",
            "datos": recomendaciones,
            "total": len(recomendaciones)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener recomendaciones: {str(e)}")

@router.put("/{id_recomendacion}/marcar-vista")
async def marcar_recomendacion_vista(id_recomendacion: str):
    """Marcar una recomendación como vista"""
    try:
        servicio = obtener_servicio_recomendaciones()
        actualizada = await servicio.marcar_recomendacion_vista(id_recomendacion)
        
        if not actualizada:
            raise HTTPException(status_code=404, detail="Recomendación no encontrada")
        
        return {
            "mensaje": "Recomendación marcada como vista exitosamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al marcar recomendación: {str(e)}")