# Frontend Vue.js - E-Commerce

## Descripción

Frontend Vue.js que replica **exactamente** el diseño y funcionalidad del archivo `tema-ecomerce.html` de referencia.

## Funcionalidades Implementadas

### ✅ Navegación SPA Completa
- **Listado de Productos** - Vista principal con filtros y productos
- **Detalle de Producto** - Vista detallada con selección de tallas, cantidad y AR
- **Carrito de Compras** - Gestión completa del carrito
- **Checkout** - Proceso de pago con múltiples métodos

### ✅ Modales Funcionales
- **Modal de Autenticación** - Login y registro completo con validación
- **Modal Asesor Outfit IA** - Wizard de 3 pasos para recomendaciones
- **Modal de Realidad Aumentada** - Simulación de prueba virtual

### ✅ Características Avanzadas
- **Sistema de Carrito** - Gestión de productos, tallas y cantidades
- **Gestión de Stock** - Indicadores visuales de disponibilidad
- **Validación de Formularios** - Validación en tiempo real
- **Diseño Responsive** - Adaptable a todos los dispositivos
- **Tema Minimalista** - Diseño sofisticado y elegante

## Estructura del Proyecto

```
frontend-vue/
├── src/
│   ├── views/
│   │   ├── ProductListing.vue    # Listado de productos
│   │   ├── ProductDetail.vue     # Detalle de producto
│   │   ├── CartView.vue          # Carrito de compras
│   │   └── CheckoutView.vue      # Proceso de pago
│   ├── styles/
│   │   └── global.css           # Estilos globales del tema
│   ├── App.vue                  # Componente principal
│   └── main.js                  # Punto de entrada
├── package.json
├── tailwind.config.js
└── vue.config.js
```

## Instalación y Uso

### Opción 1: Script Automático
```bash
# Ejecutar el script de inicio
iniciar-frontend-vue.bat
```

### Opción 2: Manual
```bash
# Navegar al directorio
cd frontend-vue

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run serve
```

## URLs de Acceso

- **Frontend Vue.js**: http://localhost:3005
- **API Gateway**: http://localhost:3000 (si está ejecutándose)

## Tecnologías Utilizadas

- **Vue.js 3** - Framework principal
- **Tailwind CSS** - Framework de estilos
- **Inter Font** - Tipografía
- **Pexels Images** - Imágenes de productos reales

## Funcionalidades Detalladas

### 🛍️ Navegación de Productos
- Listado con filtros por categoría, talla y precio
- Tarjetas de producto con información completa
- Navegación fluida entre vistas

### 📱 Detalle de Producto
- Galería de imágenes con miniaturas
- Selección de tallas con indicadores de stock
- Control de cantidad con validación
- Botones de "Probar AR" y "Añadir al Carrito"
- Información de pagos y envíos

### 🛒 Carrito de Compras
- Lista de productos con imágenes
- Gestión de cantidades
- Cálculo automático de totales
- Eliminación de productos

### 💳 Proceso de Checkout
- Formulario de datos de envío
- Selección de método de pago:
  - Tarjeta de Crédito/Débito
  - PSE (Pagos Seguros en Línea)
  - Efectivo Contra Entrega (COD)
- Resumen final del pedido

### 🤖 Asesor Outfit IA
- Wizard de 3 pasos:
  1. Selección de ocasión
  2. Estilo/vibe deseado
  3. Tipo de corte preferido
- Generación de recomendaciones personalizadas
- Añadir outfit completo al carrito

### 📱 Realidad Aumentada
- Simulación de prueba virtual
- Overlay de producto sobre feed de cámara
- Experiencia inmersiva

### 🔐 Sistema de Autenticación
- **Login** con validación de email
- **Registro** completo con:
  - Datos personales (nombres, apellidos)
  - Documento de identidad
  - Información de contacto
  - Validación de contraseña en tiempo real
  - Confirmación por email simulada

## Datos Mock

El sistema incluye 6 productos de ejemplo con:
- Imágenes reales de Pexels
- Precios en pesos colombianos
- Variantes de tallas con stock real
- Descripciones detalladas

## Diseño y UX

### Tema Minimalista Puro
- Paleta de colores sofisticada
- Tipografía Inter para legibilidad
- Sombras y bordes redondeados
- Transiciones suaves
- Diseño responsive

### Componentes Interactivos
- Botones con efectos hover
- Modales con animaciones
- Indicadores de estado
- Mensajes de confirmación
- Validación visual

## Integración con Backend

El frontend está preparado para integrarse con los microservicios:
- **Auth Service** (puerto 3001)
- **Catalog Service** (puerto 3002)
- **Transaction Service** (puerto 3003)
- **Social Service** (puerto 3004)

## Próximos Pasos

1. **Integración con APIs** - Conectar con microservicios reales
2. **Estado Global** - Implementar Vuex/Pinia para gestión de estado
3. **Persistencia** - LocalStorage para carrito y preferencias
4. **PWA** - Convertir en Progressive Web App
5. **Testing** - Pruebas unitarias y e2e

## Notas Técnicas

- **SPA sin Router** - Navegación interna como en el HTML de referencia
- **Inyección de Dependencias** - Uso de provide/inject de Vue 3
- **Eventos Globales** - Para interacción con HTML renderizado dinámicamente
- **CSS Variables** - Para consistencia del tema
- **Responsive Design** - Mobile-first approach

---

**Desarrollado por**: Equipo E-Commerce  
**Versión**: 1.0.0  
**Fecha**: 2024