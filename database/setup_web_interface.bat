@echo off
echo ====================================================
echo ESTILO Y MODA - CONFIGURACION VIA WEB
echo ====================================================
echo.

echo No tienes psql ni mongosh instalados.
echo Puedes configurar las bases de datos via web:
echo.

echo [1] PostgreSQL (Neon):
echo     - Ve a: https://console.neon.tech/
echo     - Abre SQL Editor
echo     - Ejecuta los archivos .sql uno por uno
echo.

echo [2] MongoDB (Atlas):
echo     - Ve a: https://cloud.mongodb.com/
echo     - Abre MongoDB Compass o Shell
echo     - Ejecuta los archivos .js uno por uno
echo.

echo [3] Archivos a ejecutar en orden:
echo     PostgreSQL:
echo       1. postgres\01_auth_service_new.sql
echo       2. postgres\02_catalog_service.sql  
echo       3. postgres\03_transactions_service.sql
echo       4. postgres\04_logistics_service.sql
echo       5. postgres\05_credit_service.sql
echo.
echo     MongoDB:
echo       1. mongodb\01_ai_service_complete.js
echo       2. mongodb\02_social_service.js
echo       3. mongodb\03_marketing_service.js
echo.

echo [4] Usuario admin se creara automaticamente:
echo     Email: admin@estiloymodaco.com
echo     Password: Admin123!
echo.

echo ¿Prefieres instalar las herramientas o usar la web?
echo.
echo Para instalar herramientas:
echo   1. Instala Chocolatey: https://chocolatey.org/install
echo   2. Ejecuta: choco install postgresql mongodb-shell
echo   3. Reinicia terminal y ejecuta este script de nuevo
echo.

pause