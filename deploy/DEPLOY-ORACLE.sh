#!/bin/bash
# Despliegue automático con progreso

VM_IP="149.130.182.9"
SSH_KEY="$HOME/.ssh/oracle_key"
USER="ubuntu"

echo "🚀 DESPLIEGUE AUTOMÁTICO EN ORACLE CLOUD"
echo "========================================"
echo ""

# Función para mostrar progreso
progress() {
    echo ""
    echo "[$1/6] $2"
    echo "Progreso: $(($1 * 100 / 6))%"
    echo ""
}

progress 1 "Instalando Docker en VM..."
ssh -i $SSH_KEY $USER@$VM_IP 'bash -s' << 'EOF'
sudo apt update -qq
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh > /dev/null 2>&1
sudo usermod -aG docker ubuntu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
EOF

progress 2 "Configurando firewall..."
ssh -i $SSH_KEY $USER@$VM_IP 'bash -s' << 'EOF'
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3005 -j ACCEPT
sudo apt install -y iptables-persistent > /dev/null 2>&1
sudo netfilter-persistent save
EOF

progress 3 "Copiando proyecto (esto toma 2-3 minutos)..."
rsync -avz --progress -e "ssh -i $SSH_KEY" /home/jose/E-comerce/ $USER@$VM_IP:~/E-comerce/

progress 4 "Creando archivo .env..."
ssh -i $SSH_KEY $USER@$VM_IP 'bash -s' << 'EOF'
cd ~/E-comerce
cat > .env << 'ENVEOF'
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
ENVEOF
EOF

progress 5 "Construyendo imágenes Docker (10-15 minutos)..."
ssh -i $SSH_KEY $USER@$VM_IP 'bash -s' << 'EOF'
cd ~/E-comerce
docker-compose build --no-cache
EOF

progress 6 "Levantando servicios..."
ssh -i $SSH_KEY $USER@$VM_IP 'bash -s' << 'EOF'
cd ~/E-comerce
docker-compose up -d
sleep 15
docker-compose ps
EOF

echo ""
echo "✅ DESPLIEGUE COMPLETADO"
echo ""
echo "🌐 Accede a tu aplicación:"
echo "   Frontend: http://149.130.182.9:3005"
echo "   API: http://149.130.182.9:3000"
echo ""
echo "👤 Usuarios demo:"
echo "   demo@estilomoda.com / admin123"
echo "   ceo@estilomoda.com / admin123"
