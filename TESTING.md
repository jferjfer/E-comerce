# 🧪 Pruebas Unitarias - E-Commerce Estilo y Moda

## 📋 Estructura de Pruebas

```
tests/
├── unit/              # Pruebas unitarias de servicios individuales
│   ├── auth.test.js
│   ├── catalog.test.js
│   ├── marketing.test.js
│   └── ai.test.js
├── integration/       # Pruebas de integración entre servicios
│   └── gateway.test.js
└── e2e/              # Pruebas end-to-end del flujo completo
    └── flujo-completo.test.js
```

## 🚀 Ejecutar Pruebas

### Prerequisitos
```bash
# Asegúrate de que todos los servicios estén corriendo
docker compose up -d

# Instalar dependencias (solo primera vez)
npm install
```

### Comandos de Pruebas

```bash
# Todas las pruebas
npm test

# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration

# Solo pruebas E2E
npm run test:e2e

# Con reporte de cobertura
npm run test:coverage

# Script completo con verificación
./run-tests.sh
```

## 📊 Cobertura de Pruebas

### Auth Service (4 tests)
- ✅ Health check
- ✅ Login exitoso
- ✅ Login fallido
- ✅ Registro duplicado

### Catalog Service (5 tests)
- ✅ Health check
- ✅ Listar productos
- ✅ Obtener producto por ID
- ✅ Listar categorías
- ✅ Producto inexistente (404)

### Marketing Service (5 tests)
- ✅ Health check
- ✅ Listar cupones
- ✅ Listar campañas
- ✅ Estructura de cupones
- ✅ Estructura de campañas

### AI Service (4 tests)
- ✅ Health check
- ✅ Chat simple
- ✅ Recomendación de productos
- ✅ Estadísticas

### Gateway (5 tests)
- ✅ Health check
- ✅ Estado de servicios
- ✅ Proxy a productos
- ✅ Proxy a cupones
- ✅ Ruta inexistente (404)

### E2E (6 tests)
- ✅ Login de usuario
- ✅ Listar productos
- ✅ Ver detalle producto
- ✅ Consultar cupones
- ✅ Chat IA
- ✅ Verificar token

## 📈 Total: 29 Pruebas

## 🔧 Configuración

Las pruebas están configuradas en:
- `jest.config.js` - Configuración de Jest
- `package.json` - Scripts de ejecución

## 🎯 Servicios Probados

- Auth Service (Puerto 3011)
- Catalog Service (Puerto 3002)
- Marketing Service (Puerto 3006)
- AI Service (Puerto 3007)
- Gateway (Puerto 3000)

## ⚠️ Notas

- Los servicios deben estar corriendo antes de ejecutar las pruebas
- Las pruebas E2E usan credenciales de demo: `demo@estilomoda.com` / `admin123`
- Timeout configurado a 10 segundos por test
- Cobertura de código se genera en carpeta `coverage/`
