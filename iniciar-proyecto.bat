@echo off
title E-Commerce - Iniciando Proyecto
color 0A

echo.
echo ========================================
echo    E-COMMERCE MICROSERVICIOS
echo    Iniciando proyecto completo...
echo ========================================
echo.

echo [1/4] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está disponible. Ejecuta como Administrador.
    pause
    exit /b 1
)

echo ✅ Docker disponible
echo.

echo [2/4] Levantando bases de datos...
docker compose up -d postgres-auth mongodb-catalogo postgres-transaction redis-cache
if %errorlevel% neq 0 (
    echo ❌ Error levantando bases de datos
    pause
    exit /b 1
)

echo ✅ Bases de datos iniciadas
echo.

echo [3/4] Esperando que las BD estén listas...
timeout /t 15 /nobreak >nul

echo [4/4] Iniciando servicios...
echo.

echo 🚀 Iniciando Auth Service (Puerto 3001)...
start "Auth Service" cmd /k "cd /d %~dp0services\auth-service && npm run iniciar"

timeout /t 3 /nobreak >nul

echo 🚀 Iniciando API Gateway (Puerto 3000)...
start "API Gateway" cmd /k "cd /d %~dp0api-gateway && npm run iniciar"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo    ✅ PROYECTO INICIADO EXITOSAMENTE
echo ========================================
echo.
echo 🌐 API Gateway: http://localhost:3000
echo 📊 Estado servicios: http://localhost:3000/estado-servicios
echo 🔐 Auth Service: http://localhost:3001/salud
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause >nul

start http://localhost:3000

echo.
echo ========================================
echo    SERVICIOS EJECUTÁNDOSE
echo ========================================
echo.
echo Para detener todos los servicios:
echo 1. Cierra las ventanas de los servicios
echo 2. Ejecuta: docker compose down
echo.
echo Presiona cualquier tecla para salir...
pause >nul