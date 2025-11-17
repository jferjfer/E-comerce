import random
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId

from config.base_datos import obtener_bd

class ServicioEstilos:
    def __init__(self):
        self.bd = obtener_bd()
        self.coleccion = "estilos_usuario"

    async def analizar_estilo_usuario(self, id_usuario: str, historial_compras: List[Dict]) -> Dict:
        """Analizar el historial de compras para determinar el estilo dominante"""
        
        # Simulación de análisis de estilo basado en compras
        estilos_disponibles = ["Clasica", "Urbana", "Deportiva", "Elegante", "Bohemia", "Minimalista"]
        
        # Algoritmo simulado de análisis
        if len(historial_compras) > 10:
            estilo_dominante = random.choice(["Clasica", "Elegante"])
            puntuacion_afinidad = round(random.uniform(0.8, 0.95), 2)
        elif len(historial_compras) > 5:
            estilo_dominante = random.choice(["Urbana", "Deportiva"])
            puntuacion_afinidad = round(random.uniform(0.7, 0.85), 2)
        else:
            estilo_dominante = random.choice(estilos_disponibles)
            puntuacion_afinidad = round(random.uniform(0.6, 0.8), 2)
        
        # Generar estilos secundarios
        estilos_secundarios = []
        otros_estilos = [e for e in estilos_disponibles if e != estilo_dominante]
        for estilo in random.sample(otros_estilos, min(2, len(otros_estilos))):
            estilos_secundarios.append({
                "estilo": estilo,
                "puntuacion": round(random.uniform(0.3, 0.6), 2)
            })
        
        # Crear o actualizar perfil de estilo
        perfil_estilo = {
            "id_usuario": id_usuario,
            "estilo_dominante": estilo_dominante,
            "puntuacion_afinidad": puntuacion_afinidad,
            "estilos_secundarios": estilos_secundarios,
            "preferencias": {
                "colores_favoritos": random.sample(["Negro", "Blanco", "Azul", "Gris", "Rojo"], 3),
                "marcas_preferidas": random.sample(["Marca A", "Marca B", "Marca C"], 2),
                "precio_promedio": round(random.uniform(50, 200), 2)
            },
            "fecha_actualizacion": datetime.utcnow(),
            "fecha_creacion": datetime.utcnow()
        }
        
        # Actualizar o insertar en BD
        await self.bd[self.coleccion].update_one(
            {"id_usuario": id_usuario},
            {"$set": perfil_estilo},
            upsert=True
        )
        
        return perfil_estilo

    async def obtener_estilo_usuario(self, id_usuario: str) -> Optional[Dict]:
        """Obtener el perfil de estilo del usuario"""
        return await self.bd[self.coleccion].find_one({"id_usuario": id_usuario})

    async def actualizar_estilo_usuario(self, id_usuario: str, estilo_dominante: str = None, preferencias: Dict = None) -> Dict:
        """Actualizar el perfil de estilo del usuario"""
        
        actualizacion = {"fecha_actualizacion": datetime.utcnow()}
        
        if estilo_dominante:
            actualizacion["estilo_dominante"] = estilo_dominante
        
        if preferencias:
            actualizacion["preferencias"] = preferencias
        
        resultado = await self.bd[self.coleccion].update_one(
            {"id_usuario": id_usuario},
            {"$set": actualizacion}
        )
        
        if resultado.modified_count == 0:
            raise Exception("No se pudo actualizar el perfil de estilo")
        
        return await self.obtener_estilo_usuario(id_usuario)

    async def obtener_tendencias_populares(self) -> List[Dict]:
        """Obtener las tendencias de estilo más populares"""
        
        # Simulación de tendencias populares
        tendencias = [
            {
                "estilo": "Minimalista",
                "popularidad": 0.85,
                "crecimiento": "+15%",
                "descripcion": "Líneas limpias y colores neutros"
            },
            {
                "estilo": "Urbana",
                "popularidad": 0.78,
                "crecimiento": "+8%",
                "descripcion": "Estilo moderno y casual"
            },
            {
                "estilo": "Deportiva",
                "popularidad": 0.72,
                "crecimiento": "+12%",
                "descripcion": "Comodidad y funcionalidad"
            }
        ]
        
        return tendencias