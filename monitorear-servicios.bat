@echo off
title E-Commerce - Monitor de Servicios
color 0B

:menu
cls
echo.
echo ========================================
echo    E-COMMERCE - MONITOR DE SERVICIOS
echo ========================================
echo.
echo [1] Ver estado de contenedores
echo [2] Ver logs de todos los servicios
echo [3] Ver logs de un servicio específico
echo [4] Reiniciar un servicio
echo [5] Verificar salud de servicios
echo [6] Abrir URLs de servicios
echo [0] Salir
echo.
set /p opcion="Selecciona una opción: "

if "%opcion%"=="1" goto estado
if "%opcion%"=="2" goto logs_todos
if "%opcion%"=="3" goto logs_especifico
if "%opcion%"=="4" goto reiniciar
if "%opcion%"=="5" goto salud
if "%opcion%"=="6" goto urls
if "%opcion%"=="0" goto salir
goto menu

:estado
cls
echo Estado de contenedores:
echo.
docker compose ps
echo.
pause
goto menu

:logs_todos
cls
echo Logs de todos los servicios (Ctrl+C para salir):
echo.
docker compose logs -f
goto menu

:logs_especifico
cls
echo Servicios disponibles:
echo - auth-service
echo - catalog-service  
echo - transaction-service
echo - social-service
echo - ai-service
echo - credit-service
echo - logistics-service
echo - api-gateway
echo - frontend
echo.
set /p servicio="Ingresa el nombre del servicio: "
cls
echo Logs de %servicio% (Ctrl+C para salir):
echo.
docker compose logs -f %servicio%
goto menu

:reiniciar
cls
echo Servicios disponibles para reiniciar:
docker compose ps --services
echo.
set /p servicio="Ingresa el nombre del servicio: "
echo Reiniciando %servicio%...
docker compose restart %servicio%
echo ✅ Servicio reiniciado
pause
goto menu

:salud
cls
echo Verificando salud de servicios...
echo.
echo 🔐 Auth Service:
curl -s http://localhost:3001/salud || echo ❌ No disponible
echo.
echo 📦 Catalog Service:
curl -s http://localhost:3002/salud || echo ❌ No disponible
echo.
echo 💳 Transaction Service:
curl -s http://localhost:3003/salud || echo ❌ No disponible
echo.
echo 👥 Social Service:
curl -s http://localhost:3004/salud || echo ❌ No disponible
echo.
echo 🚪 API Gateway:
curl -s http://localhost:3000/salud || echo ❌ No disponible
echo.
pause
goto menu

:urls
cls
echo Abriendo URLs de servicios...
start http://localhost:3005
start http://localhost:3000
echo ✅ URLs abiertas en el navegador
pause
goto menu

:salir
echo.
echo ¡Hasta luego!
exit