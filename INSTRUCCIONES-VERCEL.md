# 🚀 Configuración Vercel Postgres

## 1. Crear Base de Datos en Vercel

1. Ve a [vercel.com](https://vercel.com) → Dashboard
2. Crea nuevo proyecto o selecciona existente
3. Ve a **Storage** → **Create Database** → **Postgres**
4. Copia las variables de conexión

## 2. Configurar Variables de Entorno

Actualiza `.env` con los datos de Vercel:

```env
# Vercel Postgres (copia desde Vercel Dashboard)
POSTGRES_URL=postgresql://default:xxx@xxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb
POSTGRES_PRISMA_URL=postgresql://default:xxx@xxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://default:xxx@xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb

# Gmail Real
SMTP_USER=josefer21jf@gmail.com
SMTP_PASS=tu-app-password-gmail
```

## 3. Crear Tablas

```bash
cd backend/services/auth-service
npm run crear-tablas
```

## 4. Iniciar Servicio

```bash
npm run desarrollo
```

## 5. Probar Recuperación

1. Ve a `http://localhost:3005/login`
2. Clic en "¿Olvidaste tu contraseña?"
3. Ingresa email real
4. Revisa tu bandeja de entrada
5. Haz clic en enlace recibido

## ✅ Todo Funcionando Online

- ✅ Base de datos: Vercel Postgres
- ✅ Correos: Gmail SMTP real  
- ✅ Tokens: Seguros con expiración
- ✅ Frontend: Completo