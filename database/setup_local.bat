@echo off
echo ====================================================
echo STYLEHUB - CONFIGURACION LOCAL DE BASES DE DATOS
echo ====================================================
echo.

echo [1/5] Configurando PostgreSQL...
echo Ejecutando scripts de PostgreSQL...
psql -U postgres -f "postgres\00_setup_databases.sql"
psql -U postgres -d stylehub_auth -f "postgres\01_auth_service_new.sql"
psql -U postgres -d stylehub_catalog -f "postgres\02_catalog_service.sql"
psql -U postgres -d stylehub_transactions -f "postgres\03_transactions_service.sql"
psql -U postgres -d stylehub_logistics -f "postgres\04_logistics_service.sql"
psql -U postgres -d stylehub_credit -f "postgres\05_credit_service.sql"

echo.
echo [2/5] Configurando MongoDB...
echo Ejecutando scripts de MongoDB...
mongosh --file "mongodb\01_ai_service_complete.js"
mongosh --file "mongodb\02_social_service.js"
mongosh --file "mongodb\03_marketing_service.js"

echo.
echo [3/5] Verificando conexiones...
echo Verificando PostgreSQL...
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'stylehub_%';"

echo.
echo Verificando MongoDB...
mongosh --eval "show dbs"

echo.
echo [4/5] Creando usuario de aplicacion...
echo Configurando permisos...

echo.
echo [5/5] Configuracion completada!
echo.
echo ====================================================
echo RESUMEN DE BASES DE DATOS CREADAS:
echo ====================================================
echo.
echo PostgreSQL (Puerto 5432):
echo   - stylehub_auth (Autenticacion y roles)
echo   - stylehub_catalog (Productos y catalogo)
echo   - stylehub_transactions (Carritos y pedidos)
echo   - stylehub_logistics (Inventario y envios)
echo   - stylehub_credit (Sistema de credito)
echo.
echo MongoDB (Puerto 27017):
echo   - stylehub_ai (IA y recomendaciones)
echo   - stylehub_social (Resenas y comunidad)
echo   - stylehub_marketing (Campanas y fidelizacion)
echo.
echo Redis (Puerto 6379): Cache y sesiones
echo Elasticsearch (Puerto 9200): Busqueda avanzada
echo.
echo ====================================================
echo CREDENCIALES:
echo Usuario: stylehub_user
echo Password: stylehub_pass
echo ====================================================
echo.
pause