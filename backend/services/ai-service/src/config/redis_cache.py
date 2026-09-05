"""
Sistema de caché con Redis para optimizar performance
"""
import redis.asyncio as redis
import json
import os
from typing import Optional, Any
from datetime import timedelta

class RedisCache:
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.client: Optional[redis.Redis] = None
        self.enabled = True
        
    async def connect(self):
        """Conectar a Redis"""
        try:
            self.client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5
            )
            await self.client.ping()
            print("✅ Redis conectado exitosamente")
        except Exception as e:
            print(f"⚠️ Redis no disponible: {e}")
            self.enabled = False
            self.client = None
    
    async def close(self):
        """Cerrar conexión"""
        if self.client:
            await self.client.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Obtener valor del caché"""
        if not self.enabled or not self.client:
            return None
        
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            print(f"⚠️ Error leyendo caché: {e}")
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        """Guardar en caché con TTL (default 5 min)"""
        if not self.enabled or not self.client:
            return False
        
        try:
            await self.client.setex(
                key,
                ttl,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            print(f"⚠️ Error guardando caché: {e}")
            return False
    
    async def delete(self, key: str):
        """Eliminar del caché"""
        if not self.enabled or not self.client:
            return
        
        try:
            await self.client.delete(key)
        except Exception as e:
            print(f"⚠️ Error eliminando caché: {e}")
    
    async def clear_pattern(self, pattern: str):
        """Limpiar claves que coincidan con patrón"""
        if not self.enabled or not self.client:
            return
        
        try:
            keys = await self.client.keys(pattern)
            if keys:
                await self.client.delete(*keys)
        except Exception as e:
            print(f"⚠️ Error limpiando caché: {e}")

# Instancia global
cache = RedisCache()
