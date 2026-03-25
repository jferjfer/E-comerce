# 🎨 CONFIGURACIÓN VIRTUAL TRY-ON

## ✅ ESTADO ACTUAL

**Frontend:** ✅ Completo (ARModal.tsx)
**Backend:** ✅ Endpoint listo con Replicate API
**Gateway:** ✅ Proxy configurado

---

## 🚀 PASOS PARA ACTIVAR

### 1. Instalar Dependencias

```bash
cd backend/services/ai-service
pip install replicate==0.25.0 Pillow==10.2.0
```

### 2. Obtener API Token de Replicate

1. Ir a: https://replicate.com/
2. Crear cuenta (gratis)
3. Ir a: https://replicate.com/account/api-tokens
4. Copiar tu token (empieza con `r8_`)

### 3. Configurar Variable de Entorno

```bash
# En .env del proyecto raíz
REPLICATE_API_TOKEN=r8_TU_TOKEN_AQUI
```

### 4. Reiniciar AI Service

```bash
# Si usas Docker
docker-compose restart ai-service

# Si es local
cd backend/services/ai-service
python src/main.py
```

---

## 🧪 PROBAR

1. Abrir frontend: http://localhost:3005
2. Ir a cualquier producto
3. Click en "Probar Virtualmente"
4. Permitir acceso a cámara
5. Capturar foto
6. Esperar 30-60 segundos

---

## 💰 COSTOS

**Replicate:**
- $0.01 - $0.05 por imagen
- Sin costo mensual
- Pay-as-you-go

**Alternativas:**
- Hugging Face: Gratis (más lento)
- Google Vertex AI: $0.10 por imagen (mejor calidad)

---

## 🔧 MODO DEMO (SIN TOKEN)

Si no configuras `REPLICATE_API_TOKEN`, el sistema:
- ✅ Funciona normalmente
- ✅ Captura foto
- ⚠️ Devuelve foto original sin procesamiento
- ⚠️ Muestra mensaje: "Modo DEMO"

---

## 📝 MODELO USADO

**IDM-VTON** (cuuupid/idm-vton)
- Virtual Try-On de alta calidad
- Soporta ropa superior/inferior
- Procesamiento: 30-60 segundos
- Resultados realistas

---

## 🐛 TROUBLESHOOTING

### Error: "REPLICATE_API_TOKEN no configurado"
**Solución:** Agregar token al .env

### Error: "Timeout"
**Solución:** Aumentar timeout en ARModal.tsx (línea de fetch)

### Error: "Invalid image format"
**Solución:** Verificar que product_image_url sea accesible públicamente

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Configurar token
2. ⏳ Probar con productos reales
3. ⏳ Optimizar tiempos de respuesta
4. ⏳ Agregar cache de resultados
5. ⏳ Implementar categorías (upper/lower/dress)
