# 🗄️ StyleHub - Configuración de Bases de Datos

Sistema completo de bases de datos para la plataforma e-commerce empresarial StyleHub.

## 📋 Arquitectura de Datos

### 🐘 PostgreSQL - Datos Transaccionales
- **stylehub_auth**: Sistema de autenticación y roles empresariales
- **stylehub_catalog**: Catálogo de productos, categorías y promociones
- **stylehub_transactions**: Carritos, pedidos, pagos y facturación
- **stylehub_logistics**: Inventario, almacenes, envíos y devoluciones
- **stylehub_credit**: Sistema de crédito interno y financiamiento

### 🍃 MongoDB - Datos No Estructurados
- **stylehub_ai**: IA conversacional, recomendaciones y análisis de tendencias
- **stylehub_social**: Reseñas, comunidad, outfits e influencers
- **stylehub_marketing**: Campañas, fidelización y analytics de marketing

### ⚡ Redis - Cache y Sesiones
- Sesiones de usuario activas
- Cache de productos populares
- Rate limiting para APIs
- Notificaciones en tiempo real

### 🔍 Elasticsearch - Búsqueda Avanzada
- Índice de productos con búsqueda full-text
- Autocompletado y sugerencias
- Filtros avanzados y facetas

## 🚀 Instalación Local

### Prerrequisitos
```bash
# PostgreSQL 15+
# MongoDB 7.0+
# Redis 7+
# Elasticsearch 8.11+
```

### Configuración Automática
```bash
# Ejecutar script de configuración
cd database
setup_local.bat
```

### Configuración Manual

#### 1. PostgreSQL
```sql
-- Crear bases de datos
psql -U postgres -f postgres/00_setup_databases.sql

-- Ejecutar esquemas por servicio
psql -U postgres -d stylehub_auth -f postgres/01_auth_service_new.sql
psql -U postgres -d stylehub_catalog -f postgres/02_catalog_service.sql
psql -U postgres -d stylehub_transactions -f postgres/03_transactions_service.sql
psql -U postgres -d stylehub_logistics -f postgres/04_logistics_service.sql
psql -U postgres -d stylehub_credit -f postgres/05_credit_service.sql
```

#### 2. MongoDB
```bash
# Ejecutar esquemas de MongoDB
mongosh --file mongodb/01_ai_service_complete.js
mongosh --file mongodb/02_social_service.js
mongosh --file mongodb/03_marketing_service.js
```

## 🏗️ Esquemas Detallados

### Auth Service (PostgreSQL)
```sql
-- 18 roles jerárquicos (CEO → Invitado)
-- Sistema granular de permisos
-- Auditoría completa de acciones
-- Gestión segura de sesiones
-- Historial de contraseñas
```

**Tablas principales:**
- `usuarios` - Información completa de usuarios
- `roles` - Definición de roles empresariales
- `permisos` - Permisos granulares del sistema
- `sesiones_usuario` - Gestión de sesiones JWT
- `auditoria_sistema` - Log completo de acciones

### Catalog Service (PostgreSQL)
```sql
-- Productos con variantes (tallas, colores)
-- Sistema de categorías jerárquicas
-- Promociones y descuentos dinámicos
-- Atributos personalizables
-- Gestión de imágenes multimedia
```

**Tablas principales:**
- `productos` - Catálogo principal
- `variantes_producto` - Tallas, colores, etc.
- `categorias` - Estructura jerárquica
- `promociones` - Sistema de ofertas
- `imagenes_producto` - Multimedia

### Transactions Service (PostgreSQL)
```sql
-- Carritos persistentes y de invitados
-- Pedidos con estados completos
-- Sistema de pagos multi-método
-- Cupones y descuentos
-- Facturación automática
```

**Tablas principales:**
- `carritos` - Carritos de compra
- `pedidos` - Gestión completa de pedidos
- `pagos` - Procesamiento de pagos
- `cupones` - Sistema de descuentos
- `facturas` - Facturación automática

### Logistics Service (PostgreSQL)
```sql
-- Inventario multi-almacén
-- Gestión de ubicaciones específicas
-- Órdenes de compra a proveedores
-- Sistema de envíos y tracking
-- Devoluciones y cambios
```

**Tablas principales:**
- `inventario` - Stock por ubicación
- `almacenes` - Gestión de almacenes
- `envios` - Logística de entregas
- `devoluciones` - Proceso de devoluciones
- `proveedores` - Gestión de proveedores

### Credit Service (PostgreSQL)
```sql
-- Solicitudes de crédito interno
-- Evaluación crediticia automatizada
-- Sistema de cuotas y amortización
-- Cálculo automático de mora
-- Reportes a centrales de riesgo
```

**Tablas principales:**
- `solicitudes_credito` - Proceso de solicitud
- `creditos` - Créditos aprobados
- `cuotas_credito` - Sistema de pagos
- `pagos_credito` - Historial de pagos
- `historial_crediticio` - Scoring interno

### AI Service (MongoDB)
```javascript
// Conversaciones con "María" (Asesora IA)
// Perfiles de usuario para personalización
// Sistema de recomendaciones híbrido
// Análisis predictivo de tendencias
// Sesiones de realidad aumentada
```

**Colecciones principales:**
- `conversaciones_maria` - Chat conversacional
- `perfiles_usuario_ia` - Personalización IA
- `recomendaciones_ia` - Sistema de recomendaciones
- `analisis_tendencias` - Predicción de moda
- `sesiones_ar` - Realidad aumentada

### Social Service (MongoDB)
```javascript
// Reseñas verificadas de productos
// Sistema de preguntas y respuestas
// Listas de deseos compartibles
// Creación de outfits
// Programa de influencers
```

**Colecciones principales:**
- `resenas_productos` - Reseñas verificadas
- `preguntas_productos` - Q&A comunidad
- `listas_deseos` - Wishlist social
- `outfits` - Combinaciones de moda
- `influencers` - Programa de afiliados

### Marketing Service (MongoDB)
```javascript
// Campañas de email marketing
// Segmentación avanzada de usuarios
// Programa de fidelización con puntos
// Sistema de recompensas
// Analytics de marketing completo
```

**Colecciones principales:**
- `campanas_marketing` - Campañas automatizadas
- `segmentos_usuarios` - Segmentación inteligente
- `programa_fidelizacion` - Sistema de puntos
- `recompensas` - Catálogo de beneficios
- `analytics_marketing` - Métricas y ROI

## 🔐 Seguridad

### Autenticación
- Contraseñas hasheadas con bcrypt
- Tokens JWT con refresh tokens
- Bloqueo por intentos fallidos
- Auditoría completa de accesos

### Autorización
- Sistema RBAC (Role-Based Access Control)
- Permisos granulares por módulo
- Jerarquía de roles empresariales
- Validación en cada endpoint

### Datos Sensibles
- Encriptación de información financiera
- Anonimización de datos personales
- Cumplimiento GDPR/LOPD
- Backup automático encriptado

## 📊 Rendimiento

### Índices Optimizados
```sql
-- PostgreSQL
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_inventario_producto ON inventario(producto_id);

-- MongoDB
db.conversaciones_maria.createIndex({ usuario_id: 1 });
db.recomendaciones_ia.createIndex({ fecha_expiracion: 1 }, { expireAfterSeconds: 0 });
```

### Particionamiento
- Tablas de auditoría por fecha
- Logs de actividad por mes
- Archivado automático de datos antiguos

### Cache Strategy
- Redis para datos frecuentes
- Cache de productos populares
- Sesiones en memoria
- Rate limiting por usuario

## 🔄 Mantenimiento

### Backups Automáticos
```bash
# PostgreSQL
pg_dump stylehub_auth > backup_auth_$(date +%Y%m%d).sql

# MongoDB
mongodump --db stylehub_ai --out backup_$(date +%Y%m%d)
```

### Monitoreo
- Métricas de rendimiento
- Alertas de espacio en disco
- Monitoreo de conexiones
- Logs de errores centralizados

### Limpieza Automática
- Sesiones expiradas
- Logs antiguos (>90 días)
- Cache obsoleto
- Datos temporales

## 🌐 Escalabilidad

### Replicación
- Master-Slave para PostgreSQL
- Replica Set para MongoDB
- Redis Cluster para alta disponibilidad

### Sharding
- Particionamiento horizontal por usuario
- Distribución geográfica
- Load balancing automático

### Microservicios
- Base de datos por servicio
- Comunicación asíncrona
- Event sourcing para auditoría

## 📈 Métricas y Analytics

### KPIs del Sistema
- Tiempo de respuesta por query
- Throughput de transacciones
- Uso de memoria y CPU
- Conexiones concurrentes

### Business Intelligence
- Dashboards en tiempo real
- Reportes automatizados
- Análisis predictivo
- Alertas de negocio

## 🛠️ Herramientas de Desarrollo

### Administración
- **pgAdmin**: Gestión PostgreSQL
- **MongoDB Compass**: Gestión MongoDB
- **Redis Commander**: Gestión Redis
- **Kibana**: Visualización Elasticsearch

### Desarrollo
- **Prisma**: ORM para PostgreSQL
- **Mongoose**: ODM para MongoDB
- **ioredis**: Cliente Redis optimizado
- **@elastic/elasticsearch**: Cliente ES

## 📞 Soporte

### Documentación
- Esquemas detallados por servicio
- Ejemplos de queries comunes
- Guías de troubleshooting
- Best practices de desarrollo

### Contacto
- **Issues**: GitHub Issues para bugs
- **Discussions**: Preguntas técnicas
- **Wiki**: Documentación extendida
- **Slack**: Canal #database-support

---

**Versión**: 1.0.0  
**Última actualización**: $(date)  
**Mantenido por**: Equipo de Arquitectura StyleHub