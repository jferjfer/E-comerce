# 🚀 E-COMMERCE MICROSERVICIOS - INSTRUCCIONES DE USO

## 📋 REQUISITOS PREVIOS
- ✅ Node.js instalado
- ✅ Python 3.11+ instalado  
- ✅ Java 17+ instalado
- ✅ Docker Desktop ejecutándose
- ✅ Command Prompt como **Administrador**

## 🎯 INICIO RÁPIDO

### **Opción 1: Script Automático (Recomendado)**
1. **Ejecuta Command Prompt como Administrador**
2. **Navega al proyecto**: `cd c:\E-comerce`
3. **Ejecuta**: `iniciar-proyecto.bat`
4. **Espera** a que se abra el navegador automáticamente

### **Opción 2: Manual**
```cmd
# 1. Levantar bases de datos
docker compose up -d

# 2. En terminal separada - Auth Service
cd services\auth-service
npm run iniciar

# 3. En terminal separada - API Gateway  
cd api-gateway
npm run iniciar
```

## 🌐 URLS PRINCIPALES

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **API Gateway** | http://localhost:3000 | Punto de entrada principal |
| **Estado Servicios** | http://localhost:3000/estado-servicios | Monitor de servicios |
| **Auth Service** | http://localhost:3001/salud | Servicio de autenticación |
| **Catalog Service** | http://localhost:3002/salud | Catálogo de productos |

## 🧪 PRUEBAS DE API

### **Registrar Usuario**
```bash
curl -X POST http://localhost:3000/api/auth/registrar \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Juan\",\"email\":\"juan@test.com\",\"contrasena\":\"Test123!\"}"
```

### **Iniciar Sesión**
```bash
curl -X POST http://localhost:3000/api/auth/iniciar-sesion \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"juan@test.com\",\"contrasena\":\"Test123!\"}"
```

### **Listar Productos**
```bash
curl http://localhost:3000/api/productos
```

## 🛑 DETENER PROYECTO

### **Opción 1: Script Automático**
```cmd
detener-proyecto.bat
```

### **Opción 2: Manual**
```cmd
# Detener contenedores
docker compose down

# Cerrar ventanas de servicios manualmente
```

## 🔧 SOLUCIÓN DE PROBLEMAS

### **Error: "Acceso denegado"**
- Ejecuta Command Prompt como **Administrador**

### **Error: "Puerto en uso"**
- Verifica que no haya otros servicios corriendo
- Cambia puertos en archivos `.env`

### **Error: "Docker no disponible"**
- Verifica que Docker Desktop esté ejecutándose
- Reinicia Docker Desktop

### **Servicios no responden**
- Espera 30 segundos después de iniciar
- Verifica logs en las ventanas de los servicios

## 📊 ARQUITECTURA

- **8 Microservicios** implementados
- **3 Tecnologías**: Node.js, Python FastAPI, Java Spring Boot
- **3 Bases de datos**: PostgreSQL, MongoDB, Redis
- **100% en español**: Código, comentarios, documentación

## 🎉 ¡PROYECTO COMPLETO!

El sistema incluye:
- ✅ Autenticación con JWT
- ✅ Catálogo de productos
- ✅ Carrito de compras
- ✅ Sistema de crédito
- ✅ Gestión de inventario
- ✅ Recomendaciones IA
- ✅ Sistema de reseñas
- ✅ API Gateway completo