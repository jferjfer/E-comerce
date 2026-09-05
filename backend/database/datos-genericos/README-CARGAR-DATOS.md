# Cargar Datos Genéricos - E-commerce de Ropa

## 🚀 Instrucciones de Carga

### Opción 1: Automática (Recomendada)
```bash
# Ejecutar como Administrador
cargar-datos-admin.bat
```

### Opción 2: Manual
```bash
# PostgreSQL - Ejecutar en cada base de datos
docker exec -i postgres_auth psql -U postgres -d auth_db < insertar-datos-postgres.sql
docker exec -i postgres_transactions psql -U postgres -d transactions_db < insertar-datos-postgres.sql
docker exec -i postgres_logistics psql -U postgres -d logistics_db < insertar-datos-postgres.sql
docker exec -i postgres_credit psql -U postgres -d credit_db < insertar-datos-postgres.sql
docker exec -i postgres_marketing psql -U postgres -d marketing_db < insertar-datos-postgres.sql

# MongoDB
docker cp insertar-datos-mongodb.js mongodb:/tmp/insertar-datos-mongodb.js
docker exec mongodb mongosh --eval "load('/tmp/insertar-datos-mongodb.js')"
```

## 📊 Datos Incluidos

### PostgreSQL
- **5 usuarios** con direcciones completas
- **5 pedidos** con diferentes estados
- **Carritos activos** con productos
- **Inventario** distribuido en 3 almacenes
- **6 cupones** de descuento activos
- **Programas de fidelización** con puntos
- **Transacciones de crédito**
- **Campañas de marketing**

### MongoDB
- **6 categorías** de ropa (Mujer, Hombre, Vestidos, etc.)
- **3 productos** de ropa detallados:
  - Vestido Floral Primavera (€69.99)
  - Camiseta Básica Premium (€24.99)
  - Jeans Skinny Mujer (€59.99)
- **Reseñas y preguntas** de usuarios
- **Listas de deseos**
- **Recomendaciones de IA** personalizadas
- **Análisis de estilo** de usuarios

## 🔍 Verificar Datos Cargados

### PostgreSQL
```sql
-- Ver usuarios
docker exec -it postgres_auth psql -U postgres -d auth_db -c "SELECT nombre_completo, email FROM usuarios;"

-- Ver pedidos
docker exec -it postgres_transactions psql -U postgres -d transactions_db -c "SELECT numero_pedido, estado, total FROM pedidos;"

-- Ver inventario
docker exec -it postgres_logistics psql -U postgres -d logistics_db -c "SELECT producto_id, cantidad_disponible FROM inventario;"
```

### MongoDB
```javascript
// Ver productos
docker exec -it mongodb mongosh --eval "use('catalogo_db'); db.productos.find({}, {nombre: 1, precio: 1})"

// Ver categorías
docker exec -it mongodb mongosh --eval "use('catalogo_db'); db.categorias.find({}, {nombre: 1, descripcion: 1})"
```

## 🌐 Endpoints para Probar

Una vez cargados los datos, puedes probar:

- **API Gateway**: http://localhost:3000
- **Usuarios**: http://localhost:3000/api/auth/usuarios
- **Productos**: http://localhost:3000/api/productos
- **Categorías**: http://localhost:3000/api/categorias
- **Pedidos**: http://localhost:3000/api/pedidos
- **Inventario**: http://localhost:3000/api/inventario

## ⚠️ Requisitos

1. **Docker Desktop** ejecutándose
2. **Permisos de Administrador** en Windows
3. **Contenedores activos** (ejecutar `iniciar-proyecto.bat` primero)
4. **Bases de datos creadas** (se crean automáticamente al iniciar servicios)

## 🔧 Solución de Problemas

### Error: "Acceso denegado"
- Ejecutar como Administrador
- Verificar que Docker Desktop esté ejecutándose

### Error: "Container not found"
- Ejecutar `docker ps` para ver contenedores activos
- Ejecutar `iniciar-proyecto.bat` primero

### Error: "Database does not exist"
- Los servicios crean las bases de datos automáticamente
- Verificar que los servicios estén ejecutándose