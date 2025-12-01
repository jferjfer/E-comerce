@echo off
echo.
echo ========================================
echo   ESTILO Y MODA - DOCKER LAUNCHER
echo ========================================
echo.
echo Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no esta instalado
    echo Descarga Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Docker detectado!
echo.
echo Iniciando sistema completo...
echo.

docker-compose up -d

echo.
echo ========================================
echo   SISTEMA INICIADO!
echo ========================================
echo.
echo URLs disponibles:
echo   - Frontend: http://localhost:3005
echo   - Gateway: http://localhost:3000
echo   - Estado: http://localhost:3000/estado-servicios
echo.
echo Comandos utiles:
echo   - Ver logs: docker-compose logs -f
echo   - Detener: docker-compose down
echo   - Reiniciar: docker-compose restart
echo.
pause
