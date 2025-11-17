@echo off
echo ========================================
echo PROBANDO SERVICIOS E-COMMERCE
echo ========================================

echo.
echo [1/9] Frontend...
curl -s http://localhost:3005 | findstr title && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [2/9] API Gateway...
curl -s http://localhost:3000/salud | findstr activo && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [3/9] Auth Service...
curl -s http://localhost:3001/salud | findstr activo && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [4/9] Catalog Service...
curl -s http://localhost:3002/salud | findstr activo && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [5/9] Transaction Service...
curl -s http://localhost:3003/salud | findstr activo && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [6/9] Social Service...
curl -s http://localhost:3004/salud | findstr activo && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [7/9] Marketing Service...
curl -s http://localhost:3006/salud | findstr activo && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [8/9] AI Service...
curl -s http://localhost:3007/salud | findstr activo && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [9/9] Credit Service...
curl -s http://localhost:3008/actuator/health | findstr UP && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo [10/10] Logistics Service...
curl -s http://localhost:3009/actuator/health | findstr UP && echo   ✅ ACTIVO || echo   ❌ INACTIVO

echo.
echo ========================================
echo URLS PRINCIPALES:
echo Frontend: http://localhost:3005
echo API Gateway: http://localhost:3000
echo ========================================