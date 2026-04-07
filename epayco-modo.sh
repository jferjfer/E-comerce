#!/bin/bash
# ============================================
# ePayco — Cambiar modo pruebas/producción
# Uso:
#   ./epayco-modo.sh pruebas     → modo test (tarjetas de prueba, sin cobro real)
#   ./epayco-modo.sh produccion  → modo producción (cobro real)
#   ./epayco-modo.sh estado      → ver modo actual
# ============================================

export PATH="/media/jose/Disco/google-cloud-sdk/bin:$PATH"
NAMESPACE="egos"
DEPLOYMENT="transaction-service"

modo=$1

if [ -z "$modo" ]; then
    echo "Uso: ./epayco-modo.sh [pruebas|produccion|estado]"
    exit 1
fi

if [ "$modo" == "estado" ]; then
    ACTUAL=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="EPAYCO_TEST")].value}' 2>/dev/null)
    if [ "$ACTUAL" == "true" ]; then
        echo "🧪 ePayco está en MODO PRUEBAS (EPAYCO_TEST=true)"
        echo "   → Las tarjetas de prueba funcionan, no se cobra dinero real"
    else
        echo "🚀 ePayco está en MODO PRODUCCIÓN (EPAYCO_TEST=false)"
        echo "   → Se cobran pagos reales"
    fi
    exit 0
fi

if [ "$modo" == "pruebas" ]; then
    VALOR="true"
    EMOJI="🧪"
    DESCRIPCION="MODO PRUEBAS — No se cobra dinero real"
elif [ "$modo" == "produccion" ]; then
    VALOR="false"
    EMOJI="🚀"
    DESCRIPCION="MODO PRODUCCIÓN — Se cobran pagos reales"
    echo ""
    echo "⚠️  ADVERTENCIA: Estás activando el modo PRODUCCIÓN."
    echo "   Los clientes serán cobrados con dinero real."
    read -p "   ¿Confirmas? (escribe 'si' para continuar): " confirm
    if [ "$confirm" != "si" ]; then
        echo "❌ Cancelado"
        exit 1
    fi
else
    echo "❌ Modo inválido. Usa: pruebas | produccion | estado"
    exit 1
fi

echo ""
echo "$EMOJI Cambiando ePayco a $DESCRIPCION..."

# Actualizar en GKE
kubectl set env deployment/$DEPLOYMENT EPAYCO_TEST=$VALOR -n $NAMESPACE 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Variable actualizada en GKE"
    echo "⏳ Esperando que el pod reinicie..."
    kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=120s 2>&1 | tail -2
    echo ""
    echo "$EMOJI ePayco ahora está en: $DESCRIPCION"
else
    echo "❌ Error actualizando. Verifica que estés autenticado en GCP."
fi
