from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from config.base_datos import obtener_bd
from modelos.categoria import CategoriaCrear, CategoriaActualizar

class ServicioCategorias:
    def __init__(self):
        self.bd = obtener_bd()
        self.coleccion = "categorias"

    async def crear_categoria(self, categoria: CategoriaCrear) -> dict:
        """Crear una nueva categoría"""
        datos_categoria = categoria.model_dump()
        datos_categoria["fecha_creacion"] = datetime.utcnow()
        
        resultado = await self.bd[self.coleccion].insert_one(datos_categoria)
        categoria_creada = await self.bd[self.coleccion].find_one({"_id": resultado.inserted_id})
        
        return categoria_creada

    async def obtener_categorias(self) -> List[dict]:
        """Obtener todas las categorías activas"""
        cursor = self.bd[self.coleccion].find({"activo": True}).sort("nombre", 1)
        return await cursor.to_list(length=None)

    async def obtener_categoria_por_id(self, id_categoria: str) -> Optional[dict]:
        """Obtener una categoría por ID"""
        if not ObjectId.is_valid(id_categoria):
            return None
        
        return await self.bd[self.coleccion].find_one({"_id": ObjectId(id_categoria)})

    async def actualizar_categoria(self, id_categoria: str, datos: CategoriaActualizar) -> Optional[dict]:
        """Actualizar una categoría"""
        if not ObjectId.is_valid(id_categoria):
            return None
        
        datos_actualizacion = {k: v for k, v in datos.model_dump().items() if v is not None}
        if not datos_actualizacion:
            return None
        
        resultado = await self.bd[self.coleccion].update_one(
            {"_id": ObjectId(id_categoria)},
            {"$set": datos_actualizacion}
        )
        
        if resultado.modified_count:
            return await self.obtener_categoria_por_id(id_categoria)
        
        return None