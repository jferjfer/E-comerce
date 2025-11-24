# StyleHub Frontend - E-Commerce Empresarial

Plataforma de e-commerce de moda de nivel empresarial con IA integrada, sistema de roles avanzado y arquitectura de microservicios. Construido con React + TypeScript + Tailwind CSS.

## 🏢 Características Empresariales

### Sistema de Roles Completo
- **15+ Roles Jerárquicos**: Desde CEO hasta clientes
- **Control de Acceso Granular**: Permisos específicos por rol
- **Dashboard Personalizado**: Interfaz adaptada a cada rol
- **Gestión de Empleados**: Sistema completo de recursos humanos

### Inteligencia Artificial
- **Asesor de Imagen Personal**: "María" - Consultora de moda IA
- **Chat Conversacional**: Interfaz estilo WhatsApp
- **Recomendaciones Personalizadas**: Basadas en preferencias
- **Análisis de Tendencias**: IA para predicción de moda

### Sistema de Promociones
- **Badges Dinámicos**: Ofertas, descuentos, nuevos productos
- **Precios Inteligentes**: Cálculo automático de descuentos
- **Campañas de Marketing**: Gestión visual de promociones
- **Fidelización**: Sistema de puntos y recompensas

### Arquitectura Empresarial
- **TypeScript**: Tipado estático para equipos grandes
- **Microservicios**: Arquitectura escalable y distribuida
- **Zustand**: Gestión de estado empresarial
- **Validación Robusta**: React Hook Form + Zod
- **Testing Completo**: Vitest + Testing Library
- **Seguridad Avanzada**: Sanitización y protección XSS

## 🛠️ Stack Tecnológico Completo

### Frontend Core
- React 18 + TypeScript 5
- Vite 5 (Build tool optimizado)
- Tailwind CSS 3 (Diseño empresarial)
- React Router DOM (SPA routing)

### Gestión de Estado
- Zustand (Estado global ligero)
- Persist middleware (Persistencia local)
- Immer (Inmutabilidad)

### Formularios y Validación
- React Hook Form (Performance optimizado)
- Zod (Validación TypeScript-first)
- DOMPurify (Sanitización HTML)

### Testing y Calidad
- Vitest + Testing Library
- ESLint + Prettier
- Husky (Git hooks)
- TypeScript strict mode

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Tests
npm run test

# Linting
npm run lint
```

## 🏗️ Arquitectura Empresarial

```
src/
├── components/                 # Componentes empresariales
│   ├── __tests__/             # Suite de testing completa
│   ├── auth/                  # Autenticación y roles
│   │   ├── RoleGuard.tsx     # Protección por roles
│   │   ├── LoginForm.tsx     # Formulario de login
│   │   └── PermissionCheck.tsx
│   ├── dashboard/             # Dashboards por rol
│   │   ├── CEODashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   └── EmployeeDashboard.tsx
│   ├── products/              # Gestión de productos
│   │   ├── ProductCard.tsx   # Card con promociones
│   │   ├── ProductManager.tsx # CRUD productos
│   │   └── PromotionBadge.tsx # Badges dinámicos
│   ├── ai/                    # Componentes de IA
│   │   ├── AIAssistant.tsx   # Chat "María"
│   │   └── Recommendations.tsx
│   ├── layout/                # Layout empresarial
│   │   ├── Header.tsx        # Header con roles
│   │   ├── Sidebar.tsx       # Navegación por rol
│   │   └── Footer.tsx
│   └── common/                # Componentes base
│       ├── Modal.tsx
│       ├── Button.tsx
│       └── LoadingSpinner.tsx
├── pages/                     # Páginas por rol
│   ├── public/               # Páginas públicas
│   │   ├── HomePage.tsx
│   │   ├── CatalogPage.tsx
│   │   └── LoginPage.tsx
│   ├── admin/                # Administración
│   │   ├── Dashboard.tsx
│   │   ├── UserManagement.tsx
│   │   └── Analytics.tsx
│   ├── employee/             # Empleados
│   │   ├── TaskDashboard.tsx
│   │   └── Schedule.tsx
│   └── customer/             # Clientes
│       ├── Profile.tsx
│       └── Orders.tsx
├── store/                    # Estado empresarial
│   ├── authStore.ts         # Autenticación y roles
│   ├── cartStore.ts         # Carrito de compras
│   ├── userStore.ts         # Datos de usuario
│   ├── notificationStore.ts # Notificaciones
│   └── aiStore.ts           # Estado del chat IA
├── types/                   # Tipos TypeScript
│   ├── auth.ts             # Tipos de autenticación
│   ├── products.ts         # Tipos de productos
│   ├── promotions.ts       # Tipos de promociones
│   ├── roles.ts            # Sistema de roles
│   └── api.ts              # Tipos de API
├── hooks/                  # Hooks empresariales
│   ├── useAuth.ts         # Hook de autenticación
│   ├── usePermissions.ts  # Hook de permisos
│   ├── useNotification.ts # Hook de notificaciones
│   └── useAI.ts           # Hook del asistente IA
├── utils/                 # Utilidades empresariales
│   ├── auth.ts           # Utilidades de auth
│   ├── permissions.ts    # Lógica de permisos
│   ├── sanitize.ts       # Sanitización segura
│   ├── validation.ts     # Validaciones
│   └── constants.ts      # Constantes del sistema
├── services/             # Servicios de API
│   ├── authService.ts   # Servicio de autenticación
│   ├── productService.ts # Servicio de productos
│   ├── aiService.ts     # Servicio de IA
│   └── apiClient.ts     # Cliente HTTP base
├── data/                # Datos y configuración
│   ├── roles.ts        # Definición de roles
│   ├── permissions.ts  # Matriz de permisos
│   ├── products.ts     # Productos mock
│   └── promotions.ts   # Promociones activas
└── test/               # Testing empresarial
    ├── setup.ts       # Configuración de tests
    ├── mocks/         # Mocks para testing
    └── fixtures/      # Datos de prueba
```

## 🔒 Seguridad Empresarial

### Autenticación y Autorización
- **JWT Tokens**: Autenticación segura con refresh tokens
- **Sistema de Roles**: 15+ roles con permisos granulares
- **RoleGuard**: Protección de componentes por rol
- **Session Management**: Gestión segura de sesiones

### Protección de Datos
- **Sanitización HTML**: DOMPurify para prevenir XSS
- **Validación Robusta**: Zod para validación TypeScript-first
- **CSRF Protection**: Protección contra ataques CSRF
- **Input Sanitization**: Sanitización de todas las entradas

### Código Seguro
- **TypeScript Strict**: Prevención de errores en compilación
- **ESLint Security**: Reglas de seguridad automatizadas
- **No DOM Manipulation**: Sin manipulación directa del DOM
- **Secure Headers**: Headers de seguridad configurados

## 🎨 Componentes Empresariales

### Sistema de Autenticación
**RoleGuard**: Protección granular de componentes
- Control de acceso por rol y permisos
- Redirección automática si no autorizado
- Fallback components para roles insuficientes
- Integración con sistema de notificaciones

**LoginForm**: Formulario empresarial de login
- Validación robusta con Zod
- Manejo de errores específicos
- Recordar sesión y auto-login
- Integración con backend de microservicios

### Gestión de Productos
**ProductCard**: Card empresarial con promociones
- Badges dinámicos (Oferta, Nuevo, Descuento)
- Cálculo automático de precios con descuentos
- Gestión de favoritos por usuario
- Lazy loading optimizado para catálogos grandes
- Modal de detalles con información completa

**ProductManager**: CRUD completo para administradores
- Creación y edición de productos
- Gestión de inventario en tiempo real
- Subida de imágenes con preview
- Validación de datos empresarial

**PromotionBadge**: Sistema de badges promocionales
- Badges configurables (color, texto, icono)
- Animaciones CSS para llamar la atención
- Lógica de visibilidad por fechas
- Integración con sistema de marketing

### Inteligencia Artificial
**AIAssistant**: "María" - Asesora de imagen personal
- Chat conversacional estilo WhatsApp
- Interfaz móvil responsive
- Animaciones suaves de entrada/salida
- Historial de conversaciones
- Recomendaciones personalizadas de moda
- Avatar personalizado y branding humano

### Dashboards por Rol
**CEODashboard**: Vista ejecutiva completa
- KPIs de ventas y rendimiento
- Gráficos de analytics avanzados
- Gestión de empleados de alto nivel
- Reportes financieros

**ManagerDashboard**: Gestión operativa
- Supervisión de equipos
- Métricas de productividad
- Gestión de inventario
- Aprobación de procesos

**EmployeeDashboard**: Vista de empleado
- Tareas asignadas
- Horarios y calendario
- Métricas personales
- Comunicación interna

### Layout Empresarial
**Header**: Navegación inteligente por roles
- Menús dinámicos según permisos
- Notificaciones en tiempo real
- Búsqueda global avanzada
- Perfil de usuario con configuraciones

**Sidebar**: Navegación lateral adaptativa
- Menús colapsables por sección
- Iconografía consistente
- Estados activos y hover
- Responsive para móviles

## 📱 Páginas por Rol

### Páginas Públicas
**HomePage**: Landing empresarial
- Hero section con productos destacados
- Categorías principales de moda
- Testimonios y reseñas
- Newsletter y suscripciones
- Chat IA "María" siempre disponible

**CatalogPage**: Catálogo avanzado
- Filtros multi-criterio (precio, talla, color, marca)
- Ordenamiento inteligente
- Paginación optimizada
- Vista grid/lista intercambiable
- Búsqueda con autocompletado

**LoginPage**: Autenticación empresarial
- Login para empleados y clientes
- Recuperación de contraseña
- Registro de nuevos usuarios
- Integración con sistemas externos

### Páginas Administrativas
**Dashboard**: Panel de control principal
- Métricas en tiempo real
- Gráficos interactivos
- Alertas y notificaciones
- Accesos rápidos por rol

**UserManagement**: Gestión de usuarios
- CRUD completo de usuarios
- Asignación de roles y permisos
- Historial de actividades
- Búsqueda y filtros avanzados

**ProductsManager**: Gestión de productos
- Inventario en tiempo real
- Creación masiva de productos
- Gestión de categorías
- Control de promociones

**Analytics**: Análisis empresarial
- Reportes de ventas
- Análisis de comportamiento
- Métricas de conversión
- Exportación de datos

### Páginas de Empleados
**TaskDashboard**: Gestión de tareas
- Lista de tareas asignadas
- Estados y prioridades
- Colaboración en equipo
- Seguimiento de tiempo

**Schedule**: Horarios y calendario
- Calendario personal
- Turnos de trabajo
- Solicitud de permisos
- Eventos corporativos

### Páginas de Clientes
**Profile**: Perfil personalizado
- Información personal
- Preferencias de moda
- Historial de compras
- Lista de deseos

**Orders**: Gestión de pedidos
- Historial completo
- Seguimiento en tiempo real
- Devoluciones y cambios
- Facturas y recibos

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Coverage
npm run test -- --coverage
```

## 🚀 Funcionalidades Implementadas

### ✅ Sistema de Roles Completo
- **15+ Roles Jerárquicos**: CEO, Directores, Gerentes, Empleados, Clientes
- **Control de Acceso Granular**: Permisos específicos por funcionalidad
- **RoleGuard**: Protección automática de componentes
- **Dashboards Personalizados**: Interfaz adaptada a cada rol
- **Gestión de Permisos**: Sistema flexible y escalable

### ✅ Inteligencia Artificial Integrada
- **"María" - Asesora Personal**: Chat conversacional de moda
- **Interfaz WhatsApp-Style**: UX familiar y amigable
- **Recomendaciones IA**: Basadas en preferencias y historial
- **Chat Flotante**: Acceso desde cualquier página
- **Personalización Completa**: Avatar, nombre y personalidad

### ✅ Sistema de Promociones Avanzado
- **Badges Dinámicos**: Oferta, Nuevo, Descuento, Limitado
- **Cálculo Automático**: Precios con descuentos en tiempo real
- **Promociones Temporales**: Control por fechas
- **Marketing Visual**: Colores y animaciones llamativas
- **Gestión Centralizada**: Panel de control de promociones

### ✅ Arquitectura Empresarial
- **Microservicios Ready**: Preparado para arquitectura distribuida
- **TypeScript Strict**: Tipado completo y seguro
- **Componentes Modulares**: Reutilizables y escalables
- **Estado Global**: Zustand con persistencia
- **Routing Avanzado**: React Router con protección por roles

### ✅ Seguridad de Nivel Empresarial
- **Autenticación JWT**: Tokens seguros con refresh
- **Sanitización Completa**: DOMPurify en todas las entradas
- **Validación Robusta**: Zod con TypeScript
- **Protección XSS**: Sin manipulación directa del DOM
- **RBAC**: Role-Based Access Control completo

### ✅ Performance Optimizada
- **Lazy Loading**: Imágenes y componentes
- **Code Splitting**: Carga bajo demanda
- **Bundle Optimizado**: Vite + Tailwind CSS purge
- **Caching Inteligente**: Zustand persist
- **Responsive Images**: Optimización automática

### ✅ UX/UI Empresarial
- **Design System**: Componentes consistentes
- **Responsive Design**: Mobile-first approach
- **Notificaciones**: Sistema no intrusivo
- **Estados de Carga**: Feedback visual completo
- **Accesibilidad**: WCAG 2.1 compliance
- **Animaciones Suaves**: CSS transitions optimizadas

### ✅ Testing y Calidad
- **Testing Unitario**: Vitest + Testing Library
- **Coverage Completo**: Cobertura de código
- **ESLint + Prettier**: Calidad de código automatizada
- **TypeScript Strict**: Prevención de errores
- **Git Hooks**: Husky para pre-commit

### ✅ Gestión de Productos
- **CRUD Completo**: Crear, leer, actualizar, eliminar
- **Inventario Real**: Gestión de stock
- **Categorías**: Sistema jerárquico
- **Búsqueda Avanzada**: Filtros multi-criterio
- **Imágenes**: Subida y gestión optimizada

## 🔄 Roadmap de Desarrollo

### 🎯 Próximas Funcionalidades
- [ ] **Realidad Aumentada**: Probador virtual de ropa
- [ ] **IA Avanzada**: Análisis de tendencias y predicciones
- [ ] **Sistema de Crédito**: Financiamiento interno
- [ ] **Logística Inteligente**: Tracking en tiempo real
- [ ] **Social Commerce**: Reseñas y comunidad
- [ ] **Marketing Automation**: Campañas automáticas

### 🔧 Mejoras Técnicas
- [ ] **PWA Completa**: Offline-first capabilities
- [ ] **Micro-frontends**: Arquitectura distribuida
- [ ] **GraphQL**: API más eficiente
- [ ] **WebRTC**: Chat de video con asesores
- [ ] **WebAssembly**: Procesamiento de imágenes
- [ ] **Service Workers**: Caching avanzado

### 🌐 Escalabilidad
- [ ] **Internacionalización**: Multi-idioma y moneda
- [ ] **Multi-tenant**: Soporte para múltiples tiendas
- [ ] **CDN Integration**: Distribución global
- [ ] **Load Balancing**: Balanceador de carga
- [ ] **Monitoring**: APM y observabilidad
- [ ] **Auto-scaling**: Escalado automático

### 🧪 Testing y CI/CD
- [ ] **E2E Testing**: Playwright automation
- [ ] **Visual Testing**: Chromatic integration
- [ ] **Performance Testing**: Lighthouse CI
- [ ] **Security Testing**: SAST/DAST automation
- [ ] **CI/CD Pipeline**: GitHub Actions
- [ ] **Blue-Green Deployment**: Zero-downtime deploys

## 📄 Scripts de Desarrollo

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo (localhost:3005)
npm run dev:host     # Servidor accesible en red local
npm run dev:https    # Servidor HTTPS para testing
```

### Build y Deploy
```bash
npm run build        # Build optimizado para producción
npm run preview      # Preview del build local
npm run build:analyze # Análisis del bundle size
```

### Testing
```bash
npm run test         # Tests unitarios
npm run test:ui      # Tests con interfaz visual
npm run test:coverage # Coverage completo
npm run test:watch   # Tests en modo watch
```

### Calidad de Código
```bash
npm run lint         # ESLint linting
npm run lint:fix     # Auto-fix de errores
npm run format       # Prettier formatting
npm run type-check   # Verificación TypeScript
```

### Utilidades
```bash
npm run clean        # Limpiar node_modules y dist
npm run deps:update  # Actualizar dependencias
npm run deps:audit   # Auditoría de seguridad
```

## 🏢 Arquitectura del Sistema Completo

### Microservicios Backend
- **Auth Service** (Puerto 3001): Autenticación y roles
- **Catalog Service** (Puerto 3002): Productos y categorías
- **Transaction Service** (Puerto 3003): Carritos y pagos
- **Logistics Service** (Puerto 3004): Inventario y entregas
- **Social Service** (Puerto 3005): Reseñas y comunidad
- **Marketing Service** (Puerto 3006): Promociones y campañas
- **AI Service** (Puerto 3007): IA y recomendaciones
- **Credit Service** (Puerto 3008): Sistema de crédito

### Bases de Datos
- **PostgreSQL** (Puerto 5432): Datos transaccionales
- **MongoDB** (Puerto 27017): Datos no estructurados
- **Redis** (Puerto 6379): Cache y sesiones

### Infraestructura
- **API Gateway** (Puerto 3000): Punto de entrada único
- **Frontend** (Puerto 3005): Aplicación React
- **RabbitMQ** (Puerto 5672): Mensajería asíncrona
- **Elasticsearch** (Puerto 9200): Búsqueda avanzada

## 🤝 Guía de Contribución

### Configuración del Entorno
1. **Fork y Clone**:
```bash
git clone https://github.com/tu-usuario/stylehub-frontend.git
cd stylehub-frontend
npm install
```

2. **Configuración de Desarrollo**:
```bash
cp .env.example .env.local
npm run dev
```

### Estándares de Código
- **TypeScript**: Tipado estricto obligatorio
- **ESLint**: Configuración empresarial
- **Prettier**: Formato automático
- **Conventional Commits**: Mensajes estandarizados
- **Husky**: Pre-commit hooks

### Flujo de Trabajo
1. Crear rama desde `develop`
2. Implementar feature con tests
3. Ejecutar `npm run lint` y `npm run test`
4. Commit con mensaje convencional
5. Push y crear Pull Request
6. Code review obligatorio
7. Merge a `develop`

### Estructura de Commits
```
feat(auth): agregar sistema de roles empresarial
fix(ui): corregir responsive en mobile
docs(readme): actualizar documentación de API
test(components): agregar tests para ProductCard
```

## 📞 Soporte y Contacto

- **Documentación**: `/docs` en el repositorio
- **Issues**: GitHub Issues para bugs y features
- **Discussions**: GitHub Discussions para preguntas
- **Wiki**: Documentación técnica detallada

## 📊 Métricas del Proyecto

- **Líneas de Código**: ~15,000 LOC
- **Componentes**: 50+ componentes reutilizables
- **Páginas**: 20+ páginas por rol
- **Tests**: 90%+ coverage
- **Performance**: Lighthouse 95+ score
- **Bundle Size**: <500KB gzipped