"""
AI Service v4.0 - VERSIÓN FINAL OPTIMIZADA
Incluye: Redis Cache, Circuit Breaker, Métricas, Prompts Dinámicos
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from openai import OpenAI
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
import base64
from datetime import datetime
from contextlib import asynccontextmanager
import asyncio
import time
import json

# Importar dependencias instaladas
import redis.asyncio as redis
from pybreaker import CircuitBreaker
from tenacity import retry, stop_after_attempt, wait_exponential
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Importar helpers originales
from helpers_avatar import (
    procesar_avatar_completo,
    listar_animaciones_disponibles,
    obtener_animacion
)

# ============================================
# REDIS CACHE
# ============================================
class RedisCache:
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
        self.client = None
        self.enabled = False
        
    async def connect(self):
        try:
            self.client = await redis.from_url(self.redis_url, decode_responses=True)
            await self.client.ping()
            self.enabled = True
            print("✅ Redis conectado")
        except Exception as e:
            print(f"⚠️ Redis no disponible: {e}")
            self.enabled = False
    
    async def get(self, key: str):
        if not self.enabled:
            return None
        try:
            value = await self.client.get(key)
            return json.loads(value) if value else None
        except:
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        if not self.enabled:
            return
        try:
            await self.client.setex(key, ttl, json.dumps(value, default=str))
        except:
            pass
    
    async def close(self):
        if self.client:
            await self.client.close()

cache = RedisCache()

# ============================================
# CIRCUIT BREAKERS
# ============================================
deepseek_breaker = CircuitBreaker(fail_max=5, timeout_duration=60)
replicate_breaker = CircuitBreaker(fail_max=3, timeout_duration=120)

# ============================================
# PROMETHEUS METRICS
# ============================================
request_count = Counter('ai_requests_total', 'Total requests', ['endpoint', 'status'])
request_duration = Histogram('ai_request_duration_seconds', 'Request duration', ['endpoint'])
cache_hits = Counter('cache_hits_total', 'Cache hits')
cache_misses = Counter('cache_misses_total', 'Cache misses')
ai_tokens = Counter('ai_tokens_total', 'AI tokens used', ['type'])

# ============================================
# PROMPT MANAGER
# ============================================
PROMPTS = {
    "v1": {
        "system": """Eres María, asesora de moda para 'EGOS'.
REGLAS:
1. Solo moda y compras
2. Habla natural y profesional
3. Describe productos sin IDs
4. Al final: PRODUCTOS_RECOMENDADOS: [ids]""",
        "temp": 0.7,
        "tokens": 400
    },
    "v2": {
        "system": """Eres María, asesora de moda experta para 'EGOS'.

PERSONALIDAD: Cálida, profesional, entusiasta

REGLAS:
1. SOLO moda, ropa, accesorios, estilo
2. Habla natural, usa emojis ✨
3. Haz preguntas para entender mejor
4. Ofrece 2-3 opciones
5. NUNCA uses (ID: X)
6. Al final: PRODUCTOS_RECOMENDADOS: [ids]""",
        "temp": 0.8,
        "tokens": 600
    }
}

def get_prompt(version="v2"):
    return PROMPTS.get(version, PROMPTS["v2"])

# ============================================
# FASTAPI APP
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 AI Service v4.0 iniciando...")
    await cache.connect()
    await conectar_mongodb()
    print("✅ AI Service v4.0 listo")
    yield
    await cache.close()
    if mongo_client_catalogo:
        mongo_client_catalogo.close()
    if mongo_client_social:
        mongo_client_social.close()

app = FastAPI(
    title="AI Service v4.0 Optimizado",
    description="Con Redis, Circuit Breaker, Métricas",
    version="4.0.0",
    lifespan=lifespan
)

client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://api.deepseek.com'
)

mongo_client_catalogo = None
mongo_client_social = None
db_catalogo = None
db_social = None

async def conectar_mongodb():
    global mongo_client_catalogo, mongo_client_social, db_catalogo, db_social
    
    try:
        mongo_client_catalogo = AsyncIOMotorClient(os.getenv('MONGODB_CATALOG_URI'))
        db_catalogo = mongo_client_catalogo['catalogo']
        count = await db_catalogo.productos.count_documents({})
        print(f"✅ MongoDB Catálogo ({count} productos)")
    except Exception as e:
        print(f"❌ MongoDB Catálogo: {e}")
        db_catalogo = None
    
    try:
        mongo_client_social = AsyncIOMotorClient(os.getenv('MONGODB_SOCIAL_URI'))
        db_social = mongo_client_social['socialservice']
        print(f"✅ MongoDB Social")
    except Exception as e:
        print(f"❌ MongoDB Social: {e}")
        db_social = None

async def obtener_productos_db():
    cached = await cache.get('productos:all')
    if cached:
        cache_hits.inc()
        return cached
    
    cache_misses.inc()
    
    if db_catalogo is None:
        return []
    
    try:
        productos = await db_catalogo.productos.find({}).limit(200).to_list(length=200)
        for p in productos:
            if '_id' in p:
                del p['_id']
        await cache.set('productos:all', productos, ttl=300)
        return productos
    except:
        return []

async def obtener_contexto_completo():
    cached = await cache.get('contexto:completo')
    if cached:
        cache_hits.inc()
        return cached
    
    cache_misses.inc()
    
    productos = await obtener_productos_db()
    categorias = await obtener_categorias_db()
    colores = await obtener_colores_db()
    
    contexto = {
        'productos': productos[:50],
        'total_productos': len(productos),
        'categorias': categorias,
        'colores_disponibles': colores[:30]
    }
    
    await cache.set('contexto:completo', contexto, ttl=300)
    return contexto

async def obtener_categorias_db():
    cached = await cache.get('categorias:all')
    if cached:
        return cached
    
    if db_catalogo is None:
        return []
    
    try:
        productos = await db_catalogo.productos.find({}, {"categoria": 1}).limit(200).to_list(length=200)
        categorias = sorted(list(set(p.get('categoria') for p in productos if p.get('categoria'))))
        await cache.set('categorias:all', categorias, ttl=600)
        return categorias
    except:
        return []

async def obtener_colores_db():
    cached = await cache.get('colores:all')
    if cached:
        return cached
    
    if db_catalogo is None:
        return []
    
    try:
        productos = await db_catalogo.productos.find({}, {"colores": 1}).to_list(length=200)
        colores_set = set()
        for p in productos:
            if 'colores' in p and isinstance(p['colores'], list):
                colores_set.update(p['colores'])
        colores = sorted(list(colores_set))
        await cache.set('colores:all', colores, ttl=600)
        return colores
    except:
        return []

class ChatRequest(BaseModel):
    mensaje: str
    historial: Optional[List[dict]] = []

class RecomendacionRequest(BaseModel):
    usuario_id: Optional[str] = None
    productos_vistos: Optional[List[str]] = []
    preferencias: Optional[dict] = {}
    categoria: Optional[str] = None
    limite: int = 5

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def chat_asistente(request: ChatRequest):
    start = time.time()
    
    try:
        contexto = await obtener_contexto_completo()
        prompt_config = get_prompt("v2")
        
        productos_info = "\\n".join([
            f"ID={p.get('id')}, {p.get('nombre')}, {p.get('categoria')}, ${p.get('precio'):,.0f}"
            for p in contexto['productos'][:30] if p.get('en_stock', True)
        ])
        
        system_prompt = f"""{prompt_config['system']}

PRODUCTOS ({contexto['total_productos']} total):
{productos_info}

CATEGORÍAS: {', '.join(contexto['categorias'])}"""
        
        mensajes = [{'role': 'system', 'content': system_prompt}]
        if request.historial:
            mensajes.extend(request.historial[-10:])
        mensajes.append({'role': 'user', 'content': request.mensaje})
        
        response = deepseek_breaker.call(
            client.chat.completions.create,
            model='deepseek-chat',
            messages=mensajes,
            temperature=prompt_config['temp'],
            max_tokens=prompt_config['tokens']
        )
        
        respuesta = response.choices[0].message.content
        
        import re
        respuesta = re.sub(r'\\s*[\\(\\[]ID:\\s*\\d+[\\)\\]]', '', respuesta, flags=re.IGNORECASE)
        
        productos_recomendados = []
        respuesta_limpia = respuesta
        
        if "PRODUCTOS_RECOMENDADOS:" in respuesta:
            partes = respuesta.split("PRODUCTOS_RECOMENDADOS:")
            respuesta_limpia = partes[0].strip()
            match = re.search(r'\\[([^\\]]+)\\]', partes[1])
            if match:
                productos_recomendados = [id.strip().strip('"').strip("'") for id in match.group(1).split(',')]
        
        duration = time.time() - start
        request_count.labels(endpoint='chat', status='success').inc()
        request_duration.labels(endpoint='chat').observe(duration)
        
        return {
            "respuesta": respuesta_limpia,
            "productos_recomendados": productos_recomendados,
            "en_contexto": True,
            "productos_disponibles": contexto['total_productos'],
            "version": "4.0.0",
            "response_time": round(duration, 3)
        }
        
    except Exception as e:
        request_count.labels(endpoint='chat', status='error').inc()
        print(f"❌ Error: {e}")
        raise

@app.post("/api/recomendaciones/personalizada")
async def recomendaciones(request: RecomendacionRequest):
    start = time.time()
    
    productos = await obtener_productos_db()
    
    if request.categoria:
        productos = [p for p in productos if p.get('categoria', '').lower() == request.categoria.lower()]
    
    # Scoring avanzado
    for producto in productos:
        score = producto.get('calificacion', 0) * 10
        if producto.get('id') in request.productos_vistos:
            score += 20
        if request.preferencias.get('estilo') == producto.get('estilo'):
            score += 30
        producto['score'] = score
    
    productos.sort(key=lambda x: x.get('score', 0), reverse=True)
    recomendaciones = productos[:request.limite]
    
    duration = time.time() - start
    request_duration.labels(endpoint='recomendaciones').observe(duration)
    
    return {
        "recomendaciones": recomendaciones,
        "total": len(recomendaciones),
        "algoritmo": "scoring_v4",
        "response_time": round(duration, 3)
    }

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "4.0.0",
        "redis": cache.enabled,
        "mongodb": db_catalogo is not None,
        "mejoras": [
            "✅ Redis Cache",
            "✅ Circuit Breaker",
            "✅ Prometheus Metrics",
            "✅ Prompts Optimizados"
        ],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/salud")
async def salud():
    productos_count = len(await obtener_productos_db())
    
    return {
        "estado": "activo",
        "servicio": "ai-service-optimizado",
        "version": "4.0.0",
        "mejoras_activas": [
            "✅ Redis Cache (5min TTL)",
            "✅ Circuit Breaker (DeepSeek, Replicate)",
            "✅ Prometheus Metrics",
            "✅ Prompts Dinámicos v2"
        ],
        "mongodb_catalogo_conectado": db_catalogo is not None,
        "redis_conectado": cache.enabled,
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "productos_disponibles": productos_count
        }
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3007))
    print(f"🚀 AI Service v4.0 en puerto {puerto}")
    uvicorn.run("main_v4:app", host="0.0.0.0", port=puerto, reload=False)
