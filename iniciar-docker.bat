@echo off
title E-Commerce - Iniciando con Docker
color 0A

echo.
echo ========================================
echo    E-COMMERCE MICROSERVICIOS
echo    Iniciando proyecto completo con Docker
echo ========================================
echo.

echo [1/5] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está disponible
    pause
    exit /b 1
)
echo ✅ Docker disponible

echo.
echo [2/5] Limpiando contenedores anteriores...
docker compose down -v >nul 2>&1
echo ✅ Limpieza completada

echo.
echo [3/5] Construyendo imágenes...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo ❌ Error construyendo imágenes
    pause
    exit /b 1
)
echo ✅ Imágenes construidas

echo.
echo [4/5] Iniciando bases de datos...
docker compose up -d postgres mongodb redis
echo ⏳ Esperando que las bases de datos estén listas...
timeout /t 30 /nobreak >nul

echo.
echo [5/5] Iniciando todos los servicios...
docker compose up -d
if %errorlevel% neq 0 (
    echo ❌ Error iniciando servicios
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✅ PROYECTO INICIADO EXITOSAMENTE
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3005
echo 🚪 API Gateway: http://localhost:3000
echo 🔐 Auth Service: http://localhost:3001
echo 📦 Catalog Service: http://localhost:3002
echo 💳 Transaction Service: http://localhost:3003
echo 👥 Social Service: http://localhost:3004
echo 🤖 AI Service: http://localhost:3007
echo 💰 Credit Service: http://localhost:3008
echo 📦 Logistics Service: http://localhost:3009
echo.
echo 📊 PostgreSQL: localhost:5432
echo 🍃 MongoDB: localhost:27017
echo 🔴 Redis: localhost:6379
echo.

echo Verificando estado de los servicios...
timeout /t 10 /nobreak >nul

echo.
echo Estado de contenedores:
docker compose ps

echo.
echo Presiona cualquier tecla para abrir el frontend...
pause >nul
start http://localhost:3005

echo.
echo Para ver logs: docker compose logs -f [servicio]
echo Para detener: docker compose down
echo.
pause