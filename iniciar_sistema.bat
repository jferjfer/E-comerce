@echo off
echo 🚀 Iniciando Estilo y Moda - E-commerce
echo.

echo 📦 Verificando configuración...
if not exist ".env" (
    echo ❌ Archivo .env no encontrado
    pause
    exit /b 1
)

echo ✅ Configuración encontrada
echo.

echo 🔧 Iniciando servicios...
echo.

echo 📱 Frontend: http://localhost:3005
echo 🔗 API Gateway: http://localhost:3001
echo.

start "Frontend - Estilo y Moda" cmd /k "cd frontend && npm start"
timeout /t 3 /nobreak >nul
start "Backend - API Gateway" cmd /k "cd backend && npm run desarrollo"

echo ✅ Sistema iniciado correctamente
echo.
echo 📋 URLs disponibles:
echo    Frontend: http://localhost:3005
echo    API Gateway: http://localhost:3001
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul