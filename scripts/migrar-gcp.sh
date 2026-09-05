#!/bin/bash
# ============================================================
# SCRIPT DE MIGRACIÓN EGOS — Nuevo GCP
# Ejecutar DESPUÉS de crear la nueva cuenta GCP y activar
# la prueba gratuita de $300
# ============================================================

set -e

# ── PASO 1: CONFIGURA ESTOS 3 VALORES CON LOS DEL NUEVO GCP ──
NUEVO_PROJECT_ID="REEMPLAZAR_CON_NUEVO_PROJECT_ID"   # ej: egos-ecommerce-2
NUEVO_REGION="us-central1"
NUEVO_CLUSTER="autopilot-cluster-1"
NUEVO_REGISTRY="us-central1-docker.pkg.dev/${NUEVO_PROJECT_ID}/egos-registry"
# ─────────────────────────────────────────────────────────────

echo "🚀 Iniciando migración EGOS a nuevo GCP..."
echo "   Proyecto: $NUEVO_PROJECT_ID"
echo "   Región:   $NUEVO_REGION"
echo ""

# ── PASO 2: Autenticar y configurar proyecto ──
gcloud auth login
gcloud config set project $NUEVO_PROJECT_ID

# ── PASO 3: Habilitar APIs necesarias ──
echo "📡 Habilitando APIs..."
gcloud services enable container.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com

# ── PASO 4: Crear Artifact Registry ──
echo "📦 Creando Artifact Registry..."
gcloud artifacts repositories create egos-registry \
  --repository-format=docker \
  --location=$NUEVO_REGION \
  --description="EGOS E-commerce Docker Registry"

# ── PASO 5: Crear cluster GKE Autopilot ──
echo "☸️  Creando cluster GKE Autopilot (tarda ~5 min)..."
gcloud container clusters create-auto $NUEVO_CLUSTER \
  --region=$NUEVO_REGION \
  --project=$NUEVO_PROJECT_ID

# ── PASO 6: Obtener credenciales del cluster ──
echo "🔑 Obteniendo credenciales..."
gcloud container clusters get-credentials $NUEVO_CLUSTER \
  --region=$NUEVO_REGION \
  --project=$NUEVO_PROJECT_ID

# ── PASO 7: Crear namespace y secrets ──
echo "🔐 Aplicando secrets..."
kubectl apply -f k8s/secrets/secrets.yaml

# Certificado DIAN
kubectl create secret generic egos-certificado-dian \
  --from-file=certificado.pfx=Certificado.pfx \
  --from-literal=password=Vertel13@ \
  -n egos --dry-run=client -o yaml | kubectl apply -f -

# ── PASO 8: Configurar Workload Identity para GitHub Actions ──
echo "🔧 Configurando Workload Identity..."
PROJECT_NUMBER=$(gcloud projects describe $NUEVO_PROJECT_ID --format="value(projectNumber)")

# Crear Service Account
gcloud iam service-accounts create github-actions-sa \
  --display-name="GitHub Actions SA" \
  --project=$NUEVO_PROJECT_ID

SA_EMAIL="github-actions-sa@${NUEVO_PROJECT_ID}.iam.gserviceaccount.com"

# Dar permisos
gcloud projects add-iam-policy-binding $NUEVO_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding $NUEVO_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Crear Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project=$NUEVO_PROJECT_ID \
  --location="global" \
  --display-name="GitHub Pool"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project=$NUEVO_PROJECT_ID \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

POOL_ID=$(gcloud iam workload-identity-pools describe github-pool \
  --project=$NUEVO_PROJECT_ID \
  --location=global \
  --format="value(name)")

gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --project=$NUEVO_PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/jferjfer/E-comerce"

echo ""
echo "✅ Infraestructura lista!"
echo ""
echo "══════════════════════════════════════════════════════"
echo "  AHORA ACTUALIZA ESTOS VALORES EN deploy.yml:"
echo "══════════════════════════════════════════════════════"
echo ""
echo "  PROJECT_ID: $NUEVO_PROJECT_ID"
echo "  REGISTRY:   $NUEVO_REGISTRY"
echo "  CLUSTER:    $NUEVO_CLUSTER"
echo ""
echo "  workload_identity_provider:"
WI_PROVIDER=$(gcloud iam workload-identity-pools providers describe github-provider \
  --project=$NUEVO_PROJECT_ID \
  --location=global \
  --workload-identity-pool=github-pool \
  --format="value(name)")
echo "    $WI_PROVIDER"
echo ""
echo "  service_account: $SA_EMAIL"
echo ""
echo "══════════════════════════════════════════════════════"
echo ""
echo "  DESPUÉS haz: git push origin main"
echo "  El CI/CD desplegará todo automáticamente"
echo ""
echo "  FINALMENTE cambia los DNS:"
NUEVO_IP=$(kubectl get ingress -n egos -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Espera ~10 min después del deploy")
echo "  Nueva IP: $NUEVO_IP"
echo "══════════════════════════════════════════════════════"
