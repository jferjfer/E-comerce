@echo off
echo ====================================================
echo ESTILO Y MODA - CONFIGURACION NEON DATABASE (VERCEL)
echo ====================================================
echo.

set PGHOST=ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech
set PGUSER=neondb_owner
set PGPASSWORD=npg_8xkCIyHBo3Mn
set PGDATABASE=neondb
set PGSSLMODE=require

echo [1/4] Conectando a Neon Database...
echo Host: %PGHOST%
echo Database: %PGDATABASE%
echo.

echo [2/4] Ejecutando esquemas en Neon...
echo Creando esquema de autenticacion...
psql "postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "postgres\01_auth_service_new.sql"

echo Creando esquema de catalogo...
psql "postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "postgres\02_catalog_service.sql"

echo Creando esquema de transacciones...
psql "postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "postgres\03_transactions_service.sql"

echo Creando esquema de logistica...
psql "postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "postgres\04_logistics_service.sql"

echo Creando esquema de credito...
psql "postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "postgres\05_credit_service.sql"

echo.
echo [3/4] Configurando MongoDB Atlas para IA y Social...
mongosh "mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority" --file "mongodb\01_ai_service_complete.js"
mongosh "mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority" --file "mongodb\02_social_service.js"
mongosh "mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority" --file "mongodb\03_marketing_service.js"

echo.
echo [4/4] Insertando datos de prueba en Neon...
psql "postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -c "INSERT INTO usuarios (nombre, apellido, email, contrasena_hash, rol_id, departamento) SELECT 'Admin', 'Sistema', 'admin@estiloymodaco.com', crypt('Admin123!', gen_salt('bf')), r.id, 'Tecnologia' FROM roles r WHERE r.nombre = 'CEO' ON CONFLICT DO NOTHING;"

echo.
echo ====================================================
echo CONFIGURACION COMPLETADA!
echo ====================================================
echo.
echo PostgreSQL en Neon (Vercel):
echo   ✓ Todas las tablas creadas en neondb
echo   ✓ Usuario admin creado
echo   ✓ Datos de prueba insertados
echo.
echo MongoDB Atlas (Vercel):
echo   ✓ stylehub_ai - IA y recomendaciones
echo   ✓ stylehub_social - Resenas y comunidad  
echo   ✓ stylehub_marketing - Campanas y fidelizacion
echo.
echo CREDENCIALES WEB:
echo Email: admin@estiloymodaco.com
echo Password: Admin123!
echo.
echo ¡Listo para hacer pruebas!
echo.
pause