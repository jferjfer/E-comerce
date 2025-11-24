@echo off
echo ========================================
echo   DETENIENDO ESTILO Y MODA E-COMMERCE
echo ========================================
echo.

echo 🛑 Deteniendo todos los servicios...

REM Matar procesos de Node.js en los puertos específicos
echo 🔐 Deteniendo Auth Service (puerto 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1

echo 🌐 Deteniendo API Gateway (puerto 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1

echo 🎨 Deteniendo Frontend (puerto 3005)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005') do taskkill /F /PID %%a >nul 2>&1

echo 🎨 Deteniendo Vite dev server (puerto 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1

echo.
echo ✅ Todos los servicios detenidos
echo.
pause