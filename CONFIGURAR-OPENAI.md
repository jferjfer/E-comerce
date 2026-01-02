# 🤖 CONFIGURACIÓN DE OPENAI PARA CHAT INTELIGENTE

## 📋 ESTADO ACTUAL

✅ El código está listo para usar OpenAI
⚠️ Falta configurar la API Key

**Actualmente:** Usa respuestas de fallback (básicas)
**Con OpenAI:** Respuestas inteligentes y contextuales

---

## 🔑 CÓMO OBTENER API KEY DE OPENAI

### Opción 1: OpenAI Oficial (Recomendado)

1. Ve a https://platform.openai.com/
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" en el menú
4. Click en "Create new secret key"
5. Copia la key (empieza con `sk-...`)

**Costo:** ~$0.002 por 1000 mensajes (muy barato)

### Opción 2: Usar API Gratuita (Alternativa)

Puedes usar servicios como:
- Groq (gratis, rápido)
- Together AI (gratis con límites)
- Hugging Face (gratis)

---

## ⚙️ CONFIGURAR LA API KEY

### Método 1: Variable de Entorno (Recomendado)

Edita el archivo `.env`:

```bash
# Agregar esta línea
OPENAI_API_KEY=sk-tu-api-key-aqui
```

Luego reconstruye:
```bash
docker compose down
docker compose up -d
```

### Método 2: Docker Compose

Edita `docker-compose.yml`, en la sección `ai-service`:

```yaml
ai-service:
  environment:
    OPENAI_API_KEY: sk-tu-api-key-aqui
```

Luego:
```bash
docker compose up -d ai-service
```

---

## 🧪 PROBAR QUE FUNCIONA

```bash
# Probar chat
curl -X POST http://localhost:3007/api/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"Recomiéndame un vestido elegante para una boda","historial":[]}'

# Si funciona, verás:
# "fuente": "openai"  ← Esto indica que usa OpenAI

# Si no funciona:
# "fuente": "fallback"  ← Usa respuestas básicas
```

---

## 🎯 DIFERENCIA ENTRE FALLBACK Y OPENAI

### Con Fallback (Actual):
```
Usuario: "Necesito algo elegante para una boda en la playa"
María: "✨ ¡Me encantaría ayudarte! ¿Para qué ocasión buscas ropa?"
```
❌ Respuesta genérica, no entiende el contexto

### Con OpenAI:
```
Usuario: "Necesito algo elegante para una boda en la playa"
María: "¡Perfecto! Para una boda en la playa te recomiendo vestidos 
        en telas ligeras como lino o algodón, en colores pasteles 
        o tonos tierra. ¿Prefieres largo o midi? 👗🌊"
```
✅ Respuesta inteligente, contextual y personalizada

---

## 🆓 ALTERNATIVA SIN COSTO

Si no quieres pagar por OpenAI, puedes usar **Groq** (gratis):

1. Ve a https://console.groq.com/
2. Crea cuenta
3. Obtén API key gratis
4. Modifica el código:

```python
# En main-completo.py, línea ~15
client = OpenAI(
    api_key=os.getenv('GROQ_API_KEY'),
    base_url="https://api.groq.com/openai/v1"
)

# Y en docker-compose.yml
environment:
  GROQ_API_KEY: tu-groq-key-aqui
```

**Ventajas de Groq:**
- ✅ Gratis
- ✅ Muy rápido
- ✅ Compatible con OpenAI
- ✅ Modelos: llama-3.1, mixtral

---

## 📊 COMPARACIÓN

| Opción | Costo | Velocidad | Calidad |
|--------|-------|-----------|---------|
| **Fallback** | Gratis | Instantáneo | ⭐⭐ |
| **OpenAI** | $0.002/1K | Rápido | ⭐⭐⭐⭐⭐ |
| **Groq** | Gratis | Muy rápido | ⭐⭐⭐⭐ |

---

## 🚀 RECOMENDACIÓN

**Para desarrollo/pruebas:** Usa Groq (gratis)
**Para producción:** Usa OpenAI (mejor calidad)
**Sin configurar:** Funciona con fallback (básico pero funcional)

---

## ✅ VERIFICAR CONFIGURACIÓN

```bash
# Ver logs del servicio
docker logs ai-service --tail 20

# Si ves:
# "✅ OpenAI disponible" → Configurado correctamente
# "⚠️ OpenAI no disponible" → Falta API key
```

---

## 🎉 CONCLUSIÓN

El sistema funciona en 3 modos:

1. **Con OpenAI** → Respuestas inteligentes (requiere API key)
2. **Con Groq** → Respuestas inteligentes gratis (requiere API key)
3. **Fallback** → Respuestas básicas (sin configuración)

**Actualmente está en modo Fallback (funcional pero básico)**

Para activar IA real, solo necesitas agregar una API key.
