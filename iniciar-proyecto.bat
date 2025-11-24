@echo off
echo ========================================
echo    INICIANDO ESTILO Y MODA E-COMMERCE
echo ========================================
echo.

echo 🚀 Iniciando servicios...
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js detectado

REM Crear directorios para logs si no existen
if not exist "logs" mkdir logs

echo.
echo 📋 Iniciando servicios en orden:
echo    1. Auth Service (Puerto 3001)
echo    2. API Gateway (Puerto 3000) 
echo    3. Frontend (Puerto 3005)
echo.

REM 1. Iniciar Auth Service
echo 🔐 Iniciando Auth Service...
start "Auth Service" cmd /k "cd /d E:\E-comerce\backend\services\auth-service && npm run desarrollo"
timeout /t 3 /nobreak >nul

REM 2. Iniciar API Gateway
echo 🌐 Iniciando API Gateway...
start "API Gateway" cmd /k "cd /d E:\E-comerce\backend && npm run desarrollo"
timeout /t 3 /nobreak >nul

REM 3. Iniciar Frontend
echo 🎨 Iniciando Frontend...
start "Frontend" cmd /k "cd /d E:\E-comerce\frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ✅ Todos los servicios iniciados!
echo.
echo 📱 URLs disponibles:
echo    • Frontend: http://localhost:3005
echo    • API Gateway: http://localhost:3000
echo    • Auth Service: http://localhost:3001
echo.
echo 👤 Usuario demo:
echo    • Email: demo@estilomoda.com
echo    • Password: admin123
echo.
echo 📧 Recuperación de contraseña:
echo    • Gmail configurado: josefer21jf@gmail.com
echo    • Base de datos: Neon Postgres (online)
echo.
echo ⚠️  Para detener todos los servicios, cierra las ventanas de comandos
echo.
pause