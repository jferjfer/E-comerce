#!/bin/bash
# sync-secrets.sh — Sincroniza Google Secret Manager con K8s
# Uso: ./sync-secrets.sh

PROJECT=crypto-topic-492202-q9
NAMESPACE=egos
SECRET_NAME=egos-secrets

echo "🔐 Sincronizando secretos desde Google Secret Manager..."

get_secret() {
  gcloud secrets versions access latest --secret="$1" --project=$PROJECT 2>/dev/null || echo ""
}

kubectl create secret generic $SECRET_NAME \
  --namespace=$NAMESPACE \
  --from-literal=JWT_SECRETO="$(get_secret JWT_SECRETO)" \
  --from-literal=POSTGRES_AUTH_URL="$(get_secret POSTGRES_AUTH_URL)" \
  --from-literal=POSTGRES_TRANSACTION_URL="$(get_secret POSTGRES_TRANSACTION_URL)" \
  --from-literal=POSTGRES_MARKETING_URL="$(get_secret POSTGRES_MARKETING_URL)" \
  --from-literal=POSTGRES_CREDIT_URL="$(get_secret POSTGRES_CREDIT_URL)" \
  --from-literal=POSTGRES_FACTURACION_URL="$(get_secret POSTGRES_FACTURACION_URL)" \
  --from-literal=MONGODB_CATALOG_URI="$(get_secret MONGODB_CATALOG_URI)" \
  --from-literal=MONGODB_SOCIAL_URI="$(get_secret MONGODB_SOCIAL_URI)" \
  --from-literal=MONGODB_AI_URI="$(get_secret MONGODB_AI_URI)" \
  --from-literal=SMTP_HOST="$(get_secret SMTP_HOST)" \
  --from-literal=SMTP_PORT="$(get_secret SMTP_PORT)" \
  --from-literal=SMTP_USER="$(get_secret SMTP_USER)" \
  --from-literal=SMTP_PASS="$(get_secret SMTP_PASS)" \
  --from-literal=SMTP_USER_VENTAS="$(get_secret SMTP_USER_VENTAS)" \
  --from-literal=SMTP_PASS_VENTAS="$(get_secret SMTP_PASS_VENTAS)" \
  --from-literal=AI_GATEWAY_API_KEY="$(get_secret AI_GATEWAY_API_KEY)" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secretos sincronizados en K8s namespace: $NAMESPACE"
