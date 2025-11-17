@echo off
echo ========================================
echo    INICIANDO FRONTEND VUE.JS
echo ========================================
echo.

cd frontend-vue

echo Instalando dependencias...
call npm install

echo.
echo Iniciando servidor de desarrollo en puerto 3005...
echo URL: http://localhost:3005
echo.

call npm run serve

pause