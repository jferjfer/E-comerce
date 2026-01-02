@echo off
echo 🔄 Reconstruyendo todos los servicios...

echo ⏹️  Deteniendo contenedores...
docker-compose down

echo 🔨 Reconstruyendo servicios...
docker-compose build --no-cache social-service
docker-compose build --no-cache marketing-service
docker-compose build --no-cache ai-service
docker-compose build --no-cache credit-service
docker-compose build --no-cache logistics-service

echo 🚀 Iniciando servicios...
docker-compose up -d

echo ⏳ Esperando 15 segundos para que inicien los servicios...
timeout /t 15 /nobreak

echo ✅ Verificando estado de servicios...
curl -s http://localhost:3000/estado-servicios

echo.
echo ✅ ¡Listo! Todos los servicios han sido actualizados.
echo.
echo 📋 URLs de acceso:
echo    Frontend: http://localhost:3005
echo    Gateway: http://localhost:3000
echo    Estado: http://localhost:3000/estado-servicios
