import random
from typing import List, Dict
from datetime import datetime
from bson import ObjectId

from config.base_datos import obtener_bd

class ServicioRecomendaciones:
    def __init__(self):
        self.bd = obtener_bd()
        self.coleccion_recomendaciones = "recomendaciones_ia"
        self.coleccion_estilos = "estilos_usuario"

    async def generar_recomendaciones_estilo(self, id_usuario: str, estilo_dominante: str) -> List[str]:
        """Generar recomendaciones basadas en el estilo del usuario"""
        
        # Simulación de algoritmo de recomendación
        productos_recomendados = []
        
        # Mapeo de estilos a tipos de productos (simulado)
        mapeo_estilos = {
            "Clasica": ["camisas", "pantalones_formales", "blazers"],
            "Urbana": ["jeans", "camisetas", "zapatillas"],
            "Deportiva": ["ropa_deportiva", "zapatillas_deportivas"],
            "Elegante": ["vestidos", "trajes", "zapatos_formales"],
            "Bohemia": ["vestidos_largos", "accesorios", "sandalias"],
            "Minimalista": ["basicos", "colores_neutros"]
        }
        
        categorias = mapeo_estilos.get(estilo_dominante, ["general"])
        
        # Generar IDs de productos simulados
        for categoria in categorias:
            for i in range(3):  # 3 productos por categoría
                productos_recomendados.append(f"producto_{categoria}_{i+1}")
        
        # Guardar recomendación en BD
        recomendacion = {
            "id_usuario": id_usuario,
            "productos": productos_recomendados,
            "motivo": f"Basado en tu estilo {estilo_dominante}",
            "tipo_algoritmo": "RecomendacionEstilo",
            "puntuacion_confianza": round(random.uniform(0.7, 0.95), 2),
            "contexto": {
                "estilo_base": estilo_dominante,
                "fecha_generacion": datetime.utcnow().isoformat()
            },
            "activa": True,
            "fecha_creacion": datetime.utcnow(),
            "fecha_expiracion": datetime.utcnow()
        }
        
        resultado = await self.bd[self.coleccion_recomendaciones].insert_one(recomendacion)
        recomendacion["_id"] = resultado.inserted_id
        
        return recomendacion

    async def obtener_recomendaciones_usuario(self, id_usuario: str) -> List[Dict]:
        """Obtener recomendaciones activas del usuario"""
        cursor = self.bd[self.coleccion_recomendaciones].find({
            "id_usuario": id_usuario,
            "activa": True
        }).sort("fecha_creacion", -1).limit(10)
        
        return await cursor.to_list(length=10)

    async def generar_recomendaciones_colaborativas(self, id_usuario: str) -> Dict:
        """Generar recomendaciones basadas en usuarios similares"""
        
        # Simulación de filtrado colaborativo
        productos_similares = [
            f"producto_colaborativo_{i}" for i in range(1, 6)
        ]
        
        recomendacion = {
            "id_usuario": id_usuario,
            "productos": productos_similares,
            "motivo": "Usuarios con gustos similares también compraron",
            "tipo_algoritmo": "Colaborativo",
            "puntuacion_confianza": round(random.uniform(0.6, 0.85), 2),
            "contexto": {
                "usuarios_similares": random.randint(50, 200),
                "fecha_generacion": datetime.utcnow().isoformat()
            },
            "activa": True,
            "fecha_creacion": datetime.utcnow(),
            "fecha_expiracion": datetime.utcnow()
        }
        
        resultado = await self.bd[self.coleccion_recomendaciones].insert_one(recomendacion)
        recomendacion["_id"] = resultado.inserted_id
        
        return recomendacion

    async def marcar_recomendacion_vista(self, id_recomendacion: str) -> bool:
        """Marcar una recomendación como vista"""
        if not ObjectId.is_valid(id_recomendacion):
            return False
        
        resultado = await self.bd[self.coleccion_recomendaciones].update_one(
            {"_id": ObjectId(id_recomendacion)},
            {"$set": {"vista": True, "fecha_vista": datetime.utcnow()}}
        )
        
        return resultado.modified_count > 0