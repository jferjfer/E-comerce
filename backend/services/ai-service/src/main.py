from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from openai import OpenAI
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
from datetime import datetime

app = FastAPI(
    title="Servicio de IA Unificado",
    description="API completa para recomendaciones, análisis de estilo y chat con IA",
    version="3.0.0"
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
    
    # Conectar a MongoDB Catálogo
    mongodb_catalog_uri = os.getenv('MONGODB_CATALOG_URI', 'mongodb+srv://Vercel-Admin-catalogo:oTXaV4jaA4E5Qi4C@catalogo.eocsgaj.mongodb.net/?retryWrites=true&w=majority')
    try:
        mongo_client_catalogo = AsyncIOMotorClient(mongodb_catalog_uri)
        db_catalogo = mongo_client_catalogo['catalogo']
        count = await db_catalogo.productos.count_documents({})
        print(f"✅ AI Service conectado a MongoDB Catálogo ({count} productos)")
    except Exception as e:
        print(f"❌ Error conectando a MongoDB Catálogo: {e}")
        db_catalogo = None
    
    # Conectar a MongoDB Social
    mongodb_social_uri = os.getenv('MONGODB_SOCIAL_URI', 'mongodb+srv://Vercel-Admin-socialservice:fA5shIvwxTGbAt1P@socialservice.78vidp7.mongodb.net/?retryWrites=true&w=majority')
    try:
        mongo_client_social = AsyncIOMotorClient(mongodb_social_uri)
        db_social = mongo_client_social['socialservice']
        count = await db_social.resenas.count_documents({})
        print(f"✅ AI Service conectado a MongoDB Social ({count} reseñas)")
    except Exception as e:
        print(f"❌ Error conectando a MongoDB Social: {e}")
        db_social = None

async def obtener_productos_db():
    """Obtener todos los productos de MongoDB con categorías y colores"""
    if db_catalogo is None:
        return []
    try:
        productos = await db_catalogo.productos.find({}).limit(100).to_list(length=100)
        for p in productos:
            if '_id' in p:
                del p['_id']
        return productos
    except:
        return []

async def obtener_categorias_db():
    """Obtener todas las categorías desde productos"""
    if db_catalogo is None:
        return []
    try:
        # Obtener categorías únicas de productos
        productos = await db_catalogo.productos.find({}, {"categoria": 1}).limit(100).to_list(length=100)
        categorias_set = set()
        for p in productos:
            if 'categoria' in p:
                categorias_set.add(p['categoria'])
        return sorted(list(categorias_set))
    except:
        return []

async def obtener_colores_db():
    """Obtener todos los colores disponibles de productos"""
    if db_catalogo is None:
        return []
    try:
        # Obtener colores únicos de todos los productos
        productos = await db_catalogo.productos.find({}, {"colores": 1}).to_list(length=200)
        colores_set = set()
        for p in productos:
            if 'colores' in p and isinstance(p['colores'], list):
                colores_set.update(p['colores'])
        return sorted(list(colores_set))
    except:
        return []

async def obtener_resenas_db(producto_id: str = None):
    """Obtener reseñas de productos"""
    if db_social is None:
        return []
    try:
        query = {"producto_id": producto_id} if producto_id else {}
        resenas = await db_social.resenas.find(query).limit(50).to_list(length=50)
        for r in resenas:
            if '_id' in r:
                del r['_id']
        return resenas
    except:
        return []

async def obtener_contexto_completo():
    """Obtener contexto completo: productos, categorías, colores, cupones, campañas"""
    # Obtener datos en paralelo para mayor velocidad
    import asyncio
    
    productos_task = obtener_productos_db()
    categorias_task = obtener_categorias_db()
    colores_task = obtener_colores_db()
    
    productos, categorias, colores = await asyncio.gather(
        productos_task, categorias_task, colores_task,
        return_exceptions=True
    )
    
    # Manejar excepciones
    if isinstance(productos, Exception):
        productos = []
    if isinstance(categorias, Exception):
        categorias = []
    if isinstance(colores, Exception):
        colores = []
    
    # Obtener cupones y campañas desde marketing service (con timeout corto)
    cupones = []
    campanas = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client_http:
            # Cupones
            try:
                response = await client_http.get('http://marketing-service:3006/api/cupones')
                if response.status_code == 200:
                    cupones = response.json().get('cupones', [])
            except:
                pass
            
            # Campañas
            try:
                response = await client_http.get('http://marketing-service:3006/api/campanas')
                if response.status_code == 200:
                    campanas = response.json().get('campanas', [])
            except:
                pass
    except Exception as e:
        print(f"⚠️ Error obteniendo datos de marketing: {e}")
    
    contexto = {
        'productos': productos[:30],
        'total_productos': len(productos),
        'categorias': categorias,
        'colores_disponibles': colores,
        'cupones_activos': [c for c in cupones if c.get('activo', True)],
        'campanas_activas': [c for c in campanas if c.get('activa', True)]
    }
    
    return contexto

# Modelos de datos
class RecomendacionRequest(BaseModel):
    usuario_id: Optional[str] = None
    productos_vistos: Optional[List[str]] = []
    preferencias: Optional[dict] = {}
    categoria: Optional[str] = None
    ocasion: Optional[str] = None
    limite: int = 5

class EstiloRequest(BaseModel):
    descripcion: str
    categoria: Optional[str] = None

class ChatRequest(BaseModel):
    mensaje: str
    historial: Optional[List[dict]] = []

class PerfilUsuario(BaseModel):
    usuario_id: str
    estilo_preferido: str
    colores_favoritos: List[str]
    talla: str
    presupuesto_max: Optional[float] = None

# System prompt para mantener contexto
SYSTEM_PROMPT = """Eres un asesor de moda personal experto para la tienda 'Estilo y Moda'.

REGLAS ESTRICTAS:
1. SOLO respondes sobre moda, ropa, accesorios, estilo y compras
2. Si preguntan algo fuera de moda, responde: "Solo puedo ayudarte con temas de moda y compras"
3. Habla de forma NATURAL, cálida y profesional
4. Describe productos por nombre, color y características
5. NUNCA uses paréntesis con IDs como "(ID: 1)" o "(ID: 5)"
6. Al final, en línea separada: PRODUCTOS_RECOMENDADOS: [id1, id2, id3]

Ejemplo CORRECTO:
"Para una boda te recomiendo nuestro elegante vestido negro de corte clásico, ideal para eventos nocturnos. También tenemos un hermoso vestido cóctel en rojo que hace una declaración sofisticada.

PRODUCTOS_RECOMENDADOS: [1, 11]"

Ejemplo INCORRECTO:
"Vestido Elegante Negro (ID: 1) perfecto para bodas"
"Te recomiendo el Vestido Cóctel Rojo (ID: 11)"

Los productos se mostrarán automáticamente con imágenes abajo."""

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await conectar_mongodb()

@app.on_event("shutdown")
async def shutdown_event():
    if mongo_client_catalogo:
        mongo_client_catalogo.close()
    if mongo_client_social:
        mongo_client_social.close()

# ============================================
# ENDPOINTS DE CHAT
# ============================================

@app.post("/api/chat")
async def chat_asistente(request: ChatRequest):
    """Chat con asistente de moda que recomienda productos reales"""
    try:
        # Obtener contexto de la base de datos
        contexto = await obtener_contexto_completo()
        
        # Crear lista de productos REALES de MongoDB (sin mostrar en prompt)
        productos_info = "\n".join([
            f"ID={p.get('id')}, Nombre={p.get('nombre')}, Categoría={p.get('categoria')}, Precio=${p.get('precio'):,.0f}, Colores={', '.join(p.get('colores', []))}"
            for p in contexto['productos'] if p.get('en_stock', True)
        ])
        
        # Información de categorías
        categorias_info = ", ".join(contexto['categorias']) if contexto['categorias'] else "Cargando..."
        
        # Información de colores disponibles
        colores_info = ", ".join(contexto['colores_disponibles'][:20])
        
        # Información de cupones activos
        cupones_info = "\n".join([
            f"- Código: {c.get('codigo')}, Descuento: {c.get('descuento')}{'%' if c.get('tipo') == 'porcentaje' else ' COP'}, Válido hasta: {c.get('fecha_expiracion', 'Sin límite')}"
            for c in contexto['cupones_activos']
        ])
        
        # Información de campañas activas
        campanas_info = "\n".join([
            f"- {c.get('nombre')}: {c.get('descripcion', 'Sin descripción')} (Descuento: {c.get('descuento', 0)}%)"
            for c in contexto['campanas_activas']
        ])
        
        system_prompt_con_datos = f"""{SYSTEM_PROMPT}

DATOS DE LA TIENDA:

CATEGORÍAS: {categorias_info if categorias_info else 'Cargando...'}

COLORES: {colores_info if colores_info else 'Cargando...'}

PRODUCTOS DISPONIBLES ({contexto['total_productos']} total):
{productos_info}

CUPONES ACTIVOS:
{cupones_info if cupones_info else 'Sin cupones activos'}

CAMPAÑAS:
{campanas_info if campanas_info else 'Sin campañas activas'}

IMPORTANTE: Describe productos de forma natural sin mencionar IDs en el texto. Al final incluye PRODUCTOS_RECOMENDADOS: [ids]"""
        
        # Construir mensajes con historial
        mensajes = [{'role': 'system', 'content': system_prompt_con_datos}]
        
        # Agregar historial (máximo 10 mensajes)
        if request.historial:
            mensajes.extend(request.historial[-10:])
        
        # Agregar mensaje actual
        mensajes.append({'role': 'user', 'content': request.mensaje})
        
        response = client.chat.completions.create(
            model='deepseek-chat',
            messages=mensajes,
            temperature=0.7,
            max_tokens=600
        )
        
        respuesta_completa = response.choices[0].message.content
        print(f"✅ DeepSeek respondió: {respuesta_completa[:100]}...")
        
        # Limpiar menciones de IDs del texto de forma agresiva
        import re
        # Eliminar (ID: X), [ID: X], (ID:X), etc.
        respuesta_completa = re.sub(r'\s*[\(\[]ID:\s*\d+[\)\]]', '', respuesta_completa, flags=re.IGNORECASE)
        # Eliminar ** (ID: X)** o similares
        respuesta_completa = re.sub(r'\*\*\s*[\(\[]ID:\s*\d+[\)\]]\s*\*\*', '', respuesta_completa, flags=re.IGNORECASE)
        
        # Extraer productos recomendados si existen
        productos_recomendados = []
        respuesta_limpia = respuesta_completa
        
        if "PRODUCTOS_RECOMENDADOS:" in respuesta_completa:
            partes = respuesta_completa.split("PRODUCTOS_RECOMENDADOS:")
            respuesta_limpia = partes[0].strip()
            
            # Extraer IDs entre corchetes
            import re
            match = re.search(r'\[([^\]]+)\]', partes[1])
            if match:
                ids_str = match.group(1)
                productos_recomendados = [id.strip().strip('"').strip("'") for id in ids_str.split(',')]
                print(f"🎯 Productos recomendados: {productos_recomendados}")
        else:
            print("⚠️ No se encontraron productos recomendados en la respuesta")
            # Si la IA mencionó productos pero no usó el formato, buscar IDs en el texto
            import re
            ids_encontrados = re.findall(r'ID:\s*(\d+)', respuesta_completa)
            if ids_encontrados:
                productos_recomendados = ids_encontrados[:3]
                print(f"🔍 IDs extraídos del texto: {productos_recomendados}")
        
        return {
            "respuesta": respuesta_limpia,
            "productos_recomendados": productos_recomendados,
            "en_contexto": True,
            "productos_disponibles": contexto['total_productos']
        }
        
    except Exception as e:
        print(f"❌ Error IA: {e}")
        import traceback
        traceback.print_exc()
        return {
            "respuesta": "Lo siento, estoy teniendo problemas técnicos. ¿Puedo ayudarte con algo sobre moda o productos?",
            "productos_recomendados": [],
            "en_contexto": True,
            "error": str(e)
        }

# ============================================
# ENDPOINTS DE RECOMENDACIONES
# ============================================

@app.post("/api/recomendaciones")
async def obtener_recomendaciones(request: RecomendacionRequest):
    """Recomendaciones básicas con IA"""
    try:
        prompt = f"""Basado en:
- Productos vistos: {request.productos_vistos}
- Preferencias: {request.preferencias}

Recomienda 3 productos de moda con justificación. Responde en JSON:
{{
  "recomendaciones": [
    {{"producto_id": "id", "puntuacion": 0.95, "razon": "texto"}}
  ]
}}"""
        
        response = client.chat.completions.create(
            model='deepseek-chat',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.7
        )
        
        import json
        resultado = json.loads(response.choices[0].message.content)
        return resultado
        
    except Exception as e:
        print(f"❌ Error IA: {e}")
        return {
            "recomendaciones": [
                {"producto_id": "prod_001", "puntuacion": 0.95, "razon": "Basado en tu historial"},
                {"producto_id": "prod_002", "puntuacion": 0.87, "razon": "Productos similares"}
            ]
        }

@app.post("/api/recomendaciones/personalizada")
async def obtener_recomendaciones_personalizadas(request: RecomendacionRequest):
    """Recomendaciones personalizadas basadas en perfil"""
    print(f"🤖 Generando recomendaciones para usuario {request.usuario_id}")
    
    # Perfil por defecto
    perfil = {
        "estilo_preferido": "casual",
        "colores_favoritos": ["Negro", "Blanco", "Azul"],
        "talla": "M"
    }
    
    # Intentar obtener perfil desde MongoDB
    if db_catalogo is not None:
        try:
            perfil_doc = await db_catalogo.perfiles.find_one({"usuario_id": request.usuario_id})
            if perfil_doc:
                perfil = perfil_doc
        except:
            pass
    
    # Obtener productos
    productos = await obtener_productos_db()
    
    if request.categoria:
        productos = [p for p in productos if p.get('categoria', '').lower() == request.categoria.lower()]
    
    # Algoritmo de recomendación
    productos_recomendados = []
    
    for producto in productos:
        score = 0
        
        # Compatibilidad de estilo
        if producto.get("estilo") == perfil.get("estilo_preferido"):
            score += 30
        
        # Compatibilidad de colores
        colores_comunes = set(producto.get("colores", [])) & set(perfil.get("colores_favoritos", []))
        score += len(colores_comunes) * 10
        
        # Popularidad
        score += producto.get("calificacion", 0) * 5
        
        producto["score_recomendacion"] = round(score, 2)
        productos_recomendados.append(producto)
    
    # Ordenar por score y limitar resultados
    productos_recomendados.sort(key=lambda x: x["score_recomendacion"], reverse=True)
    productos_recomendados = productos_recomendados[:request.limite]
    
    return {
        "recomendaciones": productos_recomendados,
        "total": len(productos_recomendados),
        "algoritmo": "IA_personalizada_v3",
        "perfil_usado": perfil
    }

@app.get("/api/recomendaciones/tendencias")
async def obtener_tendencias():
    """Obtiene tendencias de moda actuales"""
    print("📈 Obteniendo tendencias de moda")
    
    tendencias = [
        {
            "id": "1",
            "nombre": "Moda Sostenible",
            "descripcion": "Productos eco-friendly y sostenibles",
            "productos_relacionados": ["1", "2", "3"],
            "crecimiento": 45.2,
            "popularidad": 92
        },
        {
            "id": "2", 
            "nombre": "Oficina Moderna",
            "descripcion": "Looks profesionales para el trabajo híbrido",
            "productos_relacionados": ["1", "4"],
            "crecimiento": 32.8,
            "popularidad": 88
        },
        {
            "id": "3",
            "nombre": "Casual Chic",
            "descripcion": "Elegancia relajada para el día a día",
            "productos_relacionados": ["2", "3"],
            "crecimiento": 28.5,
            "popularidad": 85
        }
    ]
    
    return {"tendencias": tendencias}

# ============================================
# ENDPOINTS DE ESTILOS
# ============================================

@app.post("/api/estilos")
async def analizar_estilos(request: EstiloRequest):
    """Analiza estilos de moda"""
    try:
        prompt = f"""Analiza este estilo de moda:
Descripción: {request.descripcion}
Categoría: {request.categoria}

Identifica 2 estilos principales con confianza y productos sugeridos. Responde en JSON:
{{
  "estilos": [
    {{"nombre": "Estilo", "confianza": 0.85, "productos_sugeridos": ["id1", "id2"]}}
  ]
}}"""
        
        response = client.chat.completions.create(
            model='deepseek-chat',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.7
        )
        
        import json
        resultado = json.loads(response.choices[0].message.content)
        return resultado
        
    except Exception as e:
        print(f"❌ Error IA: {e}")
        return {
            "estilos": [
                {"nombre": "Casual Moderno", "confianza": 0.85, "productos_sugeridos": ["prod_002", "prod_003"]},
                {"nombre": "Elegante Clásico", "confianza": 0.78, "productos_sugeridos": ["prod_001", "prod_004"]}
            ]
        }

@app.get("/api/estilos/sugerencias")
async def obtener_sugerencias_estilo():
    """Obtiene sugerencias de estilos disponibles"""
    print("🎨 Obteniendo sugerencias de estilo")
    
    estilos = [
        {
            "id": "casual",
            "nombre": "Casual",
            "descripcion": "Cómodo y relajado para el día a día",
            "colores_recomendados": ["Azul", "Blanco", "Gris", "Beige"],
            "productos_ejemplo": ["2", "3"]
        },
        {
            "id": "profesional",
            "nombre": "Profesional",
            "descripcion": "Elegante y formal para el trabajo",
            "colores_recomendados": ["Negro", "Azul marino", "Gris oscuro", "Blanco"],
            "productos_ejemplo": ["1", "4"]
        },
        {
            "id": "versatil",
            "nombre": "Versátil",
            "descripcion": "Adaptable a múltiples ocasiones",
            "colores_recomendados": ["Negro", "Gris", "Azul", "Blanco"],
            "productos_ejemplo": ["3", "1"]
        }
    ]
    
    return {"estilos": estilos}

# ============================================
# ENDPOINTS DE PERFIL
# ============================================

@app.post("/api/perfil/actualizar")
async def actualizar_perfil_usuario(perfil: PerfilUsuario):
    """Actualiza el perfil de usuario"""
    print(f"👤 Actualizando perfil para usuario {perfil.usuario_id}")
    
    perfil_data = {
        "usuario_id": perfil.usuario_id,
        "estilo_preferido": perfil.estilo_preferido,
        "colores_favoritos": perfil.colores_favoritos,
        "talla": perfil.talla,
        "presupuesto_max": perfil.presupuesto_max,
        "fecha_actualizacion": datetime.now().isoformat()
    }
    
    # Guardar en memoria
    perfiles_usuarios[perfil.usuario_id] = perfil_data
    
    # Intentar guardar en MongoDB
    if db_catalogo is not None:
        try:
            await db_catalogo.perfiles.update_one(
                {"usuario_id": perfil.usuario_id},
                {"$set": perfil_data},
                upsert=True
            )
        except:
            pass
    
    return {
        "mensaje": "Perfil actualizado exitosamente",
        "perfil": perfil_data
    }

@app.get("/api/perfil/{usuario_id}")
async def obtener_perfil_usuario(usuario_id: str):
    """Obtiene el perfil de un usuario"""
    
    # Intentar desde MongoDB
    if db_catalogo is not None:
        try:
            perfil = await db_catalogo.perfiles.find_one({"usuario_id": usuario_id})
            if perfil:
                if "_id" in perfil:
                    del perfil["_id"]
                return {"perfil": perfil}
        except:
            pass
    
    # Usar memoria
    perfil = perfiles_usuarios.get(usuario_id)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    return {"perfil": perfil}

@app.post("/api/analisis/compatibilidad")
async def analizar_compatibilidad(data: dict):
    """Analiza la compatibilidad entre productos y el estilo del usuario"""
    usuario_id = data.get("usuario_id")
    productos_ids = data.get("productos_ids", [])
    
    print(f"🔍 Analizando compatibilidad para usuario {usuario_id}")
    
    perfil = perfiles_usuarios.get(usuario_id, {
        "estilo_preferido": "casual",
        "colores_favoritos": ["Negro", "Blanco"]
    })
    
    productos = await obtener_productos_db()
    analisis = []
    
    for producto_id in productos_ids:
        producto = next((p for p in productos if p.get("id") == producto_id), None)
        if producto:
            compatibilidad = 85 + (hash(producto_id) % 15)  # Simulación determinística
            
            analisis.append({
                "producto_id": producto_id,
                "nombre": producto.get("nombre", "Producto"),
                "compatibilidad": compatibilidad,
                "razones": [
                    f"Coincide con tu estilo {perfil['estilo_preferido']}",
                    "Colores que te favorecen",
                    "Alta calidad y durabilidad"
                ]
            })
    
    return {
        "analisis": analisis,
        "recomendacion_general": "Excelente selección para tu estilo personal"
    }

# ============================================
# ENDPOINT DE SALUD
# ============================================

@app.get("/salud")
async def verificar_salud():
    productos_count = 0
    categorias_count = 0
    colores_count = 0
    resenas_count = 0
    
    if db_catalogo is not None:
        try:
            productos_count = len(await obtener_productos_db())
            categorias_count = len(await obtener_categorias_db())
            colores_count = len(await obtener_colores_db())
        except:
            pass
    
    if db_social is not None:
        try:
            resenas_count = len(await obtener_resenas_db())
        except:
            pass
    
    return {
        "estado": "activo",
        "servicio": "inteligencia-artificial-unificado",
        "version": "3.1.0",
        "openai_configurado": bool(os.getenv('AI_GATEWAY_API_KEY')),
        "mongodb_catalogo_conectado": db_catalogo is not None,
        "mongodb_social_conectado": db_social is not None,
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "perfiles_activos": len(perfiles_usuarios),
            "productos_disponibles": productos_count,
            "categorias_disponibles": categorias_count,
            "colores_disponibles": colores_count,
            "resenas_disponibles": resenas_count
        }
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3007))
    print(f"🚀 AI Service Unificado v3.0 iniciando en puerto {puerto}")
    uvicorn.run(
        "main_unificado:app",
        host="0.0.0.0",
        port=puerto,
        reload=os.getenv("ENTORNO") == "desarrollo"
    )
