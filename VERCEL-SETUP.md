# 🚀 Configuración Vercel - Estilo y Moda

## 📋 **PASOS PARA DESPLEGAR EN VERCEL**

### **1. Preparar Proyecto**
```bash
# Construir frontend
cd frontend
npm run build

# Volver a raíz
cd ..
```

### **2. Crear Base de Datos Vercel**
1. Ve a [vercel.com](https://vercel.com) → Tu proyecto
2. **Storage** → **Create Database** → **Postgres**
3. Copia las variables de conexión

### **3. Configurar Variables de Entorno**
En Vercel Dashboard → Settings → Environment Variables:

```env
# Vercel Postgres (desde tu dashboard)
POSTGRES_URL=postgresql://default:xxx@xxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb
POSTGRES_PRISMA_URL=postgresql://default:xxx@xxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://default:xxx@xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb

# JWT
JWT_SECRETO=tu_jwt_secreto_muy_seguro_para_produccion
JWT_EXPIRACION=24h

# Correo Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-gmail

# URLs
FRONTEND_URL=https://tu-proyecto.vercel.app
NODE_ENV=production
```

### **4. Configurar Base de Datos**
```bash
# Con las variables de Vercel configuradas
node scripts/setup-vercel-db.js
```

### **5. Desplegar**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

## ✅ **ARCHIVOS CONFIGURADOS**

- `vercel.json` - Configuración de despliegue
- `scripts/setup-vercel-db.js` - Setup de base de datos
- `backend/services/auth-service/src/config/baseDatosVercel.js` - Conexión Vercel
- `.env.vercel` - Plantilla de variables

## 🔗 **CONEXIONES VERIFICADAS**

### **Frontend → Backend**
- ✅ API calls a `/api/*` 
- ✅ Rutas configuradas en `vercel.json`
- ✅ CORS configurado para producción

### **Backend → Base de Datos**
- ✅ Conexión Vercel Postgres
- ✅ Fallback a base de datos local
- ✅ SSL configurado para producción

### **Servicios Integrados**
- ✅ Auth Service con Vercel Postgres
- ✅ API Gateway como proxy
- ✅ Frontend estático optimizado

## 🎯 **USUARIO DEMO PARA PRODUCCIÓN**
- **Email**: `demo@estilomoda.com`
- **Contraseña**: `admin123`

## 📊 **MONITOREO**
- Vercel Dashboard → Functions → Logs
- Vercel Dashboard → Storage → Postgres → Metrics
- Frontend → Network tab para verificar API calls

¡Tu e-commerce estará funcionando en Vercel con base de datos real! 🎉