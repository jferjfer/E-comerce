# 🛍️ Estilo y Moda - E-Commerce con Microservicios

Sistema de e-commerce moderno basado en arquitectura de microservicios con capacidades de IA, realidad aumentada y gestión de crédito.

> **🌟 Proyecto 100% en Español** - Código, comentarios, variables, funciones, bases de datos y documentación completamente en español.

## 🏗️ Arquitectura

### 🚀 Microservicios Implementados

| Servicio | Tecnología | Puerto | Descripción |
|----------|------------|--------|-------------|
| **🔐 Auth Service** | Node.js | 3011 | Autenticación y gestión de usuarios |
| **📦 Catalog Service** | Python FastAPI | 3002 | Catálogo de productos y categorías |
| **🛒 Transaction Service** | Node.js | 3003 | Carritos, pedidos y pagos |
| **🚛 Logistics Service** | Java Spring Boot | 3009 | Inventario, almacenes y entregas |
| **👥 Social Service** | Node.js | 3004 | Reseñas, preguntas y listas de deseos |
| **📢 Marketing Service** | Node.js | 3006 | Fidelización, campañas y cupones |
| **🤖 AI Service** | Python FastAPI | 3007 | Recomendaciones y análisis IA |
| **💳 Credit Service** | Java Spring Boot | 3008 | Crédito interno y externo |

### 🌐 Componentes Principales

- **🎨 Frontend**: React + TypeScript + Tailwind CSS
- **🌐 Simple Gateway**: Proxy ligero para microservicios (Puerto 3000)
- **🗄️ Base de Datos**: PostgreSQL + MongoDB + Redis
- **📚 Documentación**: Completa y actualizada

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** para estilos
- **Zustand** para manejo de estado
- **React Router** para navegación
- **Vite** como bundler

### Backend
- **Node.js** + Express (Auth, Transaction, Social, Marketing)
- **Python** + FastAPI (Catalog, AI)
- **Java** + Spring Boot (Credit, Logistics)
- **Simple Gateway** como proxy ligero

### Base de Datos
- **PostgreSQL** - Datos estructurados
- **MongoDB** - Datos no estructurados
- **Redis** - Cache y sesiones

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Python 3.8+
- Java 11+
- PostgreSQL
- MongoDB

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/estilo-y-moda-ecommerce.git
cd estilo-y-moda-ecommerce
```

### 2. Configurar Entorno Virtual Python
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

### 3. Instalar Dependencias

**Opción 1: Instalación Automática (RECOMENDADO)**
```bash
# Instalar todas las dependencias Node.js automáticamente
npm run setup-completo

# Activar entorno virtual Python e instalar dependencias
venv\Scripts\activate
pip install -r requirements.txt
```

**Opción 2: Instalación Manual**
```bash
# Node.js
npm run install-all

# Python (con entorno virtual activado)
pip install -r requirements.txt
```

### 4. Iniciar el Sistema

**Opción 1: Sistema Completo**
```bash
npm run dev-completo
```

**Opción 2: Servicios Básicos**
```bash
npm run dev
```

**Opción 3: Servicios Individuales**
```bash
npm run frontend     # Solo frontend
npm run backend      # Solo API Gateway
npm run auth-service # Solo autenticación
```

## 📱 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3005 | Interfaz de usuario |
| **Simple Gateway** | http://localhost:3000 | Proxy de microservicios |
| **Estado Servicios** | http://localhost:3000/estado-servicios | Monitor de servicios |
| **Auth Service** | http://localhost:3011/salud | Servicio de autenticación |
| **Catalog Service** | http://localhost:3002/salud | Servicio de catálogo |

## 👥 Usuarios Demo

| Email | Contraseña | Rol | Permisos |
|-------|------------|-----|----------|
| `ceo@estilomoda.com` | `admin123` | CEO | Control total del sistema |
| `demo@estilomoda.com` | `admin123` | Cliente Regular | Compras básicas |
| `admin@estilomoda.com` | `admin123` | Admin | Administración completa |
| `vendedor@estilomoda.com` | `admin123` | Seller Premium | Gestión avanzada productos |
| `manager@estilomoda.com` | `admin123` | Product Manager | Crear/gestionar productos |
| `vip@estilomoda.com` | `admin123` | Cliente VIP | Experiencia premium |

## ✨ Funcionalidades Implementadas

### 🎨 Frontend Moderno
- ✅ Autenticación con roles y permisos
- ✅ Carrito persistente con sincronización
- ✅ Catálogo con búsqueda y filtros avanzados
- ✅ Sistema de reseñas y calificaciones
- ✅ Lista de deseos personalizada
- ✅ Dashboard administrativo
- ✅ Diseño responsive y moderno

### 🔧 Backend Robusto
- ✅ 8 microservicios independientes
- ✅ API Gateway con proxy inteligente
- ✅ Autenticación JWT con roles
- ✅ Base de datos distribuida
- ✅ Manejo de errores centralizado
- ✅ Logs detallados y monitoreo
- ✅ WebSockets para tiempo real

### 🤖 Inteligencia Artificial
- ✅ Recomendaciones personalizadas
- ✅ Análisis de compatibilidad de estilo
- ✅ Perfiles de usuario inteligentes
- ✅ Tendencias automáticas
- ✅ Machine Learning básico

### 📊 Marketing Avanzado
- ✅ Sistema de cupones dinámico
- ✅ Campañas segmentadas
- ✅ Programa de fidelización
- ✅ Analytics en tiempo real
- ✅ Métricas de conversión

## 🗂️ Estructura del Proyecto

```
E-comerce/
├── 🎨 frontend/                 # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   ├── pages/             # Páginas de la aplicación
│   │   ├── store/             # Manejo de estado (Zustand)
│   │   ├── services/          # Servicios de API
│   │   └── types/             # Tipos de TypeScript
│   └── package.json
├── 🔧 backend/                  # Microservicios
│   ├── services/
│   │   ├── 🔐 auth-service/    # Node.js - Autenticación
│   │   ├── 📦 catalog-service/ # Python - Catálogo
│   │   ├── 🛒 transaction-service/ # Node.js - Transacciones
│   │   ├── 🚛 logistics-service/   # Java - Logística
│   │   ├── 👥 social-service/      # Node.js - Social
│   │   ├── 📢 marketing-service/   # Node.js - Marketing
│   │   ├── 🤖 ai-service/          # Python - IA
│   │   └── 💳 credit-service/      # Java - Crédito
│   ├── 🌉 api-gateway/         # Punto de entrada
│   └── 🗄️ database/           # Scripts de BD
├── 📚 docs/                    # Documentación
├── 🐳 docker-compose.yml      # Contenedores
└── 📋 README.md               # Este archivo
```

## 🧪 Pruebas y Desarrollo

### Probar Conectividad
```bash
npm run test-armonizacion
```

### Monitorear Servicios
```bash
# Ver estado de todos los servicios
curl http://localhost:3000/estado-servicios
```

### Logs en Tiempo Real
Los servicios incluyen logs detallados para debugging y monitoreo.

## 🚀 Despliegue

### Desarrollo Local
```bash
npm run dev
```

### Producción (Docker)
```bash
docker-compose up -d
```

### Variables de Entorno
Crear archivos `.env` en cada servicio con las configuraciones necesarias.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

**Jose Fernando Vertel**
- Email: jfvertel@example.com
- GitHub: [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Comunidad de React y FastAPI
- Contribuidores del proyecto
- Inspiración en las mejores prácticas de microservicios

---

⭐ **¡Si te gusta este proyecto, dale una estrella!** ⭐

🚀 **Estilo y Moda - E-commerce del futuro, hoy** 🚀