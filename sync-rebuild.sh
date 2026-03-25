#!/bin/bash
VM_IP="149.130.182.9"
SSH_KEY="$HOME/.ssh/oracle_key"
USER="ubuntu"

echo "📤 Sincronizando archivos modificados..."
rsync -avz --progress -e "ssh -i $SSH_KEY" \
  /home/jose/E-comerce/simple-gateway/ \
  $USER@$VM_IP:~/E-comerce/simple-gateway/

rsync -avz --progress -e "ssh -i $SSH_KEY" \
  /home/jose/E-comerce/frontend/src/ \
  $USER@$VM_IP:~/E-comerce/frontend/src/

rsync -avz --progress -e "ssh -i $SSH_KEY" \
  /home/jose/E-comerce/docker-compose.yml \
  $USER@$VM_IP:~/E-comerce/

echo ""
echo "🔄 Reconstruyendo en servidor..."
ssh -i $SSH_KEY $USER@$VM_IP << 'EOF'
cd ~/E-comerce
docker compose down
docker compose build --no-cache gateway frontend
docker compose up -d
sleep 10
docker compose ps
EOF

echo ""
echo "✅ Sincronización y rebuild completados"
echo "🌐 http://149.130.182.9:3005"
