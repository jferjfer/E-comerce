#!/bin/bash
# deploy.sh — Despliegue manual a GKE
# Uso: ./scripts/deploy.sh [servicio]
# Ejemplo: ./scripts/deploy.sh auth-service
# Sin argumento: despliega todos los servicios

set -e

PROJECT=crypto-topic-492202-q9
REGION=us-central1
CLUSTER=autopilot-cluster-1
NAMESPACE=egos
REGISTRY=us-central1-docker.pkg.dev/$PROJECT/egos-registry

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Despliegue EGOS → GKE"

# Verificar dependencias
for cmd in gcloud kubectl docker; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}❌ $cmd no está instalado${NC}"
    exit 1
  fi
done

# Autenticar y conectar al cluster
echo "🔐 Conectando al cluster..."
gcloud container clusters get-credentials $CLUSTER --region $REGION --project $PROJECT

# Función para build + push + rollout de un servicio
deploy_service() {
  local SERVICE=$1
  local CONTEXT=$2

  echo "🔨 Building $SERVICE..."
  docker build -t $REGISTRY/$SERVICE:latest $CONTEXT
  docker push $REGISTRY/$SERVICE:latest

  echo "🚀 Desplegando $SERVICE..."
  kubectl set image deployment/$SERVICE $SERVICE=$REGISTRY/$SERVICE:latest -n $NAMESPACE
  kubectl rollout status deployment/$SERVICE -n $NAMESPACE --timeout=300s

  echo -e "${GREEN}✅ $SERVICE desplegado${NC}"
}

# Si se pasa un servicio específico
if [ -n "$1" ]; then
  case $1 in
    auth-service)       deploy_service auth-service ./backend/services/auth-service ;;
    catalog-service)    deploy_service catalog-service ./backend/services/catalog-service ;;
    transaction-service) deploy_service transaction-service ./backend/services/transaction-service ;;
    social-service)     deploy_service social-service ./backend/services/social-service ;;
    marketing-service)  deploy_service marketing-service ./backend/services/marketing-service ;;
    ai-service)         deploy_service ai-service ./backend/services/ai-service ;;
    credit-service)     deploy_service credit-service ./backend/services/credit-service ;;
    logistics-service)  deploy_service logistics-service ./backend/services/logistics-service ;;
    facturacion-service) deploy_service facturacion-service ./backend/services/facturacion-service ;;
    contabilidad-service) deploy_service contabilidad-service ./backend/services/contabilidad-service ;;
    gateway)            deploy_service gateway ./simple-gateway ;;
    frontend)
      docker build -t $REGISTRY/frontend:latest \
        --build-arg VITE_API_URL=https://api.egoscolombia.com.co \
        ./frontend
      docker push $REGISTRY/frontend:latest
      kubectl set image deployment/frontend frontend=$REGISTRY/frontend:latest -n $NAMESPACE
      kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=300s
      echo -e "${GREEN}✅ frontend desplegado${NC}"
      ;;
    *)
      echo -e "${RED}❌ Servicio desconocido: $1${NC}"
      echo "Servicios válidos: auth-service, catalog-service, transaction-service, social-service,"
      echo "  marketing-service, ai-service, credit-service, logistics-service,"
      echo "  facturacion-service, contabilidad-service, gateway, frontend"
      exit 1
      ;;
  esac
else
  # Desplegar todos aplicando los manifiestos K8s
  echo "📦 Aplicando manifiestos K8s..."
  kubectl apply -f k8s/secrets/secrets.yaml
  kubectl apply -f k8s/deployments/all-services.yaml
  kubectl apply -f k8s/ingress/backend-config.yaml
  kubectl apply -f k8s/ingress/frontend-config.yaml
  kubectl apply -f k8s/ingress/ingress.yaml
  kubectl apply -f k8s/autoscaling/hpa.yaml

  echo ""
  echo "📊 Estado del cluster:"
  kubectl get pods -n $NAMESPACE
fi

echo ""
echo -e "${GREEN}🎉 Despliegue completado${NC}"
echo "🌐 Frontend: https://egoscolombia.com.co"
echo "🔗 API:      https://api.egoscolombia.com.co"
