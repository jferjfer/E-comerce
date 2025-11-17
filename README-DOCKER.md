# E-Commerce - Guía Docker

## Inicio Rápido

### 1. Inicializar Proyecto Completo
```bash
# Ejecutar script de inicialización
iniciar-docker.bat

# O manualmente:
docker compose up -d --build
```

### 2. Verificar Estado
```bash
docker compose ps
```

### 3. Ver Logs
```bash
# Todos los servicios
docker compose logs -f

# Servicio específico
docker compose logs -f auth-service
```

## URLs de Servicios

| Servicio | URL | Puerto |
|----------|-----|--------|
| Frontend | http://localhost:3005 | 3005 |
| API Gateway | http://localhost:3000 | 3000 |
| Auth Service | http://localhost:3001 | 3001 |
| Catalog Service | http://localhost:3002 | 3002 |
| Transaction Service | http://localhost:3003 | 3003 |
| Social Service | http://localhost:3004 | 3004 |
| AI Service | http://localhost:3007 | 3007 |
| Credit Service | http://localhost:3008 | 3008 |
| Logistics Service | http://localhost:3009 | 3009 |

## Bases de Datos

| Base de Datos | URL | Puerto |
|---------------|-----|--------|
| PostgreSQL | localhost:5432 | 5432 |
| MongoDB | localhost:27017 | 27017 |
| Redis | localhost:6379 | 6379 |

## Scripts Disponibles

- `iniciar-docker.bat` - Inicia todo el proyecto
- `detener-docker.bat` - Detiene el proyecto
- `monitorear-servicios.bat` - Monitor interactivo

## Comandos Útiles

### Gestión de Contenedores
```bash
# Iniciar servicios
docker compose up -d

# Detener servicios
docker compose down

# Reiniciar servicio específico
docker compose restart auth-service

# Reconstruir imágenes
docker compose build --no-cache
```

### Debugging
```bash
# Entrar a un contenedor
docker compose exec auth-service sh

# Ver logs en tiempo real
docker compose logs -f --tail=100 auth-service

# Verificar salud de servicios
docker compose ps
```

### Limpieza
```bash
# Detener y eliminar volúmenes
docker compose down -v

# Limpiar sistema
docker system prune -f
```

## Troubleshooting

### Problema: Puerto ocupado
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000
```

### Problema: Base de datos no conecta
```bash
# Verificar logs de PostgreSQL
docker compose logs postgres

# Verificar logs de MongoDB
docker compose logs mongodb
```

### Problema: Servicio no responde
```bash
# Reiniciar servicio específico
docker compose restart [nombre-servicio]

# Ver logs del servicio
docker compose logs -f [nombre-servicio]
```