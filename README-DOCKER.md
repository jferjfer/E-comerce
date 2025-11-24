# E-Commerce - Ejecución con Docker

## Descripción

Ejecuta todo el stack de E-Commerce con Docker Compose, incluyendo:
- **Frontend Vue.js** (puerto 3005)
- **8 Microservicios** (puertos 3001-3009)
- **API Gateway** (puerto 3000)
- **3 Bases de datos** (PostgreSQL, MongoDB, Redis)

## Scripts Disponibles

### 🚀 Iniciar Todo el Stack
```bash
iniciar-docker-completo.bat
```
Construye y ejecuta todos los servicios en contenedores Docker.

### 📊 Monitorear Servicios
```bash
monitorear-docker.bat
```
Menú interactivo para:
- Ver estado de contenedores
- Monitorear logs
- Reiniciar servicios específicos
- Detener servicios

### 🧹 Limpiar Docker
```bash
limpiar-docker.bat
```
Elimina completamente todos los contenedores, imágenes y volúmenes del proyecto.

## URLs de Acceso

Una vez iniciado, los servicios estarán disponibles en:

### Frontend y Gateway
- **Frontend Vue.js**: http://localhost:3005
- **API Gateway**: http://localhost:3000

### Microservicios
- **Auth Service**: http://localhost:3001
- **Catalog Service**: http://localhost:3002
- **Transaction Service**: http://localhost:3003
- **Social Service**: http://localhost:3004
- **Marketing Service**: http://localhost:3006
- **AI Service**: http://localhost:3007
- **Credit Service**: http://localhost:3008
- **Logistics Service**: http://localhost:3009

### Bases de Datos
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Comandos Docker Útiles

### Ver estado de contenedores
```bash
docker-compose ps
```

### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f frontend
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
```

### Reiniciar un servicio
```bash
docker-compose restart frontend
docker-compose restart api-gateway
```

### Detener todos los servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes (datos)
```bash
docker-compose down -v
```

### Reconstruir un servicio específico
```bash
docker-compose up --build frontend
```

## Estructura de Contenedores

```
ecommerce-network (Docker Network)
├── ecommerce-postgres     (Base de datos principal)
├── ecommerce-mongodb      (Base de datos NoSQL)
├── ecommerce-redis        (Cache y sesiones)
├── ecommerce-auth         (Microservicio de autenticación)
├── ecommerce-catalog      (Microservicio de catálogo)
├── ecommerce-transaction  (Microservicio de transacciones)
├── ecommerce-social       (Microservicio social)
├── ecommerce-ai           (Microservicio de IA)
├── ecommerce-credit       (Microservicio de crédito)
├── ecommerce-logistics    (Microservicio de logística)
├── ecommerce-marketing    (Microservicio de marketing)
├── ecommerce-gateway      (API Gateway)
└── ecommerce-frontend     (Frontend Vue.js)
```

## Volúmenes Persistentes

Los siguientes datos se mantienen entre reinicios:
- **postgres_data**: Datos de PostgreSQL
- **mongodb_data**: Datos de MongoDB
- **redis_data**: Datos de Redis

## Variables de Entorno

Configuradas en `.env`:
- Credenciales de bases de datos
- Puertos de servicios
- URLs de conexión
- Configuración JWT

## Troubleshooting

### Problema: Puerto ocupado
```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :3005

# Detener el proceso si es necesario
taskkill /PID <PID> /F
```

### Problema: Contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs <nombre-servicio>

# Reconstruir el contenedor
docker-compose up --build <nombre-servicio>
```

### Problema: Base de datos no conecta
```bash
# Verificar que las bases de datos estén healthy
docker-compose ps

# Reiniciar base de datos específica
docker-compose restart postgres
docker-compose restart mongodb
```

### Problema: Falta de espacio en disco
```bash
# Limpiar imágenes no utilizadas
docker system prune -f

# Ver uso de espacio
docker system df
```

## Desarrollo

### Modificar código y ver cambios
1. Modifica el código fuente
2. Reconstruye el servicio específico:
   ```bash
   docker-compose up --build frontend
   ```

### Acceder a un contenedor
```bash
# Acceder al contenedor del frontend
docker exec -it ecommerce-frontend sh

# Acceder al contenedor de PostgreSQL
docker exec -it ecommerce-postgres psql -U admin -d ecommerce
```

### Ver recursos utilizados
```bash
# Ver uso de CPU y memoria
docker stats

# Ver uso específico del proyecto
docker-compose top
```

---

**Nota**: Asegúrate de tener Docker y Docker Compose instalados antes de ejecutar los scripts.