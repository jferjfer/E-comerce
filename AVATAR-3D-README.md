# 🎨 Avatar Virtual 3D - Sistema de Prueba Virtual

Sistema completo de prueba virtual 3D que permite crear avatares realistas y ver cómo quedan las prendas con animaciones de pasarela.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
# Backend (AI Service)
cd backend/services/ai-service
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Configurar API Keys

Crear/editar `.env` en `backend/services/ai-service/`:

```bash
# Ready Player Me (Opcional - usa demo si no está configurado)
READY_PLAYER_ME_API_KEY=rpm_XXXXXXXX

# Replicate (Ya configurado)
REPLICATE_API_TOKEN=<REPLICATE_API_TOKEN>
```

### 3. Iniciar Servicios

```bash
# Con Docker (Recomendado)
docker-compose up -d

# O manualmente
cd backend/services/ai-service && python iniciar.py
cd simple-gateway && node server.js
cd frontend && npm run dev
```

### 4. Usar el Sistema

1. Abrir: http://localhost:3005/virtual-tryon
2. Subir 2 fotos (cara + cuerpo) o usar modo demo
3. Pegar URL del producto
4. Click "Crear Avatar 3D"
5. Esperar 2-3 minutos
6. Interactuar con avatar 3D

## 📋 Características

- ✅ Avatar 3D desde foto de cara (Ready Player Me)
- ✅ Aplicación de prenda con IA (Replicate IDM-VTON)
- ✅ Animaciones de pasarela (Mixamo)
- ✅ Renderizado 3D interactivo (Three.js)
- ✅ Modo demo sin fotos personales
- ✅ Vista 360° con zoom y rotación

## 💰 Costos

- Ready Player Me: GRATIS (hasta 10k avatares/mes)
- Replicate: ~$0.02-0.03 por avatar
- Mixamo: GRATIS
- Three.js: GRATIS (renderiza en cliente)

**Total: ~$0-25/mes** (según uso)

## 📚 Documentación Completa

Ver: [AVATAR-3D-DOCUMENTACION.md](./AVATAR-3D-DOCUMENTACION.md)

## 🛠️ Stack Tecnológico

**Backend:**
- Python FastAPI
- Ready Player Me API
- Replicate (IDM-VTON)

**Frontend:**
- React + TypeScript
- Three.js + React Three Fiber
- Tailwind CSS

## 📞 Soporte

- Documentación: Ver archivos `.md` en este directorio
- Issues: Reportar en el repositorio
- Email: soporte@estilomoda.com
