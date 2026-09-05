from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from config.base_datos import obtener_bd
from modelos.tendencia import TendenciaCrear, TendenciaActualizar

class ServicioTendencias:
    def __init__(self):
        self.bd = obtener_bd()
        self.coleccion = "tendencias_moda"

    async def crear_tendencia(self, tendencia: TendenciaCrear) -> dict:
        """Crear una nueva tendencia"""
        datos_tendencia = tendencia.model_dump()
        datos_tendencia["fecha_creacion"] = datetime.utcnow()
        
        resultado = await self.bd[self.coleccion].insert_one(datos_tendencia)
        tendencia_creada = await self.bd[self.coleccion].find_one({"_id": resultado.inserted_id})
        
        return tendencia_creada

    async def obtener_tendencias(self) -> List[dict]:
        """Obtener todas las tendencias activas"""
        cursor = self.bd[self.coleccion].find({"activo": True}).sort("nombre", 1)
        return await cursor.to_list(length=None)

    async def obtener_tendencia_por_id(self, id_tendencia: str) -> Optional[dict]:
        """Obtener una tendencia por ID"""
        if not ObjectId.is_valid(id_tendencia):
            return None
        
        return await self.bd[self.coleccion].find_one({"_id": ObjectId(id_tendencia)})