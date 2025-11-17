@echo off
title E-Commerce - Deteniendo Proyecto
color 0C

echo.
echo ========================================
echo    E-COMMERCE MICROSERVICIOS
echo    Deteniendo proyecto...
echo ========================================
echo.

echo [1/2] Deteniendo contenedores Docker...
docker compose down
if %errorlevel% neq 0 (
    echo ❌ Error deteniendo contenedores
) else (
    echo ✅ Contenedores detenidos
)

echo.
echo [2/2] Limpiando recursos...
docker system prune -f >nul 2>&1

echo.
echo ========================================
echo    ✅ PROYECTO DETENIDO
echo ========================================
echo.
echo Nota: Las ventanas de los servicios deben
echo cerrarse manualmente si aún están abiertas.
echo.
pause