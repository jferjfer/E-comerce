# 🚀 Inicio Rápido - Estilo y Moda

## ⚡ Iniciar Todo el Proyecto

### Opción 1: Script Automático (Recomendado)
```bash
# Doble clic en el archivo:
iniciar-proyecto.bat
```

### Opción 2: Manual
```bash
# Terminal 1 - Auth Service
cd backend/services/auth-service
npm run desarrollo

# Terminal 2 - API Gateway  
cd backend
npm run desarrollo

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## 🛑 Detener Proyecto
```bash
# Doble clic en el archivo:
detener-proyecto.bat
```

## 📱 URLs del Sistema

| Servicio | URL | Puerto |
|----------|-----|--------|
| **Frontend** | http://localhost:3005 | 3005 |
| **API Gateway** | http://localhost:3000 | 3000 |
| **Auth Service** | http://localhost:3001 | 3001 |

## 👤 Credenciales de Prueba

| Campo | Valor |
|-------|-------|
| **Email** | demo@estilomoda.com |
| **Password** | admin123 |

## 📧 Recuperación de Contraseña

### ✅ Sistema Completamente Funcional
- **Gmail Real**: josefer21jf@gmail.com
- **Base de Datos**: Neon Postgres (online)
- **Tokens**: Seguros con expiración de 1 hora

### 🔄 Flujo de Recuperación
1. Ve a `/login` → "¿Olvidaste tu contraseña?"
2. Ingresa tu email real
3. **Recibes correo real** con enlace
4. Haz clic en enlace → Cambia contraseña
5. ✅ Listo

## 🏗️ Arquitectura

```
Frontend (React + Tailwind)
    ↓
API Gateway (Express.js)
    ↓
Auth Service (Node.js + Neon Postgres)
    ↓
Gmail SMTP (Correos reales)
```

## 🔧 Solución de Problemas

### Puerto en Uso
```bash
# Ejecutar detener-proyecto.bat
detener-proyecto.bat
```

### Servicios No Inician
1. Verificar Node.js instalado: `node --version`
2. Instalar dependencias: `npm install` en cada carpeta
3. Verificar puertos libres: 3000, 3001, 3005

### Login No Funciona
1. Verificar que API Gateway esté en puerto 3000
2. Verificar que Auth Service esté en puerto 3001
3. Usar credenciales: demo@estilomoda.com / admin123

## ✅ Estado del Sistema

- ✅ **Autenticación**: Funcional con BD real
- ✅ **Recuperación**: Correos reales por Gmail
- ✅ **Base de Datos**: Neon Postgres online
- ✅ **Frontend**: React + TypeScript + Tailwind
- ✅ **API Gateway**: Proxy y rutas configuradas