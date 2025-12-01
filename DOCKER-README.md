# 🐳 Estilo y Moda - Docker Setup

## 🚀 Inicio Rápido

### 1. Instalar Docker Desktop
- Descarga: https://www.docker.com/products/docker-desktop
- Instala y reinicia tu PC

### 2. Levantar Todo el Sistema
```bash
docker-compose up -d
```

### 3. Ver Logs
```bash
# Todos los servicios
docker-compose logs -f

# Un servicio específico
docker-compose logs -f auth-service
docker-compose logs -f transaction-service
```

### 4. Acceder a la Aplicación
- **Frontend**: http://localhost:3005
- **Gateway**: http://localhost:3000
- **Estado Servicios**: http://localhost:3000/estado-servicios

## 📋 Comandos Útiles

### Detener Todo
```bash
docker-compose down
```

### Reiniciar un Servicio
```bash
docker-compose restart transaction-service
```

### Ver Servicios Activos
```bash
docker-compose ps
```

### Reconstruir Imágenes
```bash
docker-compose build
docker-compose up -d
```

### Limpiar Todo (incluyendo volúmenes)
```bash
docker-compose down -v
```

### Ejecutar Comandos en un Contenedor
```bash
# Entrar a PostgreSQL
docker exec -it estilo-postgres psql -U admin -d ecommerce

# Entrar a MongoDB
docker exec -it estilo-mongodb mongosh -u admin -p admin123

# Ver logs de un servicio
docker logs -f auth-service
```

## 🗄️ Bases de Datos

### PostgreSQL
- **Host**: localhost:5432
- **Usuario**: admin
- **Contraseña**: admin123
- **Base de datos**: ecommerce

### MongoDB
- **Host**: localhost:27017
- **Usuario**: admin
- **Contraseña**: admin123
- **Base de datos**: ecommerce

### Redis
- **Host**: localhost:6379

## 🔧 Servicios

| Servicio | Puerto | Contenedor |
|----------|--------|------------|
| Frontend | 3005 | frontend |
| Gateway | 3000 | gateway |
| Auth | 3011 | auth-service |
| Catalog | 3002 | catalog-service |
| Transaction | 3003 | transaction-service |
| Social | 3004 | social-service |
| Marketing | 3006 | marketing-service |
| AI | 3007 | ai-service |
| PostgreSQL | 5432 | estilo-postgres |
| MongoDB | 27017 | estilo-mongodb |
| Redis | 6379 | estilo-redis |

## 🐛 Troubleshooting

### Puerto ocupado
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Luego reinicia Docker
docker-compose restart
```

### Reconstruir desde cero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Ver errores de un servicio
```bash
docker logs auth-service --tail 100
```

## ✅ Ventajas de Docker

1. ✅ **Un comando para todo**: `docker-compose up`
2. ✅ **Variables de entorno consistentes**
3. ✅ **Puertos siempre limpios**
4. ✅ **Dependencias aisladas**
5. ✅ **Networking automático**
6. ✅ **Logs centralizados**
7. ✅ **Reinicio instantáneo**
8. ✅ **Mismo entorno en desarrollo y producción**

## 🎯 Usuarios Demo

| Email | Contraseña | Rol |
|-------|------------|-----|
| demo@estilomoda.com | admin123 | Cliente |
| admin@estilomoda.com | admin123 | Admin |
| ceo@estilomoda.com | admin123 | CEO |
| vip@estilomoda.com | admin123 | VIP |
