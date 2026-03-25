#!/bin/bash

echo "🔄 Rebuilding AI Service con Virtual Try-On..."

# Detener AI Service
docker-compose stop ai-service gateway

# Rebuild AI Service
docker-compose build --no-cache ai-service gateway

# Iniciar servicios
docker-compose up -d ai-service gateway

echo "✅ AI Service actualizado con Virtual Try-On"
echo "🧪 Prueba: curl http://149.130.182.9:3007/salud"
