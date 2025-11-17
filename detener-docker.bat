@echo off
title E-Commerce - Deteniendo Docker
color 0C

echo.
echo ========================================
echo    E-COMMERCE MICROSERVICIOS
echo    Deteniendo proyecto Docker...
echo ========================================
echo.

echo [1/3] Deteniendo todos los servicios...
docker compose down
if %errorlevel% neq 0 (
    echo ❌ Error deteniendo servicios
) else (
    echo ✅ Servicios detenidos
)

echo.
echo [2/3] Limpiando volúmenes (opcional)...
set /p respuesta="¿Eliminar datos de BD? (s/N): "
if /i "%respuesta%"=="s" (
    docker compose down -v
    echo ✅ Volúmenes eliminados
) else (
    echo ℹ️ Volúmenes conservados
)

echo.
echo [3/3] Limpiando imágenes no utilizadas...
docker system prune -f >nul 2>&1
echo ✅ Limpieza completada

echo.
echo ========================================
echo    ✅ PROYECTO DETENIDO
echo ========================================
echo.
pause