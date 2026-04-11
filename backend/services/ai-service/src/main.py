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

# Circuit Breakers (sin timeout, solo fail_max)
deepseek_breaker = CircuitBreaker(fail_max=5, name='deepseek')
replicate_breaker = CircuitBreaker(fail_max=3, name='replicate')

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

# Cliente IA - Vertex AI (Gemini) como primario, DeepSeek como fallback
_deepseek_client = None
_vertex_disponible = None

def get_deepseek_client():
    global _deepseek_client
    if _deepseek_client is None:
        api_key = os.getenv('AI_GATEWAY_API_KEY', 'placeholder-no-configurado')
        _deepseek_client = OpenAI(api_key=api_key, base_url='https://api.deepseek.com')
    return _deepseek_client

async def chat_con_vertex(mensajes: list, temperatura: float, max_tokens: int) -> str:
    """Llama a Gemini via Google AI API (generativelanguage.googleapis.com)"""
    try:
        import httpx as httpx_client

        api_key = os.getenv('GEMINI_API_KEY', '')
        if not api_key:
            raise Exception('GEMINI_API_KEY no configurada')

        model = 'gemini-2.0-flash'
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'

        # Convertir formato OpenAI a Gemini
        system_content = ''
        user_messages = []
        for m in mensajes:
            if m['role'] == 'system':
                system_content = m['content']
            else:
                role = 'model' if m['role'] == 'assistant' else 'user'
                user_messages.append({'role': role, 'parts': [{'text': m['content']}]})

        payload = {
            'contents': user_messages,
            'generationConfig': {
                'temperature': temperatura,
                'maxOutputTokens': max_tokens
            }
        }
        if system_content:
            payload['systemInstruction'] = {'parts': [{'text': system_content}]}

        async with httpx_client.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        raise Exception(f'Gemini API error: {e}')

async def chat_con_ia(mensajes: list, temperatura: float, max_tokens: int) -> tuple:
    """Intenta Vertex AI primero, cae a DeepSeek si falla. Retorna (respuesta, proveedor)"""
    global _vertex_disponible

    # Intentar Vertex AI
    if _vertex_disponible is not False:
        try:
            respuesta = await chat_con_vertex(mensajes, temperatura, max_tokens)
            _vertex_disponible = True
            print('✅ Respuesta de Gemini (Google AI)')
            return respuesta, 'gemini'
        except Exception as e:
            print(f'⚠️ Vertex AI falló: {e} — usando DeepSeek')
            _vertex_disponible = False

    # Fallback a DeepSeek
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: deepseek_breaker.call(
                get_deepseek_client().chat.completions.create,
                model='deepseek-chat',
                messages=mensajes,
                temperature=temperatura,
                max_tokens=max_tokens
            )
        )
        print('✅ Respuesta de DeepSeek (fallback)')
        return response.choices[0].message.content, 'deepseek'
    except Exception as e:
        raise Exception(f'Ambos proveedores fallaron. DeepSeek: {e}')

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
    allow_origins=[
        "https://egoscolombia.com.co",
        "https://www.egoscolombia.com.co",
        "https://api.egoscolombia.com.co",
        "http://localhost:3005",
        "http://localhost:3000"
    ],
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

        respuesta, proveedor = await chat_con_ia(
            mensajes,
            prompt_config['temp'],
            prompt_config['tokens']
        )
        
        import re
        respuesta = re.sub(r'\s*[\(\[]ID:\s*\d+[\)\]]', '', respuesta, flags=re.IGNORECASE)
        
        productos_recomendados = []
        respuesta_limpia = respuesta
        
        if "PRODUCTOS_RECOMENDADOS:" in respuesta:
            partes = respuesta.split("PRODUCTOS_RECOMENDADOS:")
            respuesta_limpia = partes[0].strip()
            match = re.search(r'\[([^\]]+)\]', partes[1])
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
            "version": "5.0.0",
            "proveedor_ia": proveedor,
            "response_time": round(duration, 3)
        }
        
    except Exception as e:
        request_count.labels(endpoint='chat', status='error').inc()
        print(f"\u274c Error: {e}")
        return {
            "respuesta": "En este momento el asistente de IA no est\u00e1 disponible. \u00a1Pero puedes explorar nuestro cat\u00e1logo y contactarnos directamente! \u2728",
            "productos_recomendados": [],
            "en_contexto": False,
            "version": "5.0.0",
            "proveedor_ia": "ninguno"
        }

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

# ============================================
# ENDPOINTS FALTANTES — requeridos por el gateway
# ============================================

@app.post("/api/recomendaciones")
async def recomendaciones_post(request: RecomendacionRequest):
    """Alias POST para compatibilidad con el frontend"""
    return await recomendaciones(request)

class EstiloRequest(BaseModel):
    descripcion: str
    categoria: Optional[str] = None

@app.post("/api/estilos")
async def analizar_estilo(request: EstiloRequest):
    productos = await obtener_productos_db()
    if request.categoria:
        productos = [p for p in productos if p.get('categoria', '').lower() == request.categoria.lower()]
    estilos = list({p.get('categoria') for p in productos if p.get('categoria')})[:10]
    return {
        "estilos": estilos,
        "descripcion": request.descripcion,
        "recomendaciones": productos[:5]
    }

class AnalisisRequest(BaseModel):
    usuario_id: Optional[str] = None
    productos_vistos: Optional[list] = []

@app.post("/api/analisis")
async def analisis_usuario(request: AnalisisRequest):
    productos = await obtener_productos_db()
    categorias = await obtener_categorias_db()
    return {
        "perfil": {
            "usuario_id": request.usuario_id,
            "categorias_preferidas": categorias[:3],
            "productos_vistos": len(request.productos_vistos)
        },
        "recomendaciones": productos[:5]
    }

@app.get("/api/perfil/{usuario_id}")
async def perfil_usuario(usuario_id: str):
    productos = await obtener_productos_db()
    categorias = await obtener_categorias_db()
    return {
        "usuario_id": usuario_id,
        "estilo_predominante": categorias[0] if categorias else "General",
        "categorias_favoritas": categorias[:3],
        "productos_recomendados": productos[:4]
    }

# ============================================
# ENDPOINTS AVATAR — proxy a helpers_avatar
# ============================================

@app.post("/api/avatar/crear")
async def crear_avatar(
    foto_cara: UploadFile = File(...),
    foto_cuerpo: UploadFile = File(...),
    producto_url: str = Form(...),
    animacion: str = Form(default="catwalk")
):
    try:
        cara_bytes = await foto_cara.read()
        cuerpo_bytes = await foto_cuerpo.read()
        resultado = await procesar_avatar_completo(cara_bytes, cuerpo_bytes, producto_url, animacion)
        return resultado
    except Exception as e:
        print(f"❌ Error creando avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/avatar/demo")
async def avatar_demo(datos: dict):
    producto_url = datos.get("producto_url", "")
    animacion_info = obtener_animacion("catwalk")
    return {
        "avatar_url": "https://models.readyplayer.me/demo.glb",
        "avatar_id": "demo-avatar",
        "textura_url": producto_url,
        "avatar": {"url": "https://models.readyplayer.me/demo.glb", "id": "demo", "provider": "demo", "personalizado": False},
        "animacion": animacion_info or {"nombre": "catwalk", "url": "", "duracion_segundos": 5},
        "metadata": {"tiempo_procesamiento": 0.1, "timestamp": datetime.now().isoformat()}
    }

@app.get("/api/avatar/animaciones")
async def listar_animaciones():
    return {"animaciones": listar_animaciones_disponibles()}

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
    uvicorn.run(app, host="0.0.0.0", port=puerto)
