"""
Meta Bot Service — EGOS Colombia
Chatbot para WhatsApp, Instagram, Messenger y Facebook
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import json
from openai import OpenAI
from datetime import datetime

app = FastAPI(title="EGOS Meta Bot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────
VERIFY_TOKEN      = os.getenv("META_VERIFY_TOKEN", "egos_webhook_2026")
PAGE_ACCESS_TOKEN = os.getenv("META_PAGE_ACCESS_TOKEN", "")
IG_ACCESS_TOKEN   = os.getenv("META_IG_ACCESS_TOKEN", "")
WA_TOKEN          = os.getenv("META_WA_TOKEN", "")
WA_PHONE_ID       = os.getenv("META_WA_PHONE_NUMBER_ID", "")
AI_API_KEY        = os.getenv("AI_GATEWAY_API_KEY", "")
CATALOG_URL       = os.getenv("CATALOG_SERVICE_URL", "http://catalog-service:3002")
TRANSACTION_URL   = os.getenv("TRANSACTION_SERVICE_URL", "http://transaction-service:3003")
EPAYCO_PUBLIC_KEY = os.getenv("EPAYCO_PUBLIC_KEY", "")

# ── Cliente IA ────────────────────────────────────────────────
ai_client = OpenAI(api_key=AI_API_KEY, base_url="https://api.deepseek.com")

# ── Historial de conversaciones en memoria ────────────────────
conversaciones: dict = {}

# ── Prompt del sistema ────────────────────────────────────────
SYSTEM_PROMPT = """Eres Noa, asesora de moda de EGOS Colombia. Atiendes clientes por WhatsApp, Instagram y Messenger.

INSTRUCCIONES:
1. Saluda calurosamente y pregunta qué busca el cliente
2. Cuando pida productos, busca en el catálogo y recomienda máximo 3
3. Cuando el cliente quiera comprar, pide: nombre completo, dirección de envío, ciudad
4. Cuando tengas los datos, genera el link de pago con ePayco
5. Confirma el pedido cuando el pago sea aprobado
6. Respuestas cortas y naturales — máximo 3 líneas por mensaje
7. Usa emojis con moderación ✨
8. Si el cliente pide hablar con una persona, responde: "Te conecto con un asesor humano en breve 👤"

FORMATO ESPECIAL:
- Para recomendar producto: [PRODUCTO: nombre | precio | id]
- Para pedir datos: [PEDIR_DATOS]
- Para generar pago: [GENERAR_PAGO: nombre | total | pedido_id]
- Para escalar a humano: [ESCALAR_HUMANO]"""


async def obtener_productos(busqueda: str = "") -> list:
    """Consulta el catálogo de productos"""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            url = f"{CATALOG_URL}/api/productos?limite=10"
            if busqueda:
                url += f"&buscar={busqueda}"
            r = await client.get(url)
            return r.json().get("productos", [])
    except:
        return []


async def chat_con_noa(user_id: str, mensaje: str, canal: str) -> str:
    """Procesa el mensaje con DeepSeek y retorna la respuesta"""
    if user_id not in conversaciones:
        conversaciones[user_id] = []

    # Obtener contexto de productos si el mensaje parece una búsqueda
    contexto_productos = ""
    palabras_clave = ["busco", "quiero", "necesito", "tienen", "hay", "precio", "vestido", "jean", "blusa", "camisa"]
    if any(p in mensaje.lower() for p in palabras_clave):
        productos = await obtener_productos(mensaje)
        if productos:
            contexto_productos = "\n\nPRODUCTOS DISPONIBLES:\n"
            for p in productos[:5]:
                contexto_productos += f"- {p.get('nombre')} | ${p.get('precio',0):,.0f} COP | ID:{p.get('id')} | {'✅ En stock' if p.get('en_stock') else '❌ Agotado'}\n"

    system = SYSTEM_PROMPT + contexto_productos + f"\n\nCanal actual: {canal}"

    historial = conversaciones[user_id][-10:]  # últimos 10 mensajes
    mensajes = [{"role": "system", "content": system}]
    mensajes.extend(historial)
    mensajes.append({"role": "user", "content": mensaje})

    try:
        response = ai_client.chat.completions.create(
            model="deepseek-flash",
            messages=mensajes,
            max_tokens=300,
            temperature=0.7
        )
        respuesta = response.choices[0].message.content

        # Guardar en historial
        conversaciones[user_id].append({"role": "user", "content": mensaje})
        conversaciones[user_id].append({"role": "assistant", "content": respuesta})

        # Limpiar historial si es muy largo
        if len(conversaciones[user_id]) > 40:
            conversaciones[user_id] = conversaciones[user_id][-20:]

        return respuesta
    except Exception as e:
        print(f"❌ Error IA: {e}")
        return "Hola! Soy Noa de EGOS Colombia ✨ ¿En qué te puedo ayudar hoy?"


async def enviar_messenger(recipient_id: str, texto: str):
    """Envía mensaje por Messenger"""
    if not PAGE_ACCESS_TOKEN:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://graph.facebook.com/v19.0/me/messages",
            params={"access_token": PAGE_ACCESS_TOKEN},
            json={"recipient": {"id": recipient_id}, "message": {"text": texto}}
        )


async def enviar_instagram(recipient_id: str, texto: str):
    """Envía mensaje por Instagram DM"""
    token = IG_ACCESS_TOKEN or PAGE_ACCESS_TOKEN
    if not token:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://graph.facebook.com/v19.0/me/messages",
            params={"access_token": token},
            json={"recipient": {"id": recipient_id}, "message": {"text": texto}}
        )


async def enviar_whatsapp(phone: str, texto: str):
    """Envía mensaje por WhatsApp"""
    if not WA_TOKEN or not WA_PHONE_ID:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages",
            headers={"Authorization": f"Bearer {WA_TOKEN}"},
            json={
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "text",
                "text": {"body": texto}
            }
        )


# ── WEBHOOK GET — Verificación ────────────────────────────────
@app.get("/webhook/meta")
async def verificar_webhook(request: Request):
    params = dict(request.query_params)
    mode      = params.get("hub.mode")
    token     = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        print(f"✅ Webhook verificado")
        return int(challenge)

    raise HTTPException(status_code=403, detail="Token inválido")


# ── WEBHOOK POST — Recibir mensajes ───────────────────────────
@app.post("/webhook/meta")
async def recibir_webhook(request: Request):
    body = await request.json()
    print(f"📥 Webhook recibido: {json.dumps(body)[:200]}")

    objeto = body.get("object", "")

    # ── MESSENGER / FACEBOOK ──
    if objeto == "page":
        for entry in body.get("entry", []):
            for evento in entry.get("messaging", []):
                sender_id = evento.get("sender", {}).get("id")
                mensaje   = evento.get("message", {}).get("text", "")
                if sender_id and mensaje:
                    print(f"💬 Messenger de {sender_id}: {mensaje}")
                    respuesta = await chat_con_noa(f"fb_{sender_id}", mensaje, "Messenger")
                    # Limpiar tags especiales antes de enviar
                    texto_limpio = respuesta.split("[")[0].strip() if "[" in respuesta else respuesta
                    await enviar_messenger(sender_id, texto_limpio)

    # ── INSTAGRAM ──
    elif objeto == "instagram":
        for entry in body.get("entry", []):
            for evento in entry.get("messaging", []):
                sender_id = evento.get("sender", {}).get("id")
                mensaje   = evento.get("message", {}).get("text", "")
                if sender_id and mensaje:
                    print(f"📸 Instagram DM de {sender_id}: {mensaje}")
                    respuesta = await chat_con_noa(f"ig_{sender_id}", mensaje, "Instagram")
                    texto_limpio = respuesta.split("[")[0].strip() if "[" in respuesta else respuesta
                    await enviar_instagram(sender_id, texto_limpio)

    # ── WHATSAPP ──
    elif objeto == "whatsapp_business_account":
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value    = change.get("value", {})
                messages = value.get("messages", [])
                for msg in messages:
                    phone   = msg.get("from")
                    mensaje = msg.get("text", {}).get("body", "")
                    if phone and mensaje:
                        print(f"📱 WhatsApp de {phone}: {mensaje}")
                        respuesta = await chat_con_noa(f"wa_{phone}", mensaje, "WhatsApp")
                        texto_limpio = respuesta.split("[")[0].strip() if "[" in respuesta else respuesta
                        await enviar_whatsapp(phone, texto_limpio)

    return {"status": "ok"}


# ── SALUD ─────────────────────────────────────────────────────
@app.get("/salud")
async def salud():
    return {
        "estado": "activo",
        "servicio": "meta-bot",
        "version": "1.0.0",
        "canales": {
            "messenger": bool(PAGE_ACCESS_TOKEN),
            "instagram": bool(IG_ACCESS_TOKEN or PAGE_ACCESS_TOKEN),
            "whatsapp":  bool(WA_TOKEN and WA_PHONE_ID)
        },
        "timestamp": datetime.now().isoformat()
    }
