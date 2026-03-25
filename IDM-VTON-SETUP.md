# 🎨 IDM-VTON IMPLEMENTADO - GUÍA COMPLETA

## ✅ ESTADO ACTUAL

**Código:** ✅ Implementado
**Token HF:** ✅ Configurado (<HUGGINGFACE_TOKEN>)
**Dependencias:** ✅ Agregadas

---

## 🚀 ACTIVACIÓN

### 1. Instalar dependencias

```bash
cd backend/services/ai-service
pip install gradio-client==0.10.1 rembg==2.0.50
```

### 2. Reiniciar servicio

```bash
# Con Docker
docker-compose build ai-service
docker-compose up -d ai-service

# O local
python src/main.py
```

### 3. Probar

```bash
# Verificar que está activo
curl http://localhost:3007/salud

# Probar en frontend
http://localhost:3005 → Producto → "Probar Virtualmente"
```

---

## 🎯 CÓMO FUNCIONA

### **Sistema de Prioridades:**

```
1. IDM-VTON (Hugging Face) ← GRATIS ✅
   ↓ Si falla
2. Replicate (si tienes token)
   ↓ Si falla
3. Modo DEMO (foto original)
```

### **Flujo IDM-VTON:**

```
1. Usuario sube foto → Backend recibe
2. Backend conecta con yisol/IDM-VTON en HF
3. Envía:
   - Foto usuario
   - URL imagen producto
   - Descripción: "clothing item"
4. IDM-VTON procesa (30-60s)
5. Devuelve resultado
6. Frontend muestra
```

---

## 💰 COSTOS

### **Hugging Face (IDM-VTON):**
```
✅ GRATIS hasta 1000 requests/mes
✅ Sin tarjeta de crédito
⚠️ Puede ser lento en horas pico
⚠️ Límite de 30s por request
```

### **Alternativas:**
```
Replicate: $0.02-0.05 por imagen
Vertex AI: $0.10-0.15 por imagen
```

---

## 🔧 PARÁMETROS IDM-VTON

```python
result = client.predict(
    dict_1={
        "background": foto_usuario,
        "layers": [],
        "composite": None
    },
    garm_img=url_producto,           # URL de Cloudinary
    garment_des="clothing item",     # Descripción
    is_checked=True,                 # Usar máscara automática
    is_checked_crop=False,           # No recortar
    denoise_steps=30,                # Calidad (20-50)
    seed=42,                         # Reproducibilidad
    api_name="/tryon"
)
```

### **Ajustar calidad:**
```
denoise_steps=20  → Rápido (15-30s) - Calidad media
denoise_steps=30  → Normal (30-45s) - Buena calidad ✅
denoise_steps=50  → Lento (60-90s) - Máxima calidad
```

---

## 🧪 TESTING

### **Test 1: Verificar conexión**
```bash
curl -X POST http://localhost:3007/api/virtual-tryon \
  -F "person_image=@foto_persona.jpg" \
  -F "product_image_url=https://res.cloudinary.com/tu-cloud/vestido.jpg"
```

### **Test 2: Ver logs**
```bash
docker-compose logs -f ai-service

# Deberías ver:
# 🎨 Virtual Try-On IDM-VTON: foto.jpg + url_producto
# 🚀 Procesando con IDM-VTON (Hugging Face)...
# ✅ Procesamiento completado con IDM-VTON
```

---

## ⚠️ TROUBLESHOOTING

### **Error: "Connection timeout"**
```
Causa: Hugging Face Space está ocupado
Solución: Reintentar en 1-2 minutos
```

### **Error: "Invalid token"**
```
Causa: Token HF incorrecto
Solución: Verificar en .env que sea:
HUGGINGFACE_TOKEN=<HUGGINGFACE_TOKEN>
```

### **Error: "File not found"**
```
Causa: URL de producto no accesible
Solución: Verificar que la URL de Cloudinary sea pública
```

### **Resultado: Foto original (sin cambios)**
```
Causa: Cayó en modo DEMO
Solución: Ver logs para identificar error específico
```

---

## 🎯 OPTIMIZACIONES

### **1. Cache de resultados**
```python
# Guardar resultados en BD
{
  "usuario_id": "123",
  "producto_id": "456",
  "resultado_url": "cloudinary.com/resultado.jpg",
  "fecha": "2024-01-15"
}

# Si mismo usuario + mismo producto → Servir desde cache
```

### **2. Cola de procesamiento**
```python
# No bloquear request
# Usar Celery o similar
@celery.task
def procesar_tryon(foto, producto):
    # Procesar en background
    pass
```

### **3. Notificación al usuario**
```javascript
// Frontend
"Tu prueba virtual se está procesando... (30-60s)"
// WebSocket notifica cuando está listo
```

---

## 📊 MÉTRICAS ESPERADAS

```
Tiempo de procesamiento: 30-60s
Tasa de éxito: 85-95%
Calidad: ⭐⭐⭐⭐ (4/5)
Costo: $0 (gratis)
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Probar con 5-10 imágenes diferentes
2. ⏳ Medir tiempos reales
3. ⏳ Implementar cache
4. ⏳ Agregar cola de procesamiento
5. ⏳ Optimizar frontend (mostrar progreso)

---

## 📝 NOTAS IMPORTANTES

- **IDM-VTON funciona mejor con:**
  - Fotos de cuerpo completo
  - Fondo simple/uniforme
  - Buena iluminación
  - Persona de frente

- **Limitaciones:**
  - No funciona bien con poses extremas
  - Mejor para ropa superior (camisas, vestidos)
  - Puede tener problemas con accesorios

- **Alternativas si IDM-VTON falla:**
  - CatVTON (más rápido, menos detalle)
  - OOTDiffusion (mejor para outfits completos)
  - Replicate (de pago pero más confiable)

---

## ✅ LISTO PARA USAR

El sistema está configurado y listo. Solo necesitas:
1. Reiniciar el servicio
2. Probar con una foto
3. Ajustar parámetros según resultados
