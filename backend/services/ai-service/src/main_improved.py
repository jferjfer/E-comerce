"""
AI Service Mejorado v4.0
Incluye todas las optimizaciones: Redis, Embeddings, Circuit Breaker, Monitoring, etc.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn
import os
from openai import OpenAI
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
import base64
from datetime import datetime
from contextlib import asynccontextmanager

# Importar nuevos módulos
from config.redis_cache import cache
from servicios.embedding_recommender import recommender
from servicios.local_tryon import local_tryon
from servicios.metrics import (
    track_request, track_ai_chat, track_tryon,
    get_metrics, track_api_cost
)
from servicios.resilience import (
    deepseek_client, with_fallback,
    fallback_deepseek_response, get_breaker_stats
)
from servicios.prompt_manager import prompt_manager
from servicios.celery_tasks import (
    procesar_virtual_tryon_task,
    generar_avatar_3d_task
)

# Importar helpers originales
from helpers_avatar import (
    procesar_avatar_completo,
    listar_animaciones_disponibles,
    obtener_animacion
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Iniciando AI Service v4.0 con mejoras...")
    
    # Conectar Redis
    await cache.connect()
    
    # Cargar modelo de embeddings en background
    recommender.load_model()
    
    # Intentar cargar modelo local de Try-On
    local_tryon.load_model()
    
    # Conectar MongoDB
    await conectar_mongodb()
    
    print("✅ AI Service v4.0 listo")
    
    yield
    
    # Shutdown
    await cache.close()
    if mongo_client_catalogo:
        mongo_client_catalogo.close()
    if mongo_client_social:
        mongo_client_social.close()

app = FastAPI(
    title="AI Service Mejorado v4.0",
    description="API de IA con caché, embeddings, circuit breaker y monitoring",
    version="4.0.0",
    lifespan=lifespan
)

# Cliente OpenAI/DeepSeek
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://api.deepseek.com'
)

# MongoDB Clients
mongo_client_catalogo = None
mongo_client_social = None
db_catalogo = None
db_social = None

# Datos en memoria como fallback
perfiles_usuarios = {}

async def conectar_mongodb():
    global mongo_client_catalogo, mongo_client_social, db_catalogo, db_social
    
    mongodb_catalog_uri = os.getenv('MONGODB_CATALOG_URI')
    try:
        mongo_client_catalogo = AsyncIOMotorClient(mongodb_catalog_uri)
        db_catalogo = mongo_client_catalogo['catalogo']
        count = await db_catalogo.productos.count_documents({})
        print(f"✅ MongoDB Catálogo conectado ({count} productos)")
    except Exception as e:
        print(f"❌ Error MongoDB Catálogo: {e}")
        db_catalogo = None
    
    mongodb_social_uri = os.getenv('MONGODB_SOCIAL_URI')
    try:
        mongo_client_social = AsyncIOMotorClient(mongodb_social_uri)
        db_social = mongo_client_social['socialservice']
        count = await db_social.resenas.count_documents({})
        print(f"✅ MongoDB Social conectado ({count} reseñas)")
    except Exception as e:
        print(f"❌ Error MongoDB Social: {e}")
        db_social = None

# FUNCIONES OPTIMIZADAS CON CACHÉ

async def obtener_productos_db():
    """Obtener productos con caché Redis"""
    # Intentar desde caché
    cached = await cache.get('productos:all')
    if cached:
        print("✅ Productos desde caché")
        return cached
    
    # Si no hay caché, obtener de DB
    if db_catalogo is None:
        return []
    
    try:
        productos = await db_catalogo.productos.find({}).limit(200).to_list(length=200)
        for p in productos:
            if '_id' in p:
                del p['_id']
        
        # Guardar en caché (5 minutos)
        await cache.set('productos:all', productos, ttl=300)
        
        return productos
    except:
        return []

async def obtener_contexto_completo():
    """Obtener contexto con caché optimizado"""
    # Intentar desde caché
    cached = await cache.get('contexto:completo')
    if cached:
        print("✅ Contexto desde caché")
        return cached
    
    # Obtener datos
    import asyncio
    
    productos_task = obtener_productos_db()
    categorias_task = obtener_categorias_db()
    colores_task = obtener_colores_db()
    
    productos, categorias, colores = await asyncio.gather(
        productos_task, categorias_task, colores_task,
        return_exceptions=True
    )
    
    if isinstance(productos, Exception):
        productos = []
    if isinstance(categorias, Exception):
        categorias = []
    if isinstance(colores, Exception):
        colores = []
    
    contexto = {
        'productos': productos[:50],  # Limitar para prompt
        'total_productos': len(productos),
        'categorias': categorias,
        'colores_disponibles': colores[:30]
    }
    
    # Guardar en caché (5 minutos)
    await cache.set('contexto:completo', contexto, ttl=300)
    
    return contexto

async def obtener_categorias_db():
    """Obtener categorías con caché"""
    cached = await cache.get('categorias:all')
    if cached:
        return cached
    
    if db_catalogo is None:
        return []
    
    try:
        productos = await db_catalogo.productos.find({}, {"categoria": 1}).limit(200).to_list(length=200)
        categorias_set = set()
        for p in productos:
            if 'categoria' in p:
                categorias_set.add(p['categoria'])
        
        categorias = sorted(list(categorias_set))
        await cache.set('categorias:all', categorias, ttl=600)
        
        return categorias
    except:
        return []

async def obtener_colores_db():
    """Obtener colores con caché"""
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

# Modelos de datos
class RecomendacionRequest(BaseModel):
    usuario_id: Optional[str] = None
    productos_vistos: Optional[List[str]] = []
    preferencias: Optional[dict] = {}
    categoria: Optional[str] = None
    ocasion: Optional[str] = None
    limite: int = 5

class ChatRequest(BaseModel):
    mensaje: str
    historial: Optional[List[dict]] = []
    usuario_id: Optional[str] = None

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3005",
        "http://149.130.182.9:3005",
        "http://localhost:3000",
        "http://149.130.182.9:3000",
        "http://149.130.182.9"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ENDPOINTS MEJORADOS
# ============================================

@app.post("/api/chat")
@track_request("chat")
@track_ai_chat()
@with_fallback(fallback_deepseek_response)
async def chat_asistente(request: ChatRequest):
    """Chat con IA mejorado con caché, embeddings y circuit breaker"""
    try:
        # Obtener contexto (con caché)
        contexto = await obtener_contexto_completo()
        
        # Obtener perfil de usuario si existe
        user_profile = None
        if request.usuario_id:
            user_profile = await cache.get(f'perfil:{request.usuario_id}')
        
        # Obtener prompt dinámico
        prompt_config = prompt_manager.get_prompt(
            user_profile=user_profile,
            context=contexto
        )
        
        # Crear lista de productos para el prompt
        productos_info = "\\n".join([
            f"ID={p.get('id')}, Nombre={p.get('nombre')}, Categoría={p.get('categoria')}, Precio=${p.get('precio'):,.0f}"
            for p in contexto['productos'][:30] if p.get('en_stock', True)
        ])
        
        system_prompt_final = f"""{prompt_config['system']}

PRODUCTOS DISPONIBLES ({contexto['total_productos']} total):
{productos_info}

CATEGORÍAS: {', '.join(contexto['categorias'])}
"""
        
        # Construir mensajes
        mensajes = [{'role': 'system', 'content': system_prompt_final}]
        
        if request.historial:
            mensajes.extend(request.historial[-10:])
        
        mensajes.append({'role': 'user', 'content': request.mensaje})
        
        # Llamar a DeepSeek con circuit breaker
        response = client.chat.completions.create(
            model='deepseek-chat',
            messages=mensajes,
            temperature=prompt_config['temperature'],
            max_tokens=prompt_config['max_tokens']
        )
        
        # Trackear costo
        track_api_cost('deepseek', 0.001)
        
        respuesta_completa = response.choices[0].message.content
        
        # Limpiar IDs del texto
        import re
        respuesta_completa = re.sub(r'\\s*[\\(\\[]ID:\\s*\\d+[\\)\\]]', '', respuesta_completa, flags=re.IGNORECASE)
        
        # Extraer productos recomendados
        productos_recomendados = []
        respuesta_limpia = respuesta_completa
        
        if "PRODUCTOS_RECOMENDADOS:" in respuesta_completa:
            partes = respuesta_completa.split("PRODUCTOS_RECOMENDADOS:")
            respuesta_limpia = partes[0].strip()
            
            match = re.search(r'\\[([^\\]]+)\\]', partes[1])
            if match:
                ids_str = match.group(1)
                productos_recomendados = [id.strip().strip('"').strip("'") for id in ids_str.split(',')]
        
        # Registrar resultado del prompt
        prompt_manager.record_prompt_result(
            prompt_config['version'],
            success=len(productos_recomendados) > 0
        )
        
        return {
            "respuesta": respuesta_limpia,
            "productos_recomendados": productos_recomendados,
            "en_contexto": True,
            "productos_disponibles": contexto['total_productos'],
            "prompt_version": prompt_config['version']
        }
        
    except Exception as e:
        print(f"❌ Error IA: {e}")
        raise

@app.post("/api/recomendaciones/personalizada")
@track_request("recomendaciones")
async def obtener_recomendaciones_personalizadas(request: RecomendacionRequest):
    """Recomendaciones con embeddings semánticos"""
    print(f"🤖 Recomendaciones con embeddings para {request.usuario_id}")
    
    # Obtener productos
    productos = await obtener_productos_db()
    
    if not productos:
        return {"recomendaciones": [], "total": 0}
    
    # Filtrar por categoría si se especifica
    if request.categoria:
        productos = [p for p in productos if p.get('categoria', '').lower() == request.categoria.lower()]
    
    # Usar embeddings para recomendaciones
    if request.productos_vistos:
        recomendaciones = recommender.recommend_based_on_history(
            request.productos_vistos,
            productos,
            top_k=request.limite
        )
    else:
        # Si no hay historial, usar búsqueda semántica con preferencias
        query_text = f"{request.preferencias.get('estilo', '')} {request.ocasion or ''}"
        recomendaciones = recommender.find_similar_products(
            query_text,
            productos,
            top_k=request.limite
        )
    
    return {
        "recomendaciones": recomendaciones,
        "total": len(recomendaciones),
        "algoritmo": "embeddings_semanticos_v4",
        "modelo": recommender.model_name
    }

@app.post("/api/virtual-tryon-async")
@track_request("virtual_tryon_async")
async def virtual_tryon_async(
    background_tasks: BackgroundTasks,
    person_image: UploadFile = File(...),
    product_image_url: str = Form(...),
    usuario_id: str = Form(...)
):
    """Virtual Try-On asíncrono con queue"""
    try:
        person_bytes = await person_image.read()
        
        # Encolar tarea
        task = procesar_virtual_tryon_task.delay(
            person_bytes,
            product_image_url,
            usuario_id
        )
        
        return {
            "task_id": task.id,
            "status": "processing",
            "mensaje": "Tu prueba virtual está siendo procesada. Te notificaremos cuando esté lista."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/virtual-tryon-status/{task_id}")
async def get_tryon_status(task_id: str):
    """Obtener estado de tarea de Virtual Try-On"""
    from servicios.celery_tasks import celery_app
    
    task = celery_app.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {
            'state': task.state,
            'status': 'En cola...'
        }
    elif task.state == 'PROCESSING':
        response = {
            'state': task.state,
            'progress': task.info.get('progress', 0),
            'status': task.info.get('status', '')
        }
    elif task.state == 'SUCCESS':
        response = {
            'state': task.state,
            'result': task.result
        }
    else:
        response = {
            'state': task.state,
            'status': str(task.info)
        }
    
    return response

@app.post("/api/virtual-tryon")
@track_tryon("local_or_replicate")
async def virtual_tryon(
    person_image: UploadFile = File(...),
    product_image_url: str = Form(...)
):
    """Virtual Try-On con modelo local como prioridad"""
    try:
        person_bytes = await person_image.read()
        
        # Intentar con modelo local primero
        if local_tryon.enabled:
            print("🎨 Usando modelo local...")
            
            # Descargar imagen del producto
            async with httpx.AsyncClient() as client:
                response = await client.get(product_image_url)
                garment_bytes = response.content
            
            result_bytes = local_tryon.apply_garment(person_bytes, garment_bytes)
            
            if result_bytes:
                # Mejorar calidad
                result_bytes = local_tryon.enhance_result(result_bytes)
                
                result_base64 = base64.b64encode(result_bytes).decode('utf-8')
                
                return {
                    "exito": True,
                    "imagen_resultado": f"data:image/jpeg;base64,{result_base64}",
                    "mensaje": "Procesado con modelo local",
                    "proveedor": "local_onnx"
                }
        
        # Fallback a Replicate
        print("🔄 Fallback a Replicate...")
        from helpers_avatar import aplicar_prenda_con_replicate
        
        resultado_url = await aplicar_prenda_con_replicate(person_bytes, product_image_url)
        
        # Trackear costo
        track_api_cost('replicate', 0.05)
        
        return {
            "exito": True,
            "imagen_resultado": resultado_url,
            "mensaje": "Procesado con Replicate",
            "proveedor": "replicate"
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS DE MONITORING
# ============================================

@app.get("/metrics")
async def metrics():
    """Endpoint de métricas para Prometheus"""
    return Response(content=get_metrics(), media_type="text/plain")

@app.get("/health")
async def health_check():
    """Health check detallado"""
    return {
        "status": "healthy",
        "version": "4.0.0",
        "redis": cache.enabled,
        "mongodb_catalogo": db_catalogo is not None,
        "mongodb_social": db_social is not None,
        "embeddings_model": recommender.model is not None,
        "local_tryon": local_tryon.enabled,
        "circuit_breakers": get_breaker_stats(),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/stats")
async def get_stats():
    """Estadísticas del servicio"""
    return {
        "prompt_stats": prompt_manager.get_stats(),
        "circuit_breakers": get_breaker_stats(),
        "cache_enabled": cache.enabled,
        "embeddings_cached": len(recommender.product_embeddings)
    }

@app.get("/salud")
async def verificar_salud():
    """Endpoint de salud legacy"""
    productos_count = len(await obtener_productos_db())
    
    return {
        "estado": "activo",
        "servicio": "inteligencia-artificial-mejorado",
        "version": "4.0.0",
        "mejoras": [
            "Redis Cache",
            "Embeddings Semánticos",
            "Circuit Breaker",
            "Prometheus Metrics",
            "Modelo Local Try-On",
            "Queue Asíncrono",
            "Prompts Dinámicos"
        ],
        "mongodb_catalogo_conectado": db_catalogo is not None,
        "mongodb_social_conectado": db_social is not None,
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "productos_disponibles": productos_count,
            "embeddings_cacheados": len(recommender.product_embeddings)
        }
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3007))
    print(f"🚀 AI Service v4.0 Mejorado iniciando en puerto {puerto}")
    uvicorn.run(
        "main_improved:app",
        host="0.0.0.0",
        port=puerto,
        reload=os.getenv("ENTORNO") == "desarrollo"
    )
