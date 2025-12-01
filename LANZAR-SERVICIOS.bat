@echo off
echo.
echo ========================================
echo   ESTILO Y MODA - LANZADOR DE SERVICIOS
echo ========================================
echo.
echo Selecciona el servicio a iniciar:
echo.
echo 1. Gateway (Puerto 3000)
echo 2. Auth Service (Puerto 3011)
echo 3. Catalog Service (Puerto 3002)
echo 4. Transaction Service (Puerto 3003)
echo 5. Social Service (Puerto 3004)
echo 6. Marketing Service (Puerto 3006)
echo 7. AI Service (Puerto 3007)
echo 8. Frontend (Puerto 3005)
echo 9. TODOS LOS SERVICIOS
echo 0. Salir
echo.
set /p opcion="Ingresa tu opcion: "

if "%opcion%"=="1" (
    echo.
    echo Iniciando Gateway...
    cd simple-gateway
    node iniciar.js
) else if "%opcion%"=="2" (
    echo.
    echo Iniciando Auth Service...
    cd backend\services\auth-service
    npm run iniciar
) else if "%opcion%"=="3" (
    echo.
    echo Iniciando Catalog Service...
    cd backend\services\catalog-service
    python iniciar.py
) else if "%opcion%"=="4" (
    echo.
    echo Iniciando Transaction Service...
    cd backend\services\transaction-service
    npm run iniciar
) else if "%opcion%"=="5" (
    echo.
    echo Iniciando Social Service...
    cd backend\services\social-service
    npm run iniciar
) else if "%opcion%"=="6" (
    echo.
    echo Iniciando Marketing Service...
    cd backend\services\marketing-service
    npm run iniciar
) else if "%opcion%"=="7" (
    echo.
    echo Iniciando AI Service...
    cd backend\services\ai-service
    python iniciar.py
) else if "%opcion%"=="8" (
    echo.
    echo Iniciando Frontend...
    cd frontend
    npm run dev
) else if "%opcion%"=="9" (
    echo.
    echo Iniciando TODOS los servicios...
    node iniciar.js
) else if "%opcion%"=="0" (
    echo.
    echo Saliendo...
    exit
) else (
    echo.
    echo Opcion invalida
    pause
    goto :eof
)
