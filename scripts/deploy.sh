#!/bin/bash

echo "🚀 Iniciando despliegue de Estilo y Moda E-commerce"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

# Verificar docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | xargs)
    echo "✅ Variables de entorno cargadas"
else
    echo "⚠️ Archivo .env no encontrado, usando valores por defecto"
fi

# Construir y levantar servicios
echo "🔨 Construyendo servicios..."
docker-compose build --no-cache

echo "🚀 Levantando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando servicios..."
sleep 30

# Verificar salud de servicios
echo "🔍 Verificando salud de servicios..."
services=("http://localhost:3000/salud" "http://localhost:3011/salud" "http://localhost:3002/salud" "http://localhost:3003/salud")

for service in "${services[@]}"; do
    if curl -f "$service" > /dev/null 2>&1; then
        echo "✅ $service - OK"
    else
        echo "❌ $service - FAIL"
    fi
done

echo "🎉 Despliegue completado!"
echo "📱 Frontend: http://localhost:3005"
echo "🌐 Gateway: http://localhost:3000"
echo "📊 Estado servicios: http://localhost:3000/estado-servicios"