@echo off
echo ====================================================
echo ESTILO Y MODA - CONFIGURACION COMPLETA DE BASES DE DATOS
echo ====================================================
echo.

echo [1/8] Configurando PostgreSQL - Bases de datos principales...
echo.
echo Creando bases de datos...
psql -U postgres -c "CREATE DATABASE stylehub_auth;"
psql -U postgres -c "CREATE DATABASE stylehub_catalog;"
psql -U postgres -c "CREATE DATABASE stylehub_transactions;"
psql -U postgres -c "CREATE DATABASE stylehub_logistics;"
psql -U postgres -c "CREATE DATABASE stylehub_credit;"

echo.
echo Creando usuario de aplicacion...
psql -U postgres -c "CREATE USER stylehub_user WITH PASSWORD 'stylehub_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE stylehub_auth TO stylehub_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE stylehub_catalog TO stylehub_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE stylehub_transactions TO stylehub_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE stylehub_logistics TO stylehub_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE stylehub_credit TO stylehub_user;"

echo.
echo [2/8] Configurando esquemas PostgreSQL...
echo Ejecutando Auth Service...
psql -U postgres -d stylehub_auth -f "postgres\01_auth_service_new.sql"

echo Ejecutando Catalog Service...
psql -U postgres -d stylehub_catalog -f "postgres\02_catalog_service.sql"

echo Ejecutando Transactions Service...
psql -U postgres -d stylehub_transactions -f "postgres\03_transactions_service.sql"

echo Ejecutando Logistics Service...
psql -U postgres -d stylehub_logistics -f "postgres\04_logistics_service.sql"

echo Ejecutando Credit Service...
psql -U postgres -d stylehub_credit -f "postgres\05_credit_service.sql"

echo.
echo [3/8] Configurando MongoDB - Bases de datos NoSQL...
echo Ejecutando AI Service...
mongosh --file "mongodb\01_ai_service_complete.js"

echo Ejecutando Social Service...
mongosh --file "mongodb\02_social_service.js"

echo Ejecutando Marketing Service...
mongosh --file "mongodb\03_marketing_service.js"

echo.
echo [4/8] Verificando conexiones PostgreSQL...
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'stylehub_%%';"

echo.
echo [5/8] Verificando conexiones MongoDB...
mongosh --eval "show dbs"

echo.
echo [6/8] Insertando datos de prueba...
echo Creando usuario administrador...
psql -U postgres -d stylehub_auth -c "INSERT INTO usuarios (nombre, apellido, email, contrasena_hash, rol_id, departamento) SELECT 'Admin', 'Sistema', 'admin@estiloymodaco.com', crypt('Admin123!', gen_salt('bf')), r.id, 'Tecnologia' FROM roles r WHERE r.nombre = 'CEO' ON CONFLICT DO NOTHING;"

echo Creando categorias de productos...
psql -U postgres -d stylehub_catalog -c "INSERT INTO categorias (nombre, descripcion, slug) VALUES ('Ropa Mujer', 'Ropa femenina', 'ropa-mujer'), ('Ropa Hombre', 'Ropa masculina', 'ropa-hombre'), ('Accesorios', 'Complementos', 'accesorios') ON CONFLICT DO NOTHING;"

echo Creando productos de ejemplo...
psql -U postgres -d stylehub_catalog -c "INSERT INTO productos (nombre, descripcion, precio_base, precio_venta, categoria_id, sku, slug) SELECT 'Camiseta Basica', 'Camiseta de algodon 100%%', 25000, 45000, c.id, 'CAM-001', 'camiseta-basica' FROM categorias c WHERE c.slug = 'ropa-mujer' LIMIT 1 ON CONFLICT DO NOTHING;"

echo.
echo [7/8] Configurando permisos finales...
psql -U postgres -d stylehub_auth -c "GRANT USAGE ON SCHEMA public TO stylehub_user;"
psql -U postgres -d stylehub_catalog -c "GRANT USAGE ON SCHEMA public TO stylehub_user;"
psql -U postgres -d stylehub_transactions -c "GRANT USAGE ON SCHEMA public TO stylehub_user;"
psql -U postgres -d stylehub_logistics -c "GRANT USAGE ON SCHEMA public TO stylehub_user;"
psql -U postgres -d stylehub_credit -c "GRANT USAGE ON SCHEMA public TO stylehub_user;"

echo.
echo [8/8] Configuracion completada exitosamente!
echo.
echo ====================================================
echo RESUMEN DE BASES DE DATOS CREADAS:
echo ====================================================
echo.
echo PostgreSQL (Puerto 5432):
echo   ✓ stylehub_auth - Autenticacion y roles empresariales
echo   ✓ stylehub_catalog - Productos, categorias y promociones  
echo   ✓ stylehub_transactions - Carritos, pedidos y pagos
echo   ✓ stylehub_logistics - Inventario, almacenes y envios
echo   ✓ stylehub_credit - Sistema de credito interno
echo.
echo MongoDB (Puerto 27017):
echo   ✓ stylehub_ai - IA Maria, recomendaciones y tendencias
echo   ✓ stylehub_social - Resenas, listas de deseos y outfits
echo   ✓ stylehub_marketing - Campanas, fidelizacion y analytics
echo.
echo ====================================================
echo CREDENCIALES DE ACCESO:
echo Usuario: stylehub_user
echo Password: stylehub_pass
echo ====================================================
echo.
echo USUARIO ADMINISTRADOR CREADO:
echo Email: admin@estiloymodaco.com
echo Password: Admin123!
echo Rol: CEO
echo ====================================================
echo.
echo ¡Listo para hacer pruebas en la web!
echo.
pause