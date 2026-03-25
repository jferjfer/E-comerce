#!/bin/bash
# Script maestro de despliegue completo

echo "🚀 DESPLIEGUE AUTOMÁTICO EN ORACLE CLOUD"
echo "========================================="
echo ""

# Variables (EDITAR ESTAS)
VM_IP="TU_IP_AQUI"  # Ejemplo: 150.230.45.123
SSH_KEY="$HOME/.ssh/oracle_key"

echo "📋 Configuración:"
echo "   IP VM: $VM_IP"
echo "   SSH Key: $SSH_KEY"
echo ""

# Verificar que se configuró la IP
if [ "$VM_IP" = "TU_IP_AQUI" ]; then
    echo "❌ ERROR: Debes editar este script y poner la IP de tu VM"
    echo "   Edita: deploy/DEPLOY-COMPLETO.sh"
    echo "   Línea: VM_IP=\"TU_IP_AQUI\""
    exit 1
fi

# Verificar SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ No se encuentra la SSH key en $SSH_KEY"
    echo "   Ejecuta primero: ./deploy/1-generar-ssh-key.sh"
    exit 1
fi

echo "1️⃣  Copiando proyecto a VM..."
scp -i $SSH_KEY -r /home/jose/E-comerce ubuntu@$VM_IP:~/

echo ""
echo "2️⃣  Copiando scripts de instalación..."
scp -i $SSH_KEY /home/jose/E-comerce/deploy/2-setup-vm.sh ubuntu@$VM_IP:~/
scp -i $SSH_KEY /home/jose/E-comerce/deploy/3-deploy-app.sh ubuntu@$VM_IP:~/

echo ""
echo "3️⃣  Ejecutando instalación en VM..."
ssh -i $SSH_KEY ubuntu@$VM_IP 'chmod +x ~/2-setup-vm.sh && ~/2-setup-vm.sh'

echo ""
echo "4️⃣  Reconectando y desplegando aplicación..."
ssh -i $SSH_KEY ubuntu@$VM_IP 'chmod +x ~/3-deploy-app.sh && ~/3-deploy-app.sh'

echo ""
echo "✅ DESPLIEGUE COMPLETADO"
echo ""
echo "🌐 Tu aplicación está en:"
echo "   Frontend: http://$VM_IP:3005"
echo "   API: http://$VM_IP:3000"
echo ""
echo "📊 Ver logs:"
echo "   ssh -i $SSH_KEY ubuntu@$VM_IP"
echo "   cd E-comerce && docker-compose logs -f"
