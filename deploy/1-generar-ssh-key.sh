#!/bin/bash
# Script para generar SSH key para Oracle Cloud

echo "🔑 Generando SSH Key para Oracle Cloud..."

mkdir -p ~/.ssh
cd ~/.ssh

if [ ! -f oracle_key ]; then
    ssh-keygen -t rsa -b 4096 -f oracle_key -N ""
    echo "✅ SSH Key generada"
else
    echo "⚠️  SSH Key ya existe"
fi

echo ""
echo "📋 COPIA ESTA CLAVE PÚBLICA:"
echo "================================================"
cat oracle_key.pub
echo "================================================"
