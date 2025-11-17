@echo off
echo ========================================
echo    CARGANDO DATOS GENERICOS
echo ========================================

echo.
echo 📊 Insertando datos en PostgreSQL...

echo 🔐 Cargando datos de autenticacion...
docker exec -i postgres_auth psql -U postgres -d auth_db < insertar-datos-postgres.sql

echo 💳 Cargando datos de transacciones...
docker exec -i postgres_transactions psql -U postgres -d transactions_db < insertar-datos-postgres.sql

echo 📦 Cargando datos de logistica...
docker exec -i postgres_logistics psql -U postgres -d logistics_db < insertar-datos-postgres.sql

echo 💰 Cargando datos de credito...
docker exec -i postgres_credit psql -U postgres -d credit_db < insertar-datos-postgres.sql

echo 🎯 Cargando datos de marketing...
docker exec -i postgres_marketing psql -U postgres -d marketing_db < insertar-datos-postgres.sql

echo.
echo 📊 Insertando datos en MongoDB...

echo 📱 Cargando datos de catalogo, social y AI...
docker exec -i mongodb mongosh --eval "load('/data/insertar-datos-mongodb.js')"

echo.
echo ✅ Todos los datos genericos han sido cargados exitosamente
echo.
echo 🌐 Puedes probar los endpoints en:
echo    - API Gateway: http://localhost:3000
echo    - Usuarios: http://localhost:3000/api/auth/usuarios
echo    - Productos: http://localhost:3000/api/productos
echo    - Pedidos: http://localhost:3000/api/pedidos
echo.
pause