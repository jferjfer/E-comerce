#!/bin/bash
# Script para desplegar la aplicación

set -e

echo "🚀 Desplegando E-commerce Estilo y Moda"
echo "========================================"

# Clonar proyecto si no existe
if [ ! -d "E-comerce" ]; then
    echo "📥 Clonando proyecto..."
    cd ~
    # Opción 1: Desde GitHub (si está público)
    # git clone https://github.com/tu-usuario/E-comerce.git
    
    # Opción 2: Crear estructura y copiar archivos
    echo "⚠️  Debes subir el proyecto manualmente con SCP"
    echo "Desde tu máquina local ejecuta:"
    echo "scp -i ~/.ssh/oracle_key -r /home/jose/E-comerce ubuntu@TU_IP:~/"
    exit 1
fi

cd ~/E-comerce

# Verificar que existe docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ No se encuentra docker-compose.yml"
    exit 1
fi

# Verificar que existe .env
if [ ! -f ".env" ]; then
    echo "⚠️  Creando archivo .env..."
    cat > .env << 'EOF'
JWT_SECRETO=estilo_moda_jwt_secreto_produccion_2024_seguro_v2
JWT_SECRET=estilo_moda_jwt_secreto_produccion_2024_seguro_v2

POSTGRES_AUTH_URL=<POSTGRES_CONNECTION_STRING>
POSTGRES_TRANSACTION_URL=<POSTGRES_CONNECTION_STRING>
DATABASE_URL=<POSTGRES_CONNECTION_STRING>

MONGODB_CATALOG_URI=<MONGODB_CONNECTION_STRING>
MONGODB_SOCIAL_URI=<MONGODB_CONNECTION_STRING>
MONGODB_AI_URI=<MONGODB_CONNECTION_STRING>

CLOUDINARY_CLOUD_NAME=dhwk5p0wn
CLOUDINARY_API_KEY=436986674926171
CLOUDINARY_API_SECRET=-IBjmELXn90c8ob3NMHfAW9mqhE

AI_GATEWAY_API_KEY=sk-80c00250da0f4b46a2500912450fd480

GATEWAY_PORT=3000
AUTH_PORT=3011
CATALOG_PORT=3002
TRANSACTION_PORT=3003
SOCIAL_PORT=3004
MARKETING_PORT=3006
AI_PORT=3007
CREDIT_PORT=3008
LOGISTICS_PORT=3009
FRONTEND_PORT=3005

NODE_ENV=production
EOF
fi

# Construir imágenes
echo "🏗️  Construyendo imágenes Docker (esto toma 10-15 minutos)..."
docker-compose build --no-cache

# Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose up -d

# Esperar inicialización
echo "⏳ Esperando inicialización de servicios..."
sleep 20

# Verificar estado
echo ""
echo "📊 Estado de servicios:"
docker-compose ps

echo ""
echo "✅ Despliegue completado"
echo ""
echo "🌐 Accede a tu aplicación en:"
echo "   Frontend: http://$(curl -s ifconfig.me):3005"
echo "   API: http://$(curl -s ifconfig.me):3000"
echo ""
echo "👤 Usuarios demo:"
echo "   demo@estilomoda.com / admin123"
echo "   ceo@estilomoda.com / admin123"
