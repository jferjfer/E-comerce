# 🎯 CONFIGURACIÓN VERTEX AI - GUÍA COMPLETA

## ✅ PROGRESO ACTUAL

- [x] Dependencias agregadas
- [x] Código implementado
- [ ] Cuenta Google Cloud
- [ ] Proyecto creado
- [ ] APIs habilitadas
- [ ] Service Account creado
- [ ] Credenciales descargadas

---

## 📝 PASO 1: CREAR CUENTA GOOGLE CLOUD

### 1.1 Registrarse
```
https://console.cloud.google.com/
```
- Usar cuenta Gmail
- Tarjeta de crédito requerida
- **$300 USD gratis** por 90 días
- No se cobra sin autorización

### 1.2 Verificar cuenta
- Completar verificación de identidad
- Confirmar método de pago

---

## 📝 PASO 2: CREAR PROYECTO

### 2.1 Acceder a Console
```
https://console.cloud.google.com/projectcreate
```

### 2.2 Crear proyecto
```
Nombre del proyecto: estilo-moda-tryon
ID del proyecto: estilo-moda-tryon-XXXXXX (auto-generado)
Organización: Sin organización
```

### 2.3 Guardar Project ID
```bash
# Ejemplo:
GOOGLE_PROJECT_ID=estilo-moda-tryon-123456
```

---

## 📝 PASO 3: HABILITAR APIS

### 3.1 Vertex AI API
```
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
```
- Click "ENABLE"
- Esperar 1-2 minutos

### 3.2 Cloud Storage API
```
https://console.cloud.google.com/apis/library/storage-api.googleapis.com
```
- Click "ENABLE"

### 3.3 Compute Engine API
```
https://console.cloud.google.com/apis/library/compute.googleapis.com
```
- Click "ENABLE"

---

## 📝 PASO 4: CREAR SERVICE ACCOUNT

### 4.1 Ir a IAM
```
https://console.cloud.google.com/iam-admin/serviceaccounts
```

### 4.2 Crear cuenta
```
1. Click "CREATE SERVICE ACCOUNT"
2. Service account name: ai-service-tryon
3. Service account ID: ai-service-tryon
4. Click "CREATE AND CONTINUE"
```

### 4.3 Asignar roles
Agregar estos roles:
```
1. Vertex AI User
2. Storage Object Viewer  
3. Storage Object Creator
```

Click "CONTINUE" → "DONE"

### 4.4 Crear clave JSON
```
1. Click en el service account creado
2. Tab "KEYS"
3. "ADD KEY" → "Create new key"
4. Tipo: JSON
5. Click "CREATE"
```

Se descarga: `estilo-moda-tryon-xxxxx.json`

---

## 📝 PASO 5: CONFIGURAR EN TU PROYECTO

### 5.1 Copiar archivo de credenciales
```bash
# Copiar el archivo descargado
cp ~/Downloads/estilo-moda-tryon-*.json \
   /home/jose/E-comerce/backend/services/ai-service/google-credentials.json
```

### 5.2 Actualizar .env
```bash
# Editar .env
nano /home/jose/E-comerce/.env

# Agregar/actualizar:
GOOGLE_PROJECT_ID=estilo-moda-tryon-123456  # Tu Project ID real
GOOGLE_REGION=us-central1
GOOGLE_CREDENTIALS_PATH=google-credentials.json
```

### 5.3 Instalar dependencias
```bash
cd /home/jose/E-comerce/backend/services/ai-service
pip install google-cloud-aiplatform==1.38.0 google-auth==2.25.0
```

### 5.4 Reiniciar servicio
```bash
# Con Docker
docker-compose build ai-service
docker-compose up -d ai-service

# O local
python src/main.py
```

---

## 🧪 PROBAR

### Verificar configuración
```bash
# Ver logs
docker-compose logs -f ai-service

# Debe mostrar:
# ✅ AI Service conectado a MongoDB Catálogo
# 🚀 AI Service Unificado v3.0 iniciando en puerto 3007
```

### Probar endpoint
```bash
curl http://localhost:3007/salud
```

### Probar en frontend
```
1. http://localhost:3005
2. Ir a cualquier producto
3. Click "Probar Virtualmente"
4. Capturar foto
5. Esperar 30-60 segundos
```

---

## 💰 COSTOS ESTIMADOS

### Vertex AI Imagen API
- **Generación de imagen:** $0.10 por imagen
- **Edición de imagen:** $0.15 por imagen
- **Créditos gratis:** $300 USD = ~2000 pruebas

### Alternativa: Replicate
- **Costo:** $0.02 por imagen
- **Sin créditos gratis**
- **Más económico para producción**

---

## 🔧 TROUBLESHOOTING

### Error: "Permission denied"
**Solución:** Verificar que los roles estén asignados correctamente

### Error: "API not enabled"
**Solución:** Habilitar Vertex AI API en el proyecto

### Error: "Invalid credentials"
**Solución:** Verificar que el archivo JSON esté en la ruta correcta

### Error: "Quota exceeded"
**Solución:** Verificar límites en Google Cloud Console

---

## 🎯 SISTEMA DE FALLBACK

El código implementa 3 niveles:

1. **Vertex AI** (si está configurado)
2. **Replicate** (si tiene token)
3. **DEMO** (devuelve foto original)

---

## 📞 SOPORTE

**Google Cloud Support:**
- https://cloud.google.com/support

**Documentación Vertex AI:**
- https://cloud.google.com/vertex-ai/docs

**Precios:**
- https://cloud.google.com/vertex-ai/pricing
