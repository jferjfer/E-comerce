@echo off
echo 🔧 Arreglando contenedor del frontend...

echo 📦 Deteniendo contenedor frontend...
docker stop frontend 2>nul

echo 🗑️ Eliminando contenedor e imagen...
docker rm frontend 2>nul
docker rmi e-comerce-frontend 2>nul

echo 🧹 Limpiando cache Docker...
docker system prune -f

echo 🔨 Reconstruyendo imagen del frontend...
docker-compose build --no-cache frontend

echo 🚀 Iniciando frontend...
docker-compose up -d frontend

echo ✅ Frontend arreglado. Verificando logs...
timeout /t 5 >nul
docker logs frontend --tail 20

echo 🌐 Frontend disponible en: http://localhost:3005
pause