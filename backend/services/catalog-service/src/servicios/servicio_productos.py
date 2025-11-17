from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from pymongo import ASCENDING, DESCENDING

from config.base_datos import obtener_bd
from modelos.producto import ProductoCrear, ProductoActualizar, FiltrosProducto

class ServicioProductos:
    def __init__(self):
        self.bd = obtener_bd()
        self.coleccion = "productos"

    async def crear_producto(self, producto: ProductoCrear) -> dict:
        """Crear un nuevo producto"""
        datos_producto = producto.model_dump()
        datos_producto["fecha_creacion"] = datetime.utcnow()
        datos_producto["fecha_actualizacion"] = datetime.utcnow()
        
        resultado = await self.bd[self.coleccion].insert_one(datos_producto)
        producto_creado = await self.bd[self.coleccion].find_one({"_id": resultado.inserted_id})
        
        return producto_creado

    async def obtener_productos(self, filtros: FiltrosProducto) -> dict:
        """Obtener productos con filtros y paginación"""
        consulta = {"activo": filtros.activo}
        
        # Aplicar filtros
        if filtros.nombre:
            consulta["$text"] = {"$search": filtros.nombre}
        
        if filtros.categoria:
            consulta["ids_categoria"] = filtros.categoria
        
        if filtros.tendencia:
            consulta["id_tendencia_moda"] = filtros.tendencia
        
        if filtros.color:
            consulta["color"] = {"$regex": filtros.color, "$options": "i"}
        
        if filtros.talla:
            consulta["talla"] = filtros.talla
        
        if filtros.precio_min is not None or filtros.precio_max is not None:
            consulta["precio"] = {}
            if filtros.precio_min is not None:
                consulta["precio"]["$gte"] = filtros.precio_min
            if filtros.precio_max is not None:
                consulta["precio"]["$lte"] = filtros.precio_max

        # Calcular paginación
        saltar = (filtros.pagina - 1) * filtros.limite
        
        # Ejecutar consulta
        cursor = self.bd[self.coleccion].find(consulta).skip(saltar).limit(filtros.limite)
        productos = await cursor.to_list(length=filtros.limite)
        
        # Contar total
        total = await self.bd[self.coleccion].count_documents(consulta)
        
        return {
            "productos": productos,
            "total": total,
            "pagina": filtros.pagina,
            "limite": filtros.limite,
            "total_paginas": (total + filtros.limite - 1) // filtros.limite
        }

    async def obtener_producto_por_id(self, id_producto: str) -> Optional[dict]:
        """Obtener un producto por ID"""
        # Intentar con ObjectId primero, luego con string
        if ObjectId.is_valid(id_producto):
            producto = await self.bd[self.coleccion].find_one({"_id": ObjectId(id_producto)})
            if producto:
                return producto
        
        return await self.bd[self.coleccion].find_one({"_id": id_producto})

    async def actualizar_producto(self, id_producto: str, datos: ProductoActualizar) -> Optional[dict]:
        """Actualizar un producto"""
        if not ObjectId.is_valid(id_producto):
            return None
        
        datos_actualizacion = {k: v for k, v in datos.model_dump().items() if v is not None}
        if not datos_actualizacion:
            return None
        
        datos_actualizacion["fecha_actualizacion"] = datetime.utcnow()
        
        resultado = await self.bd[self.coleccion].update_one(
            {"_id": ObjectId(id_producto)},
            {"$set": datos_actualizacion}
        )
        
        if resultado.modified_count:
            return await self.obtener_producto_por_id(id_producto)
        
        return None

    async def eliminar_producto(self, id_producto: str) -> bool:
        """Eliminar un producto (soft delete)"""
        if not ObjectId.is_valid(id_producto):
            return False
        
        resultado = await self.bd[self.coleccion].update_one(
            {"_id": ObjectId(id_producto)},
            {"$set": {"activo": False, "fecha_actualizacion": datetime.utcnow()}}
        )
        
        return resultado.modified_count > 0