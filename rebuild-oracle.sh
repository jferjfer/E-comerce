#!/bin/bash
echo "🔄 Reconstruyendo servicios en Oracle Cloud..."

ssh -i ~/.ssh/oracle_key ubuntu@149.130.182.9 << 'EOF'
cd ~/E-comerce

echo "⬇️ Deteniendo contenedores..."
docker compose down

echo "🗑️ Limpiando imágenes antiguas..."
docker system prune -f

echo "🔨 Reconstruyendo gateway y frontend..."
docker compose build --no-cache gateway frontend

echo "🚀 Levantando todos los servicios..."
docker compose up -d

echo "⏳ Esperando 15 segundos..."
sleep 15

echo "📊 Estado de contenedores:"
docker compose ps

echo "✅ Reconstrucción completada"
EOF

echo ""
echo "🌐 Accede a: http://149.130.182.9:3005"
