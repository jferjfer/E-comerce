@echo off
echo 🚨 SOLUCIÓN RÁPIDA - Error Vite Frontend

echo 1️⃣ Deteniendo todos los contenedores...
docker-compose down

echo 2️⃣ Limpiando sistema Docker...
docker system prune -f
docker volume prune -f

echo 3️⃣ Eliminando imagen frontend corrupta...
docker rmi e-comerce-frontend 2>nul

echo 4️⃣ Reconstruyendo SOLO el frontend sin cache...
docker-compose build --no-cache frontend

echo 5️⃣ Iniciando frontend...
docker-compose up -d frontend

echo 6️⃣ Esperando 10 segundos...
timeout /t 10 >nul

echo 7️⃣ Verificando logs del frontend...
docker logs frontend --tail 30

echo.
echo ✅ Si aún hay errores, ejecuta: ARREGLAR-FRONTEND.bat
echo 🌐 Frontend debería estar en: http://localhost:3005
pause