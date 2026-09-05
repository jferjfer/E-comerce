from fastapi import APIRouter, HTTPException, Depends
from typing import List

from modelos.tendencia import TendenciaCrear, TendenciaActualizar, TendenciaRespuesta
from servicios.servicio_tendencias import ServicioTendencias

router = APIRouter()

def obtener_servicio_tendencias():
    return ServicioTendencias()

@router.post("/", response_model=TendenciaRespuesta, status_code=201)
async def crear_tendencia(
    tendencia: TendenciaCrear,
    servicio: ServicioTendencias = Depends(obtener_servicio_tendencias)
):
    """Crear una nueva tendencia de moda"""
    try:
        tendencia_creada = await servicio.crear_tendencia(tendencia)
        return TendenciaRespuesta(**tendencia_creada)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear tendencia: {str(e)}")

@router.get("/", response_model=List[TendenciaRespuesta])
async def listar_tendencias(
    servicio: ServicioTendencias = Depends(obtener_servicio_tendencias)
):
    """Listar todas las tendencias activas"""
    tendencias = await servicio.obtener_tendencias()
    return [TendenciaRespuesta(**tendencia) for tendencia in tendencias]

@router.get("/{id_tendencia}", response_model=TendenciaRespuesta)
async def obtener_tendencia(
    id_tendencia: str,
    servicio: ServicioTendencias = Depends(obtener_servicio_tendencias)
):
    """Obtener una tendencia por ID"""
    tendencia = await servicio.obtener_tendencia_por_id(id_tendencia)
    
    if not tendencia:
        raise HTTPException(status_code=404, detail="Tendencia no encontrada")
    
    return TendenciaRespuesta(**tendencia)