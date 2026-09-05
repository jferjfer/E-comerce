# 🛍️ EGOS — E-Commerce con Microservicios

E-commerce de moda colombiana con arquitectura de microservicios desplegado en **Google Kubernetes Engine (GKE)**.

> Empresa: **VERTEL & CATILLO S.A.S** | NIT: 902.051.708-6 | Dominio: egoscolombia.com.co

---

## 🏗️ Arquitectura

| Servicio | Tecnología | Puerto | Descripción |
|----------|------------|--------|-------------|
| **auth-service** | Node.js | 3011 | Autenticación JWT, roles, RRHH |
| **catalog-service** | Python FastAPI | 3002 | Productos, categorías, Cloudinary |
| **transaction-service** | Node.js | 3003 | Carrito, pedidos, ePayco, devoluciones |
| **social-service** | Node.js | 3004 | Reseñas, preguntas, favoritos |
| **marketing-service** | Node.js | 3006 | Cupones, campañas, fidelización |
| **ai-service** | Python FastAPI | 3007 | Chat IA, recomendaciones, avatar 3D |
| **credit-service** | Python FastAPI | 3008 | Crédito interno, bonos |
| **logistics-service** | Python FastAPI | 3009 | Inventario, almacenes, envíos |
| **facturacion-service** | Python FastAPI | 3010 | Facturación electrónica DIAN |
| **contabilidad-service** | Python FastAPI | 3012 | Contabilidad PUC, IVA, SIMPLE |
| **gateway** | Node.js | 3000 | Proxy, WebSocket, rate limiting |
| **frontend** | React + Vite | 3005 | UI React + TypeScript + Tailwind |

### Bases de Datos
- **PostgreSQL** → Neon.tech (auth, transacciones, marketing, crédito, facturación, contabilidad)
- **MongoDB Atlas** → Catálogo, social, IA
- **Redis** → Caché AI service (dentro del cluster)

---

## ☁️ Infraestructura GKE

| Parámetro | Valor |
|-----------|-------|
| Proyecto GCP | `crypto-topic-492202-q9` |
| Cluster | `autopilot-cluster-1` |
| Región | `us-central1` |
| Namespace | `egos` |
| Registry | `us-central1-docker.pkg.dev/crypto-topic-492202-q9/egos-registry/` |

### Dominios
| Dominio | Destino |
|---------|---------|
| `egoscolombia.com.co` | frontend |
| `www.egoscolombia.com.co` | frontend |
| `api.egoscolombia.com.co` | gateway |
| `monitor.egoscolombia.com.co` | grafana |

SSL gestionado automáticamente por GKE `ManagedCertificate`.

---

## 🚀 CI/CD — GitHub Actions

Cada push a `main` ejecuta `.github/workflows/deploy.yml`:

1. Detecta qué servicios cambiaron (diff con HEAD~1)
2. Hace build y push solo de las imágenes modificadas a Artifact Registry
3. Ejecuta `kubectl set image` solo en los deployments afectados
4. Verifica el rollout con timeout de 300s

```bash
# El pipeline se activa automáticamente con:
git push origin main
```

---

## 🛠️ Despliegue Manual

### Prerrequisitos
```bash
# Autenticar en GCP
gcloud auth login
gcloud config set project crypto-topic-492202-q9

# Obtener credenciales del cluster
gcloud container clusters get-credentials autopilot-cluster-1 \
  --region us-central1 \
  --project crypto-topic-492202-q9
```

### 1. Configurar Secrets
```bash
# Editar k8s/secrets/secrets.yaml con los valores reales
# NUNCA commitear con valores reales

kubectl apply -f k8s/secrets/secrets.yaml
```

### 2. Desplegar todos los servicios
```bash
kubectl apply -f k8s/deployments/all-services.yaml
kubectl apply -f k8s/ingress/backend-config.yaml
kubectl apply -f k8s/ingress/frontend-config.yaml
kubectl apply -f k8s/ingress/ingress.yaml
kubectl apply -f k8s/autoscaling/hpa.yaml
kubectl apply -f k8s/monitoring/monitoring.yaml
kubectl apply -f k8s/network-policies/network-policies.yaml
```

O con el script npm:
```bash
npm run k8s:apply
```

### 3. Verificar estado
```bash
kubectl get pods -n egos
kubectl get services -n egos
kubectl get ingress -n egos
```

### Build manual de una imagen
```bash
REGISTRY=us-central1-docker.pkg.dev/crypto-topic-492202-q9/egos-registry

docker build -t $REGISTRY/auth-service:latest ./backend/services/auth-service
docker push $REGISTRY/auth-service:latest
kubectl rollout restart deployment/auth-service -n egos
```

---

## 📋 Comandos útiles

```bash
# Ver pods
kubectl get pods -n egos

# Logs de un servicio
kubectl logs -f deployment/gateway -n egos

# Reiniciar un servicio
kubectl rollout restart deployment/auth-service -n egos

# Escalar manualmente
kubectl scale deployment/gateway --replicas=3 -n egos

# Ver HPA
kubectl get hpa -n egos

# Entrar a un pod
kubectl exec -it deployment/auth-service -n egos -- sh
```

---

## 👥 Usuarios Demo

| Email | Contraseña | Rol |
|-------|------------|-----|
| `ceo@egoscolombia.com` | `admin123` | CEO |
| `demo@egoscolombia.com` | `admin123` | Cliente |
| `admin@egoscolombia.com` | `admin123` | Admin |
| `contador@egoscolombia.com` | `admin123` | Contador |

---

## 🔐 Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.
Los secrets en producción se gestionan con `k8s/secrets/secrets.yaml` (nunca commitear con valores reales).

---

## 📞 Contacto

**Jose Fernando Vertel** — VERTEL & CATILLO S.A.S
