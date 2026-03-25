#!/bin/bash
# Script de instalación automática en Oracle Cloud VM

set -e

echo "🚀 Instalando E-commerce Estilo y Moda en Oracle Cloud"
echo "========================================================"

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Git
echo "📥 Instalando Git..."
sudo apt install git -y

# Configurar firewall
echo "🔓 Configurando firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3005 -j ACCEPT
sudo apt install iptables-persistent -y
sudo netfilter-persistent save

echo ""
echo "✅ Instalación base completada"
echo ""
echo "🔄 IMPORTANTE: Cierra sesión y vuelve a conectar para aplicar cambios de Docker"
echo "Luego ejecuta: ./3-deploy-app.sh"
