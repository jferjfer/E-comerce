# E-Commerce - Arquitectura de Microservicios

Sistema de e-commerce basado en microservicios con capacidades de IA, realidad aumentada y gestión de crédito.

> **Nota importante**: Todo el proyecto está desarrollado 100% en español - código, comentarios, nombres de variables, funciones, bases de datos y documentación.

## Arquitectura

### Microservicios

1. **Auth Service** - Autenticación y gestión de usuarios
2. **Catalog Service** - Catálogo de productos y categorías
3. **Transaction Service** - Carritos, pedidos y pagos
4. **Logistics Service** - Inventario, almacenes y entregas
5. **Social Service** - Reseñas, preguntas y listas de deseos
6. **Marketing Service** - Fidelización, campañas y cupones
7. **AI Service** - Recomendaciones y realidad aumentada
8. **Credit Service** - Crédito interno y externo

### Componentes

- **API Gateway** - Punto de entrada único
- **Frontend** - Interfaz de usuario con React y Tailwind CSS
- **Backend** - Microservicios y base de datos
- **Shared** - Librerías compartidas
- **Docs** - Documentación

## Stack Tecnológico

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js / Python / Java
- **Base de datos**: PostgreSQL / MongoDB
- **Mensajería**: RabbitMQ / Kafka
- **Contenedores**: Docker
- **Orquestación**: Kubernetes

## Estructura del Proyecto

```
E-comerce/
├── frontend/                 # React + Tailwind CSS
│   ├── src/
│   │   ├── componentes/
│   │   ├── paginas/
│   │   ├── servicios/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/                  # Microservicios
│   ├── services/
│   │   ├── auth-service/
│   │   ├── catalog-service/
│   │   ├── transaction-service/
│   │   ├── logistics-service/
│   │   ├── social-service/
│   │   ├── marketing-service/
│   │   ├── ai-service/
│   │   └── credit-service/
│   ├── api-gateway/
│   ├── database/
│   ├── shared/
│   └── package.json
├── docs/
├── docker-compose.yml
└── README.md
```

## Inicio Rápido

### Desarrollo Local

1. **Frontend**:
```bash
cd frontend
npm install
npm run iniciar
```

2. **Backend**:
```bash
cd backend
npm install
npm run desarrollo
```

### Con Docker

```bash
# Levantar todo el stack
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## URLs de Servicios

- **Frontend**: http://localhost:3005
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Catalog Service**: http://localhost:3002
- **Transaction Service**: http://localhost:3003
- **Social Service**: http://localhost:3004
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017

## Funcionalidades Implementadas

### Frontend
- ✅ Navegación moderna con Tailwind CSS
- ✅ Página de inicio con productos destacados
- ✅ Catálogo de productos con filtros
- ✅ Carrito de compras funcional
- ✅ Sistema de autenticación
- ✅ Diseño responsive

### Backend
- ✅ API Gateway configurado
- ✅ Microservicio de autenticación
- ✅ Microservicio de catálogo
- ✅ Microservicio de transacciones
- ✅ Base de datos PostgreSQL y MongoDB
- ✅ Dockerización completa