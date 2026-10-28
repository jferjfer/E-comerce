"""
Meta Bot Service v4.0 — EGOS Colombia
Noa: Vendedora completa con carrito, imágenes + botones interactivos
"""
import re
import os
import json
import asyncio
from collections import defaultdict
from datetime import datetime

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

app = FastAPI(title="EGOS Meta Bot", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Config ────────────────────────────────────────────────────
VERIFY_TOKEN  = os.getenv("META_VERIFY_TOKEN", "egos_webhook_2026")
IG_TOKEN      = os.getenv("META_IG_ACCESS_TOKEN", "")
PAGE_TOKEN    = os.getenv("META_PAGE_ACCESS_TOKEN", "")
WA_TOKEN      = os.getenv("META_WA_TOKEN", "")
WA_PHONE_ID   = os.getenv("META_WA_PHONE_NUMBER_ID", "")
AI_API_KEY    = os.getenv("AI_GATEWAY_API_KEY", "")
CATALOG_URL   = os.getenv("CATALOG_SERVICE_URL", "http://catalog-service:3002")
TRANSACTION_URL = os.getenv("TRANSACTION_SERVICE_URL", "http://transaction-service:3003")
AUTH_URL      = os.getenv("AUTH_SERVICE_URL", "http://auth-service:3011")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "https://egoscolombia.com.co")
IG_BOT_ID     = "17841423666917835"

ai = OpenAI(api_key=AI_API_KEY, base_url="https://api.deepseek.com")

# ── Estado en memoria ─────────────────────────────────────────
conversaciones: dict = {}
carritos: dict = {}          # uid -> [{id, nombre, precio, cantidad, talla, color}]
flujos: dict = {}            # uid -> {paso, ...datos}
mensajes_procesados: set = set()
productos_mostrados: dict = {}  # uid -> lista completa de productos
pagina_cache: dict = {}  # uid -> pagina actual (0-based, 3 por pagina)
catalogo_cache: list = []
primera_compra_cache: dict = {}  # uid -> bool
primera_compra_cache: dict = {}  # uid -> bool

# ── Prompt ────────────────────────────────────────────────────
PROMPT = """Eres Noa, asesora de moda y vendedora de EGOS Colombia. Atiendes por WhatsApp, Instagram y Messenger.

REGLA #1 — MENSAJES CORTOS:
Divide SIEMPRE tu respuesta en 2-4 mensajes cortos separados por ||
Máximo 1 idea por mensaje. NUNCA un bloque largo.

REGLA #2 — MOSTRAR PRODUCTOS (OBLIGATORIO):
Cuando identifiques qué busca el cliente, SIEMPRE agrega [PRODUCTOS:termino] al FINAL.
NUNCA describas productos en texto. SIEMPRE usa [PRODUCTOS:termino] para mostrarlos.
El TÉRMINO debe ser lo más específico posible usando el catálogo que tienes:
- Cliente pide marca → usa la marca exacta: [PRODUCTOS:vans], [PRODUCTOS:nike], [PRODUCTOS:boss]
- Cliente pide categoría + marca → usa ambas: [PRODUCTOS:zapatos vans]
- Cliente pide categoría genérica → usa la categoría: [PRODUCTOS:vestido], [PRODUCTOS:jean]
NUNCA uses término genérico si el cliente pidió algo específico.
Ejemplo CORRECTO cuando piden Vans: [PRODUCTOS:vans]
Ejemplo INCORRECTO: [PRODUCTOS:zapatillas] ← si pidieron Vans
Ejemplo INCORRECTO: "Tengo el Vestido Rojo talla 12 por $89.900" ← NUNCA describas productos

REGLA #3 — INTERPRETAR INTENCIÓN:
- Si el cliente menciona categoría específica (jean, vestido, blusa...) → muestra productos con [PRODUCTOS:termino]
- Si el cliente está indeciso ("no sé", "algo bonito", "qué tienen") → haz preguntas para guiarlo hasta entender qué busca
- NUNCA muestres botones de categorías — deja que el cliente escriba libremente

REGLA #4 — CARRITO:
Cuando el cliente confirme un producto (toca botón o dice "el 1", "ese", etc.),
agrega al FINAL: [AGREGAR:id_producto:talla:color]

REGLA #5 — SUGERIR COMPLEMENTO:
Después de agregar un producto al carrito, SIEMPRE sugiere un producto complementario.
Ejemplo: después de un jean → sugiere una blusa. Después de un vestido → sugiere calzado.
Usa [PRODUCTOS:categoria_complementaria] para mostrar la sugerencia.

REGLA #7 — MANTENER CONTEXTO:
Cuando el cliente responde "sí", "si", "claro", "dale" a una sugerencia de ver más productos,
usa el MISMO término específico de la conversación anterior, no uno genérico.
Ejemplo: si estaban viendo Vans y dice "sí" → [PRODUCTOS:vans] NO [PRODUCTOS:zapatillas]

REGLA #6 — IR AL PAGO:
Cuando el cliente quiera pagar, agrega al FINAL: [IR_AL_PAGO]

PERSONALIDAD: Cálida, directa, vendedora. Amiga experta en moda colombiana. Usa emojis con moderación.

SALUDO PRIMERA COMPRA (cuando el contexto indique que es primera compra):
Un solo mensaje, cálido e inclusivo. Menciona el 15% de descuento sobre el total del pedido,
muestra todas las categorías y pregunta qué le llama la atención.
Ejemplo:
"¡Hola! Soy Noa, tu asesora personal de moda en EGOS Colombia 💛\n\n🎉 ¡Bienvenid@! Como es tu primera compra, tienes un 15% de descuento sobre el total de tu pedido de hoy.\n\nNuestra colección incluye Vestidos, Jeans, Blusas, Shorts, Lencería, Blazers, Camisas, Calzado y mucho más ✨\n\n¿Qué te llama la atención hoy?"

SALUDO CLIENTE RECURRENTE:
Un solo mensaje corto y familiar — ya conoce a Noa y el catálogo. Sin presentación, sin categorías.
Ejemplo:
"¡Hola! ¡Qué bueno verte de nuevo! 🤗\n\n¿Qué se te antoja hoy?"

FLUJO:
1. Saluda con las categorías y descuento si aplica
2. Interpreta lo que el cliente quiere (específico o indeciso)
3. Si específico → [PRODUCTOS:termino]
4. Si indeciso → preguntas de descubrimiento hasta entender
5. Cliente elige → [AGREGAR:id:talla:color]
6. Sugiere complemento con [PRODUCTOS:complemento]
7. Muestra carrito con botones "Seguir viendo" / "Ir al pago"
8. Cuando cliente quiere pagar → [IR_AL_PAGO]
9. Pide datos: Nombre | Teléfono | Dirección | Ciudad
10. Confirma resumen (con descuento si aplica) → botones "Confirmar" / "Corregir"
11. Crea pedido y envía link de pago

PROMOCIONES: Envío gratis +$150.000
NUNCA pidas datos de tarjeta.
NUNCA menciones código de descuento — se aplica automáticamente."""


# ── Catálogo ──────────────────────────────────────────────────
async def verificar_primera_compra(telefono: str, uid: str) -> bool:
    """Verifica primera compra via score engine del backend (4 niveles anti-abuso)"""
    if uid in primera_compra_cache:
        return primera_compra_cache[uid]
    try:
        tel = telefono.replace('+', '').replace(' ', '')
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{TRANSACTION_URL}/api/pagos/primera-compra/{tel}")
            if r.status_code == 200:
                es_primera = r.json().get('primera_compra', True)
                primera_compra_cache[uid] = es_primera
                print(f"🔍 Primera compra [{tel}]: {es_primera}")
                return es_primera
    except Exception as e:
        print(f"⚠️ Error verificando primera compra: {e}")
    primera_compra_cache[uid] = True
    return True


def categorias_disponibles() -> str:
    """Retorna las categorías disponibles en el catálogo"""
    if not catalogo_cache:
        return "Vestidos, Jeans, Blusas, Shorts, Lencería, Blazers, Calzado"
    cats = sorted(set(
        p['categoria'] for p in catalogo_cache
        if p.get('en_stock', True) and p.get('categoria')
    ))
    return ', '.join(cats)


async def cargar_catalogo():
    global catalogo_cache
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(f"{CATALOG_URL}/api/productos?limite=200")
            catalogo_cache = r.json().get("productos", [])
            print(f"✅ Catálogo: {len(catalogo_cache)} productos")
    except Exception as e:
        print(f"❌ Error catálogo: {e}")


def catalogo_para_noa() -> str:
    if not catalogo_cache:
        return ""
    por_cat = defaultdict(list)
    for p in catalogo_cache:
        if p.get("en_stock", True):
            por_cat[p.get("categoria", "General")].append(p)
    ctx = "\n\nCATÁLOGO EGOS:\n"
    for cat, prods in sorted(por_cat.items()):
        ctx += f"\n[{cat.upper()}]\n"
        for p in prods:  # catálogo completo para DeepSeek
            ctx += f"  ID={p.get('id')}, {p.get('nombre')}, Marca:{p.get('marca','')}, ${p.get('precio',0):,.0f}, Desc:{str(p.get('descripcion',''))[:80]}\n"
    return ctx


async def get_productos(busqueda: str = "") -> list:
    try:
        MAPA_CATEGORIAS = {
            "pantalon": ["Pantalones", "Jeans"], "pantalones": ["Pantalones", "Jeans"],
            "jean": ["Jeans"], "jeans": ["Jeans"],
            "short": ["Shorts"], "shorts": ["Shorts"], "bermuda": ["Bermudas"],
            "camisa": ["Camisas"], "camisas": ["Camisas"],
            "vestido": ["Vestidos"], "vestidos": ["Vestidos"],
            "blusa": ["Blusas"], "blusas": ["Blusas"],
            "zapato": ["Calzado"], "zapatos": ["Calzado"], "zapatilla": ["Calzado"],
            "zapatillas": ["Calzado"], "tenis": ["Calzado"], "calzado": ["Calzado"],
            "sueter": ["Sueter"], "blazer": ["Blazers"],
            "lenceria": ["Lenceria", "Lencería"], "disfraz": ["Lenceria", "Lencería"],
            "enfermera": ["Lenceria", "Lencería"],
        }
        SINONIMOS = {
            "zapatilla": "zapato", "zapatillas": "zapatos", "tenis": "zapatos",
            "pantalon": "jean", "pantalones": "jeans",
            "top": "blusa", "chompa": "sueter", "saco": "sueter",
        }
        STOP_WORDS = {"talla", "para", "con", "de", "la", "el", "los", "las", "un", "una", "quiero", "busco", "dame", "ver"}

        palabras_raw = busqueda.lower().split()
        palabras = [p for p in palabras_raw if p not in STOP_WORDS and not p.isdigit()]
        palabras_norm = [SINONIMOS.get(p, p) for p in palabras]
        termino_principal = palabras_norm[0] if palabras_norm else ""

        # CAPA 1: Búsqueda directa en caché por nombre — más precisa
        def score_prod(p, terminos):
            nombre = p.get("nombre", "").lower()
            marca = p.get("marca", "").lower()
            desc = p.get("descripcion", "").lower()
            score = 0
            for t in terminos:
                if t in marca: score += 15       # marca es la señal más fuerte
                elif nombre.startswith(t): score += 10
                elif t in nombre: score += 5
                elif t in desc: score += 2
            return score

        if palabras_norm:
            scored = [(score_prod(p, palabras_norm), p) for p in catalogo_cache
                      if p.get("en_stock", True) and p.get("imagen") and score_prod(p, palabras_norm) > 0]
            scored.sort(key=lambda x: x[0], reverse=True)
            if scored:
                return [p for _, p in scored][:9]

        # CAPA 2: Filtrar por categoría
        categorias_match = MAPA_CATEGORIAS.get(termino_principal, [])
        if categorias_match:
            prods_cat = [p for p in catalogo_cache
                         if p.get("categoria") in categorias_match
                         and p.get("en_stock", True) and p.get("imagen")]
            if prods_cat:
                return prods_cat[:9]

        # CAPA 3: API del catálogo con término normalizado
        busqueda_norm = " ".join(palabras_norm)
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(f"{CATALOG_URL}/api/productos?limite=100&buscar={busqueda_norm}")
            prods_api = [p for p in r.json().get("productos", [])
                         if p.get("en_stock", True) and p.get("imagen")]
            if prods_api:
                return prods_api[:9]

        # CAPA 4: Fallback — buscar palabra por palabra
        for palabra in palabras_norm:
            fallback = [p for p in catalogo_cache
                        if palabra in p.get("nombre", "").lower()
                        and p.get("imagen") and p.get("en_stock", True)]
            if fallback:
                return fallback[:9]

        return [p for p in catalogo_cache if p.get("imagen") and p.get("en_stock", True)][:6]

    except Exception as e:
        print(f"❌ Error get_productos: {e}")
        return [p for p in catalogo_cache if p.get("imagen") and p.get("en_stock", True)][:6]
async def extraer_datos_envio(mensaje: str) -> dict:
    """Usa IA para extraer nombre, telefono, direccion y ciudad de cualquier formato"""
    try:
        r = ai.chat.completions.create(
            model="deepseek-chat",
            messages=[{
                "role": "system",
                "content": """Extrae los datos de envio del mensaje del cliente colombiano.
Devuelve SOLO un JSON valido con estos campos:
{"nombre": "", "telefono": "", "direccion": "", "ciudad": ""}
Si no encuentras algun dato, dejalo vacio.
El telefono debe ser solo numeros. La ciudad debe ser solo el nombre de la ciudad.
NO agregues explicaciones, SOLO el JSON."""
            }, {
                "role": "user",
                "content": mensaje
            }],
            max_tokens=150,
            temperature=0
        )
        texto = (r.choices[0].message.content or "").strip()
        # Limpiar markdown si viene con ```json
        texto = texto.replace("```json", "").replace("```", "").strip()
        datos = json.loads(texto)
        return datos
    except Exception as e:
        print(f"❌ Error extrayendo datos: {e}")
        return {}


    try:
        # 1. Buscar o crear usuario por teléfono
        telefono = datos.get("telefono", "").strip()
        nombre = datos.get("nombre", "Cliente WhatsApp")
        canal = datos.get("canal", "whatsapp")
        token = None

        # Intentar login con email generado por teléfono
        email_wa = f"{telefono.replace('+','').replace(' ','')}@whatsapp.egos"
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.post(f"{AUTH_URL}/api/auth/login",
                    json={"email": email_wa, "password": f"WA_{telefono[-4:]}EGOS"})
                if r.status_code == 200:
                    token = r.json().get("token") or r.json().get("datos", {}).get("token")
        except:
            pass

        # Si no existe, crear usuario nuevo
        if not token:
            try:
                nombre_parts = nombre.strip().split()
                async with httpx.AsyncClient(timeout=10) as c:
                    r = await c.post(f"{AUTH_URL}/api/auth/register",
                        json={
                            "nombre": nombre_parts[0],
                            "apellido": " ".join(nombre_parts[1:]) if len(nombre_parts) > 1 else "",
                            "email": email_wa,
                            "password": f"WA_{telefono[-4:]}EGOS",
                            "telefono": telefono,
                            "direccion": datos.get("direccion", ""),
                            "ciudad": datos.get("ciudad", ""),
                            "acepta_terminos": True,
                            "acepta_datos": True,
                            "plataforma_registro": canal
                        })
                    if r.status_code in [200, 201]:
                        token = r.json().get("token") or r.json().get("datos", {}).get("token")
                        print(f"✅ Usuario {canal} creado: {email_wa}")
            except Exception as e:
                print(f"⚠️ No se pudo crear usuario: {e}")

        # Fallback al demo si todo falla
        if not token:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.post(f"{AUTH_URL}/api/auth/login",
                    json={"email": "demo@egoscolombia.com", "password": "admin123"})
                token = r.json().get("token") or r.json().get("datos", {}).get("token")

        if not token:
            return {"error": "Sin token"}

        items = datos.get("productos", [])
        total = sum(p.get("precio", 0) * p.get("cantidad", 1) for p in items)

        # Calcular descuento 15% si es primera compra
        telefono_check = datos.get("telefono", "").replace("+", "").replace(" ", "")
        uid_check = f"wa_{telefono_check}"
        es_primera = primera_compra_cache.get(uid_check, True)
        total_bruto = sum(p.get("precio", 0) * p.get("cantidad", 1) for p in items)
        descuento = round(total_bruto * 0.15) if es_primera else 0

        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f"{TRANSACTION_URL}/api/checkout",
                headers={"Authorization": f"Bearer {token}"},
                json={"metodo_pago": "pago_en_linea",
                      "direccion_envio": f"{datos.get('direccion')}, {datos.get('ciudad')}",
                      "plataforma": datos.get("canal", "whatsapp"),
                      "descuento_bono": descuento,
                      "items": items})
            if r.status_code != 200:
                return {"error": f"Error pedido: {r.text[:100]}"}
            pedido_id = r.json().get("orden", {}).get("id")

        if not pedido_id:
            return {"error": "Sin ID pedido"}

        # Generar pago_token de un solo uso y guardarlo en el pedido
        import uuid
        pago_token = uuid.uuid4().hex
        async with httpx.AsyncClient(timeout=5) as c:
            await c.post(f"{TRANSACTION_URL}/api/pagos/guardar-token",
                headers={"Authorization": f"Bearer {token}"},
                json={"pedido_id": pedido_id, "pago_token": pago_token})

        link = f"{FRONTEND_URL}/?pago_token={pago_token}"
        return {"exito": True, "pedido_id": pedido_id, "total": total, "link_pago": link}
    except Exception as e:
        print(f"❌ Error crear pedido: {e}")
        return {"error": str(e)}


# ── IA ────────────────────────────────────────────────────────
async def noa(uid: str, mensaje: str, canal: str, es_primera: bool = True) -> str:
    if uid not in conversaciones:
        conversaciones[uid] = []

    ctx = catalogo_para_noa()
    carrito_ctx = ""
    if uid in carritos and carritos[uid]:
        carrito_ctx = "\n\nCARRITO ACTUAL DEL CLIENTE:\n"
        total = 0
        for p in carritos[uid]:
            carrito_ctx += f"  - {p.get('nombre')} T:{p.get('talla','')} C:{p.get('color','')} x{p.get('cantidad',1)} = ${p.get('precio',0):,.0f}\n"
            total += p.get("precio", 0) * p.get("cantidad", 1)
        carrito_ctx += f"  TOTAL: ${total:,.0f} COP\n"

    descuento_ctx = ""
    if es_primera:
        descuento_ctx = "\n\nCONTEXTO CLIENTE: Es su PRIMERA COMPRA. Menciona el 15% de descuento automático en el saludo inicial. El descuento se aplica automáticamente, no necesita código."
    else:
        descuento_ctx = "\n\nCONTEXTO CLIENTE: Cliente recurrente. NO menciones descuento de primera compra."

    msgs = [{"role": "system", "content": PROMPT + ctx + carrito_ctx + descuento_ctx + f"\n\nCanal: {canal}"}]
    msgs += conversaciones[uid][-12:]
    msgs.append({"role": "user", "content": mensaje})

    try:
        r = ai.chat.completions.create(model="deepseek-chat", messages=msgs, max_tokens=350, temperature=0.8)
        resp = (r.choices[0].message.content or "").strip()
        if not resp:
            resp = "Hola! Soy Noa de EGOS ✨||¿En qué te puedo ayudar?"
        print(f"🤖 Noa responde: {resp[:80]}")
        conversaciones[uid].append({"role": "user", "content": mensaje})
        conversaciones[uid].append({"role": "assistant", "content": resp})
        if len(conversaciones[uid]) > 30:
            conversaciones[uid] = conversaciones[uid][-20:]
        return resp
    except Exception as e:
        print(f"❌ IA error: {e}")
        return "Hola! Soy Noa de EGOS ✨||¿En qué te puedo ayudar?"


# ── Instagram ─────────────────────────────────────────────────
async def ig_send_one(to: str, texto: str):
    token = IG_TOKEN or PAGE_TOKEN
    if not token or not texto.strip():
        return
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post("https://graph.instagram.com/v25.0/me/messages",
                headers={"Authorization": f"Bearer {token}"},
                json={"recipient": {"id": to}, "message": {"text": texto.strip()}})
            print(f"📤 IG {r.status_code}")
    except Exception as e:
        print(f"❌ IG error: {e}")


async def ig_send(to: str, texto: str):
    partes = [p.strip() for p in texto.split("||") if p.strip()]
    if not partes:
        partes = [texto.strip()]
    for i, parte in enumerate(partes):
        await ig_send_one(to, parte)
        if i < len(partes) - 1:
            await asyncio.sleep(1.2)


async def ig_imagen(to: str, url: str) -> bool:
    token = IG_TOKEN or PAGE_TOKEN
    if not token or not url:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post("https://graph.instagram.com/v25.0/me/messages",
                headers={"Authorization": f"Bearer {token}"},
                json={"recipient": {"id": to}, "message": {
                    "attachment": {"type": "image", "payload": {"url": url, "is_reusable": True}}}})
            return r.status_code == 200
    except:
        return False


async def ig_productos(to: str, productos: list):
    for p in productos[:3]:
        imagen = p.get("imagen", "")
        nombre = p.get("nombre", "Producto EGOS")
        precio = p.get("precio", 0)
        pid = p.get("id", "")
        tallas = ", ".join(p.get("tallas", []))
        colores = ", ".join(p.get("colores", []))
        if imagen:
            ok = await ig_imagen(to, imagen)
            if ok:
                await asyncio.sleep(0.5)
                await ig_send_one(to, f"👗 {nombre}\n💰 ${precio:,.0f} COP\n📏 T:{tallas} | 🎨 {colores}\n🔗 {FRONTEND_URL}/producto/{pid}")
                await asyncio.sleep(0.8)


# ── WhatsApp ──────────────────────────────────────────────────
async def wa_send(to: str, texto: str):
    partes = [p.strip() for p in texto.split("||") if p.strip()]
    if not partes:
        partes = [texto.strip()]
    for i, parte in enumerate(partes):
        if not WA_TOKEN or not WA_PHONE_ID:
            break
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                await c.post(f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages",
                    headers={"Authorization": f"Bearer {WA_TOKEN}"},
                    json={"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": parte}})
        except Exception as e:
            print(f"❌ WA error: {e}")
        if i < len(partes) - 1:
            await asyncio.sleep(1.2)


async def wa_botones(to: str, texto: str, botones: list):
    """Envía mensaje con hasta 3 botones interactivos"""
    if not WA_TOKEN or not WA_PHONE_ID:
        return
    try:
        btns = [{"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}} for b in botones[:3]]
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages",
                headers={"Authorization": f"Bearer {WA_TOKEN}"},
                json={"messaging_product": "whatsapp", "to": to, "type": "interactive",
                      "interactive": {"type": "button", "body": {"text": texto},
                                      "action": {"buttons": btns}}})
            print(f"🔘 WA botones {r.status_code}")
    except Exception as e:
        print(f"❌ WA botones error: {e}")


async def wa_imagen_botones(to: str, imagen_url: str, caption: str, botones: list):
    """Envía imagen con caption y luego botones"""
    if not WA_TOKEN or not WA_PHONE_ID:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages",
                headers={"Authorization": f"Bearer {WA_TOKEN}"},
                json={"messaging_product": "whatsapp", "to": to, "type": "image",
                      "image": {"link": imagen_url, "caption": caption}})
            print(f"🖼️ WA imagen {r.status_code}")
    except Exception as e:
        print(f"❌ WA imagen error: {e}")
    await asyncio.sleep(0.8)
    await wa_botones(to, "¿Qué deseas hacer?", botones)


async def wa_productos_botones(to: str, productos: list, uid: str, pagina: int = 0):
    """Envía productos con imagen + botones Agregar / Ver detalle, con paginación de 3 en 3"""
    productos_mostrados[uid] = productos  # guardar lista completa
    pagina_cache[uid] = pagina

    inicio = pagina * 3
    fin = inicio + 3
    pagina_actual = productos[inicio:fin]
    hay_mas = len(productos) > fin

    for i, p in enumerate(pagina_actual):
        imagen = p.get("imagen", "")
        nombre = p.get("nombre", "Producto EGOS")
        precio = p.get("precio", 0)
        pid = p.get("id", "")
        tallas = ", ".join(p.get("tallas", []))
        colores = ", ".join(p.get("colores", []))
        if not imagen:
            continue
        num = inicio + i + 1
        caption = f"{num}️⃣ {nombre}\n💰 ${precio:,.0f} COP\n📏 T:{tallas} | 🎨 {colores}"
        botones = [
            {"id": f"agregar_{pid}", "title": "🛒 Agregar"},
            {"id": f"detalle_{pid}", "title": "🔗 Ver detalle"},
        ]
        await wa_imagen_botones(to, imagen, caption, botones)
        await asyncio.sleep(1.0)

    # Botón "Ver más" si hay más productos
    if hay_mas:
        total = len(productos)
        mostrados = fin
        await wa_botones(to, f"Mostrando {mostrados} de {total} productos 👆", [
            {"id": f"ver_mas_{pagina + 1}", "title": f"Ver más 👉"},
        ])


# ── Carrito ───────────────────────────────────────────────────
async def _agregar_al_carrito(to: str, uid: str, pid: str, talla: str, color: str):
    """Agrega producto al carrito y muestra resumen"""
    prod = next((p for p in catalogo_cache if str(p.get("id")) == pid), None)
    if not prod:
        await wa_send(to, "❌ Producto no encontrado")
        return
    if uid not in carritos:
        carritos[uid] = []
    carritos[uid].append({
        "id": pid,
        "nombre": prod.get("nombre"),
        "precio": prod.get("precio", 0),
        "cantidad": 1,
        "talla": talla,
        "color": color
    })
    detalle = f"T:{talla}" if talla else ""
    if color:
        detalle += f" C:{color}" if detalle else f"C:{color}"
    await wa_send(to, f"✅ {prod.get('nombre')} {detalle} agregado!")
    await asyncio.sleep(0.5)
    await wa_mostrar_carrito(to, uid)
    # Limpiar flujo pendiente
    if uid in flujos and flujos[uid].get("paso") in ["talla", "color"]:
        flujos[uid].pop("paso", None)
        flujos[uid].pop("prod_pendiente", None)
        flujos[uid].pop("talla_pendiente", None)

def resumen_carrito(uid: str) -> str:
    items = carritos.get(uid, [])
    if not items:
        return "Tu carrito está vacío 🛒"
    total = sum(p.get("precio", 0) * p.get("cantidad", 1) for p in items)
    lineas = "\n".join([f"• {p.get('nombre')} T:{p.get('talla','-')} - ${p.get('precio',0):,.0f}" for p in items])
    return f"🛒 Tu carrito:\n{lineas}\n💰 Total: ${total:,.0f} COP"


async def wa_mostrar_carrito(to: str, uid: str):
    texto = resumen_carrito(uid)
    await wa_botones(to, texto, [
        {"id": "seguir_viendo", "title": "🛍️ Seguir viendo"},
        {"id": "ir_al_pago", "title": "💳 Ir al pago"},
    ])


# ── Flujo de compra ───────────────────────────────────────────
async def manejar_boton_wa(to: str, uid: str, button_id: str, button_text: str):
    """Maneja cuando el cliente toca un botón en WhatsApp"""

    # Agregar producto al carrito
    if button_id.startswith("agregar_"):
        pid = button_id.replace("agregar_", "")
        prod = next((p for p in catalogo_cache if str(p.get("id")) == pid), None)
        if prod:
            tallas = prod.get("tallas", [])
            colores = prod.get("colores", [])
            # Guardar producto pendiente de talla/color
            flujos[uid] = {**flujos.get(uid, {}), "paso": "talla", "prod_pendiente": pid}
            if tallas:
                btns = [{"id": f"talla_{pid}_{t}", "title": t[:20]} for t in tallas[:3]]
                await wa_botones(to, f"💳 {prod.get('nombre')}\n¿Qué talla necesitas?", btns)
            else:
                # Sin tallas, preguntar color directamente
                flujos[uid]["paso"] = "color"
                if colores:
                    btns = [{"id": f"color_{pid}___{c}", "title": c[:20]} for c in colores[:3]]
                    await wa_botones(to, "🎨 ¿Qué color prefieres?", btns)
                else:
                    await _agregar_al_carrito(to, uid, pid, "", "")
        return True

    # Seleccionar talla
    if button_id.startswith("talla_"):
        partes = button_id.split("_", 2)  # talla_PID_TALLA
        pid = partes[1] if len(partes) > 1 else ""
        talla = partes[2] if len(partes) > 2 else ""
        prod = next((p for p in catalogo_cache if str(p.get("id")) == pid), None)
        colores = prod.get("colores", []) if prod else []
        flujos[uid] = {**flujos.get(uid, {}), "paso": "color", "prod_pendiente": pid, "talla_pendiente": talla}
        if colores:
            btns = [{"id": f"color_{pid}_{talla}_{c}", "title": c[:20]} for c in colores[:3]]
            await wa_botones(to, f"✅ Talla {talla} seleccionada!\n🎨 ¿Qué color prefieres?", btns)
        else:
            await _agregar_al_carrito(to, uid, pid, talla, "")
        return True

    # Seleccionar color
    if button_id.startswith("color_"):
        partes = button_id.split("_", 3)  # color_PID_TALLA_COLOR
        pid = partes[1] if len(partes) > 1 else ""
        talla = partes[2] if len(partes) > 2 else ""
        color = partes[3] if len(partes) > 3 else ""
        await _agregar_al_carrito(to, uid, pid, talla, color)
        return True

    # Ver detalle del producto
    if button_id.startswith("detalle_"):
        pid = button_id.replace("detalle_", "")
        await wa_send(to, f"🔗 Ver detalle: {FRONTEND_URL}/producto/{pid}")
        return True

    # Botones de categorías
    if button_id.startswith("cat_"):
        cat_map = {
            "cat_vestidos": "vestido", "cat_jeans": "jean",
            "cat_blusas": "blusa", "cat_shorts": "short",
            "cat_lenceria": "lenceria", "cat_blazers": "blazer",
            "cat_calzado": "zapato"
        }
        termino = cat_map.get(button_id, button_id.replace("cat_", ""))
        prods = await get_productos(termino)
        if prods:
            await wa_send(to, f"¡Mira estas opciones! 👇")
            await wa_productos_botones(to, prods, uid)
        else:
            await wa_send(to, "No encontré productos en esa categoría 😔||¿Qué más te interesa?")
        return True

    # Ver más productos (paginación)
    if button_id.startswith("ver_mas_"):
        pagina = int(button_id.replace("ver_mas_", ""))
        prods = productos_mostrados.get(uid, [])
        if prods:
            await wa_productos_botones(to, prods, uid, pagina)
        else:
            await wa_send(to, "No hay más productos para mostrar 😊")
        return True

    # Seguir viendo
    if button_id == "seguir_viendo":
        cats = categorias_disponibles()
        await wa_botones(to, f"¡Claro! 😊 ¿Qué más buscas?\n\n{cats}", [
            {"id": "cat_vestidos", "title": "👗 Vestidos"},
            {"id": "cat_jeans", "title": "👖 Jeans"},
            {"id": "cat_blusas", "title": "👚 Blusas"},
        ])
        return True

    # Ir al pago
    if button_id == "ir_al_pago":
        if not carritos.get(uid):
            await wa_send(to, "Tu carrito está vacío 🛒||Dime qué producto te gusta y te ayudo")
            return True
        flujos[uid] = {"paso": "datos", "productos": carritos.get(uid, [])}
        await wa_send(to,
            "¡Perfecto! 📋 Solo necesito tus datos de envío||"
            "Puedes escribirlos como quieras, por ejemplo:\n\n"
            "_María García, cel 3001234567, Calle 45 #23-10, Bogotá_\n\n"
            "O como te sea más fácil 😊")
        return True

    # Confirmar pedido
    if button_id == "confirmar_pedido":
        flujo = flujos.get(uid, {})
        await wa_send(to, "⏳ Generando tu link de pago...")
        resultado = await crear_pedido_y_link(flujo)
        if resultado.get("exito"):
            pedido_id = resultado.get("pedido_id", "")
            link = resultado.get("link_pago", "")
            total = resultado.get("total", 0)
            await wa_send(to,
                f"🔒 ¡Tu pedido está listo!\n\n"
                f"💳 Paga aquí: {link}\n"
                f"📦 Pedido #{pedido_id[:12]}\n"
                f"💰 Total: ${total:,.0f} COP\n"
                f"⏰ Válido 30 minutos ✨")
            carritos[uid] = []
            del flujos[uid]
        else:
            await wa_send(to, "❌ Hubo un problema||Contáctanos: servicioalcliente@egoscolombia.com.co")
        return True

    # Corregir datos
    if button_id == "corregir_datos":
        flujos[uid] = {"paso": "datos", "productos": carritos.get(uid, [])}
        await wa_send(to, "Sin problema 😊||Envíame los datos correctos:\n*Nombre | Teléfono | Dirección | Ciudad*")
        return True

    return False


async def manejar_flujo_datos(to: str, uid: str, mensaje: str):
    """Usa IA para extraer datos de envio en cualquier formato"""
    flujo = flujos.get(uid, {})
    if flujo.get("paso") != "datos":
        return False

    await wa_send(to, "⏳ Procesando tus datos...")

    # Usar IA para extraer los datos
    datos = await extraer_datos_envio(mensaje)

    nombre = datos.get("nombre", "").strip()
    telefono = datos.get("telefono", "").strip()
    direccion = datos.get("direccion", "").strip()
    ciudad = datos.get("ciudad", "").strip()

    # Verificar que tenemos los datos mínimos
    faltantes = []
    if not nombre: faltantes.append("nombre")
    if not telefono: faltantes.append("teléfono")
    if not direccion: faltantes.append("dirección")
    if not ciudad: faltantes.append("ciudad")

    if faltantes:
        await wa_send(to,
            f"⚠️ No pude identificar: {', '.join(faltantes)}\n"
            f"Por favor envíame esos datos de nuevo 😊")
        return True

    # Guardar datos en el flujo
    flujos[uid] = {
        **flujo,
        "paso": "confirmar",
        "nombre": nombre,
        "telefono": telefono,
        "direccion": direccion,
        "ciudad": ciudad,
    }

    items = flujo.get("productos", [])
    total = sum(p.get("precio", 0) * p.get("cantidad", 1) for p in items)
    lineas = "\n".join([f"• {p.get('nombre')} - ${p.get('precio',0):,.0f}" for p in items])

    # Verificar si aplica descuento de primera compra
    tel_norm = telefono.replace("+", "").replace(" ", "")
    uid_flujo = f"wa_{tel_norm}"
    es_primera = primera_compra_cache.get(uid_flujo, True)
    descuento = round(total * 0.15) if es_primera else 0
    total_final = total - descuento

    descuento_txt = ""
    if es_primera and descuento > 0:
        descuento_txt = f"\n🎉 Descuento primera compra 15%: -${descuento:,.0f}"

    resumen = (
        f"✅ Resumen de tu pedido:\n\n"
        f"{lineas}\n"
        f"{descuento_txt}\n"
        f"💰 Total a pagar: ${total_final:,.0f} COP\n"
        f"📍 {direccion}, {ciudad}\n"
        f"👤 {nombre} | {telefono}"
    )
    await wa_botones(to, resumen, [
        {"id": "confirmar_pedido", "title": "✅ Confirmar"},
        {"id": "corregir_datos", "title": "✏️ Corregir"},
    ])
    return True


# ── Webhook GET ───────────────────────────────────────────────
@app.get("/webhook/meta")
async def verificar(request: Request):
    p = dict(request.query_params)
    if p.get("hub.mode") == "subscribe" and p.get("hub.verify_token") == VERIFY_TOKEN:
        print("✅ Webhook verificado")
        return int(p.get("hub.challenge", 0))
    raise HTTPException(status_code=403)


# ── Webhook POST ──────────────────────────────────────────────
@app.post("/webhook/meta")
async def recibir(request: Request):
    body = await request.json()
    obj = body.get("object", "")

    # ── WHATSAPP ──
    if obj == "whatsapp_business_account":
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})

                for m in value.get("messages", []):
                    phone = m.get("from")
                    mid = m.get("id", "")
                    msg_type = m.get("type", "")

                    if not phone:
                        continue
                    if mid and mid in mensajes_procesados:
                        continue
                    if mid:
                        mensajes_procesados.add(mid)
                        if len(mensajes_procesados) > 1000:
                            mensajes_procesados.clear()

                    uid = f"wa_{phone}"

                    # Mensaje de botón interactivo
                    if msg_type == "interactive":
                        interactive = m.get("interactive", {})
                        itype = interactive.get("type", "")
                        if itype == "button_reply":
                            btn = interactive.get("button_reply", {})
                            button_id = btn.get("id", "")
                            button_text = btn.get("title", "")
                            print(f"🔘 WA botón [{phone}]: {button_id}")
                            await manejar_boton_wa(phone, uid, button_id, button_text)
                            continue
                        elif itype == "list_reply":
                            item = interactive.get("list_reply", {})
                            button_id = item.get("id", "")
                            button_text = item.get("title", "")
                            print(f"📋 WA lista [{phone}]: {button_id}")
                            await manejar_boton_wa(phone, uid, button_id, button_text)
                            continue

                    # Carrito nativo de WhatsApp (tipo "order")
                    if msg_type == "order":
                        order = m.get("order", {})
                        items_order = order.get("product_items", [])
                        if items_order:
                            await wa_mostrar_carrito(phone, uid)
                        else:
                            await wa_send(phone, "Vi que abriste el carrito 🛒||¿Quieres ver lo que tienes o seguir viendo productos?")
                        continue

                    # Mensaje de texto
                    if msg_type != "text":
                        continue
                    msg = m.get("text", {}).get("body", "")
                    if not msg:
                        continue

                    print(f"📱 WA [{phone}]: {msg}")

                    # Verificar primera compra al primer mensaje
                    if uid not in primera_compra_cache:
                        es_primera = await verificar_primera_compra(phone, uid)
                        print(f"🎁 Primera compra [{phone}]: {es_primera}")

                    # Flujo de datos de envío
                    if uid in flujos and flujos[uid].get("paso") == "datos":
                        flujos[uid]["canal"] = "whatsapp"
                        await manejar_flujo_datos(phone, uid, msg)
                        continue

                    # Respuesta de Noa con contexto de primera compra
                    es_primera = primera_compra_cache.get(uid, True)
                    respuesta = await noa(uid, msg, "WhatsApp", es_primera)

                    # Extraer tags
                    busqueda_tag = None
                    agregar_tag = None

                    match_prod = re.search(r'\[PRODUCTOS:([^\]]+)\]', respuesta)
                    if match_prod:
                        busqueda_tag = match_prod.group(1).strip()
                        respuesta = respuesta.replace(match_prod.group(0), "").strip()

                    match_agr = re.search(r'\[AGREGAR:([^\]]+)\]', respuesta)
                    if match_agr:
                        agregar_tag = match_agr.group(1).strip()
                        respuesta = respuesta.replace(match_agr.group(0), "").strip()

                    ir_al_pago = "[IR_AL_PAGO]" in respuesta
                    mostrar_cats = "[MOSTRAR_CATEGORIAS]" in respuesta
                    respuesta = respuesta.replace("[IR_AL_PAGO]", "").replace("[MOSTRAR_CATEGORIAS]", "").strip()

                    # Enviar respuesta
                    if respuesta:
                        await wa_send(phone, respuesta)

                    # Mostrar categorías disponibles
                    if mostrar_cats:
                        cats = categorias_disponibles()
                        await wa_botones(phone, f"Tenemos estas categorías disponibles:\n\n{cats}\n\n¿Cuál te interesa?", [
                            {"id": "cat_vestidos", "title": "👗 Vestidos"},
                            {"id": "cat_jeans", "title": "👖 Jeans"},
                            {"id": "cat_blusas", "title": "👚 Blusas"},
                        ])

                    # Mostrar productos con imagen + botones
                    if busqueda_tag:
                        print(f"🔍 Buscando productos: {busqueda_tag}")
                        prods = await get_productos(busqueda_tag)
                        print(f"📦 Productos encontrados: {len(prods)}")
                        if prods:
                            await wa_productos_botones(phone, prods, uid)

                    # Agregar producto al carrito
                    if agregar_tag:
                        partes = agregar_tag.split(":")
                        pid = partes[0] if partes else ""
                        talla = partes[1] if len(partes) > 1 else ""
                        color = partes[2] if len(partes) > 2 else ""
                        prod = next((p for p in catalogo_cache if str(p.get("id")) == pid), None)
                        if prod:
                            if uid not in carritos:
                                carritos[uid] = []
                            carritos[uid].append({
                                "id": pid, "nombre": prod.get("nombre"),
                                "precio": prod.get("precio", 0),
                                "cantidad": 1, "talla": talla, "color": color
                            })
                            await asyncio.sleep(0.5)
                            await wa_mostrar_carrito(phone, uid)

                    # Ir al pago
                    if ir_al_pago:
                        await manejar_boton_wa(phone, uid, "ir_al_pago", "")

    # ── INSTAGRAM ──
    elif obj == "instagram":
        for entry in body.get("entry", []):
            for ev in entry.get("messaging", []):
                sid = ev.get("sender", {}).get("id")
                msg_obj = ev.get("message", {})
                msg = msg_obj.get("text", "")
                mid = msg_obj.get("mid", "")

                if not sid or not msg:
                    continue
                if sid == IG_BOT_ID:
                    continue
                if msg_obj.get("is_echo"):
                    continue
                if mid and mid in mensajes_procesados:
                    continue
                if mid:
                    mensajes_procesados.add(mid)
                    if len(mensajes_procesados) > 1000:
                        mensajes_procesados.clear()

                uid = f"ig_{sid}"
                print(f"📸 IG [{sid}]: {msg}")

                respuesta = await noa(uid, msg, "Instagram")

                busqueda_tag = None
                match_prod = re.search(r'\[PRODUCTOS:([^\]]+)\]', respuesta)
                if match_prod:
                    busqueda_tag = match_prod.group(1).strip()
                    respuesta = respuesta.replace(match_prod.group(0), "").strip()

                respuesta = re.sub(r'\[[^\]]+\]', '', respuesta).strip()

                if respuesta:
                    await ig_send(sid, respuesta)

                if busqueda_tag:
                    prods = await get_productos(busqueda_tag)
                    if prods:
                        productos_mostrados[uid] = prods[:3]
                        await ig_productos(sid, prods)

    # ── MESSENGER ──
    elif obj == "page":
        for entry in body.get("entry", []):
            for ev in entry.get("messaging", []):
                sid = ev.get("sender", {}).get("id")
                msg = ev.get("message", {}).get("text", "")
                if not sid or not msg:
                    continue
                uid = f"fb_{sid}"
                respuesta = await noa(uid, msg, "Messenger")
                respuesta_limpia = re.sub(r'\[[^\]]+\]', '', respuesta).strip()
                token = PAGE_TOKEN
                if token:
                    async with httpx.AsyncClient(timeout=10) as c:
                        await c.post("https://graph.facebook.com/v19.0/me/messages",
                            params={"access_token": token},
                            json={"recipient": {"id": sid}, "message": {"text": respuesta_limpia}})

    return {"status": "ok"}


# ── Startup ───────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await cargar_catalogo()
    print("✅ Meta Bot v4.0 listo — Noa con carrito + botones")


# ── Salud ─────────────────────────────────────────────────────
@app.get("/salud")
async def salud():
    return {
        "estado": "activo",
        "servicio": "meta-bot",
        "version": "4.0.0",
        "catalogo": len(catalogo_cache),
        "canales": {
            "instagram": bool(IG_TOKEN),
            "whatsapp": bool(WA_TOKEN and WA_PHONE_ID),
            "messenger": bool(PAGE_TOKEN)
        },
        "timestamp": datetime.now().isoformat()
    }
