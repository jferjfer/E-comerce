@echo off
echo ========================================
echo    CARGANDO DATOS GENERICOS (ADMIN)
echo ========================================
echo.
echo ⚠️  EJECUTAR COMO ADMINISTRADOR
echo.

REM Verificar si Docker está ejecutándose
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está disponible o no tienes permisos de administrador
    echo.
    echo 💡 Soluciones:
    echo    1. Ejecuta este script como Administrador
    echo    2. Asegúrate de que Docker Desktop esté ejecutándose
    echo.
    pause
    exit /b 1
)

echo 📊 Insertando datos en PostgreSQL...

echo 🔐 Cargando datos de autenticacion...
docker exec -i postgres_auth psql -U postgres -d auth_db < insertar-datos-postgres.sql
if %errorlevel% neq 0 (
    echo ❌ Error cargando datos de autenticación
    goto :error
)

echo 💳 Cargando datos de transacciones...
docker exec -i postgres_transactions psql -U postgres -d transactions_db < insertar-datos-postgres.sql
if %errorlevel% neq 0 (
    echo ❌ Error cargando datos de transacciones
    goto :error
)

echo 📦 Cargando datos de logistica...
docker exec -i postgres_logistics psql -U postgres -d logistics_db < insertar-datos-postgres.sql
if %errorlevel% neq 0 (
    echo ❌ Error cargando datos de logística
    goto :error
)

echo 💰 Cargando datos de credito...
docker exec -i postgres_credit psql -U postgres -d credit_db < insertar-datos-postgres.sql
if %errorlevel% neq 0 (
    echo ❌ Error cargando datos de crédito
    goto :error
)

echo 🎯 Cargando datos de marketing...
docker exec -i postgres_marketing psql -U postgres -d marketing_db < insertar-datos-postgres.sql
if %errorlevel% neq 0 (
    echo ❌ Error cargando datos de marketing
    goto :error
)

echo.
echo 📊 Insertando datos en MongoDB...

echo 📱 Copiando script a contenedor MongoDB...
docker cp insertar-datos-mongodb.js mongodb:/tmp/insertar-datos-mongodb.js
if %errorlevel% neq 0 (
    echo ❌ Error copiando script a MongoDB
    goto :error
)

echo 📱 Ejecutando script en MongoDB...
docker exec mongodb mongosh --eval "load('/tmp/insertar-datos-mongodb.js')"
if %errorlevel% neq 0 (
    echo ❌ Error ejecutando script en MongoDB
    goto :error
)

echo.
echo ✅ Todos los datos genéricos han sido cargados exitosamente
echo.
echo 🌐 Puedes probar los endpoints en:
echo    - API Gateway: http://localhost:3000
echo    - Usuarios: http://localhost:3000/api/auth/usuarios
echo    - Productos: http://localhost:3000/api/productos
echo    - Pedidos: http://localhost:3000/api/pedidos
echo.
echo 📊 Datos cargados:
echo    - 5 usuarios con direcciones
echo    - 3 productos de ropa (vestidos, camisetas, jeans)
echo    - 5 pedidos con elementos
echo    - Inventario en 3 almacenes
echo    - 6 cupones activos
echo    - Programas de fidelización
echo    - Reseñas y recomendaciones de IA
echo.
goto :success

:error
echo.
echo ❌ Error durante la carga de datos
echo.
echo 💡 Verifica que:
echo    1. Docker Desktop esté ejecutándose
echo    2. Los contenedores estén activos: docker ps
echo    3. Las bases de datos estén creadas
echo.
pause
exit /b 1

:success
pause