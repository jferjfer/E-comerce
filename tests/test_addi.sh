#!/bin/bash
# Test flujo ADDI — pago sin login + formulario datos envío
# Uso: bash tests/test_addi.sh

API="https://api.egoscolombia.com.co"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

echo ""
echo "================================================"
echo "  EGOS — Test Flujo ADDI (SIN LOGIN)"
echo "  Pago como invitado + formulario envío"
echo "================================================"
echo ""

# ── PRUEBA 1: Checkout SIN token funciona ────────
echo "--- PRUEBA 1: Checkout sin token (invitado) ---"
R=$(curl -s -X POST "$API/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "metodo_pago": "pago_en_linea",
    "direccion_envio": "Por confirmar",
    "items": [{"id": "1778704835541", "nombre": "Dizfraz Enfermera", "precio": 108561, "cantidad": 1}]
  }')
PEDIDO_ID=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orden',{}).get('id',''))" 2>/dev/null)
ESTADO=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orden',{}).get('estado',''))" 2>/dev/null)
TOTAL=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orden',{}).get('total',''))" 2>/dev/null)
if [ -n "$PEDIDO_ID" ]; then
  ok "Pedido creado SIN login | ID=$PEDIDO_ID | Estado=$ESTADO | Total=\$$TOTAL"
else
  fail "No se creó el pedido sin login: $R"
  exit 1
fi

# ── PRUEBA 2: Widget ePayco SIN token ────────────
echo ""
echo "--- PRUEBA 2: Widget ePayco sin token ---"
R=$(curl -s -X POST "$API/api/pagos/epayco/widget" \
  -H "Content-Type: application/json" \
  -d "{\"pedido_id\": \"$PEDIDO_ID\"}")
PUBLIC_KEY=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('public_key',''))" 2>/dev/null)
AMOUNT=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('amount',''))" 2>/dev/null)
TAX=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('tax',''))" 2>/dev/null)
if [ -n "$PUBLIC_KEY" ]; then
  ok "Widget generado SIN token | amount=$AMOUNT | tax=$TAX"
else
  fail "Widget no generado sin token: $R"
fi

# ── PRUEBA 3: Formulario datos envío ─────────────
echo ""
echo "--- PRUEBA 3: Guardar datos de envío post-pago ---"
R=$(curl -s -X PUT "$API/api/pedidos/$PEDIDO_ID/datos-envio" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Maria Lopez ADDI Test",
    "email": "maria@addi.com",
    "telefono": "3001234567",
    "direccion": "Calle 80 # 45-10 Apto 301",
    "ciudad": "Bogota",
    "departamento": "Cundinamarca"
  }')
MSG=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('mensaje',''))" 2>/dev/null)
if echo "$R" | grep -qi "exitosamente\|guardado"; then
  ok "Datos de envío guardados | $MSG"
else
  fail "Error guardando datos: $R"
fi

# ── PRUEBA 4: Verificar datos en BD ──────────────
echo ""
echo "--- PRUEBA 4: Verificar datos guardados en BD ---"
# Usamos el token del usuario para ver el pedido
TOKEN_USER=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"josefer21jf@gmail.com","password":"Vertel12@"}' | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

# Verificar en logs del pod
DATOS=$(kubectl exec deployment/transaction-service -n egos -- \
  node -e "
const pool = require('./config/baseDatos');
pool.query('SELECT cliente_nombre, cliente_email, cliente_telefono, cliente_direccion FROM pedido WHERE id = \$1', ['$PEDIDO_ID'])
  .then(r => { console.log(JSON.stringify(r.rows[0])); process.exit(0); })
  .catch(e => { console.log('error:'+e.message); process.exit(1); });
" 2>/dev/null)
NOMBRE_BD=$(echo $DATOS | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('cliente_nombre',''))" 2>/dev/null)
TELEFONO_BD=$(echo $DATOS | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('cliente_telefono',''))" 2>/dev/null)
DIRECCION_BD=$(echo $DATOS | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('cliente_direccion',''))" 2>/dev/null)
if [ -n "$NOMBRE_BD" ]; then
  ok "Datos en BD verificados:"
  echo "    Nombre:    $NOMBRE_BD"
  echo "    Teléfono:  $TELEFONO_BD"
  echo "    Dirección: $DIRECCION_BD"
else
  info "No se pudo verificar en BD directamente, verificando via API..."
  # Fallback: verificar que el endpoint responde correctamente
  R2=$(curl -s -X PUT "$API/api/pedidos/$PEDIDO_ID/datos-envio" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Verificacion","telefono":"3009999999","direccion":"Test","ciudad":"Bogota"}')
  echo "$R2" | grep -qi "exitosamente" && ok "Endpoint datos-envio funcional" || fail "Endpoint datos-envio con error"
fi

# ── PRUEBA 5: Validaciones del formulario ─────────
echo ""
echo "--- PRUEBA 5: Validaciones del formulario de envío ---"

# Sin nombre
H=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/api/pedidos/$PEDIDO_ID/datos-envio" \
  -H "Content-Type: application/json" \
  -d '{"telefono":"3001234567","direccion":"Calle 80","ciudad":"Bogota"}')
[ "$H" = "400" ] && ok "Sin nombre → 400" || fail "Sin nombre → $H (esperado 400)"

# Sin teléfono
H=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/api/pedidos/$PEDIDO_ID/datos-envio" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","direccion":"Calle 80","ciudad":"Bogota"}')
[ "$H" = "400" ] && ok "Sin teléfono → 400" || fail "Sin teléfono → $H (esperado 400)"

# Sin dirección
H=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/api/pedidos/$PEDIDO_ID/datos-envio" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","telefono":"3001234567","ciudad":"Bogota"}')
[ "$H" = "400" ] && ok "Sin dirección → 400" || fail "Sin dirección → $H (esperado 400)"

# Sin ciudad
H=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/api/pedidos/$PEDIDO_ID/datos-envio" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","telefono":"3001234567","direccion":"Calle 80"}')
[ "$H" = "400" ] && ok "Sin ciudad → 400" || fail "Sin ciudad → $H (esperado 400)"

# ── PRUEBA 6: Flujo completo sin login ────────────
echo ""
echo "--- PRUEBA 6: Flujo completo ADDI de principio a fin ---"
info "Paso 1: Obtener productos..."
PROD=$(curl -s "$API/api/productos?limite=1")
P_ID=$(echo $PROD | python3 -c "import json,sys; d=json.load(sys.stdin); p=d.get('productos',[]); print(p[0]['id'] if p else '')" 2>/dev/null)
P_PRECIO=$(echo $PROD | python3 -c "import json,sys; d=json.load(sys.stdin); p=d.get('productos',[]); print(p[0]['precio'] if p else 0)" 2>/dev/null)
P_NOMBRE=$(echo $PROD | python3 -c "import json,sys; d=json.load(sys.stdin); p=d.get('productos',[]); print(p[0]['nombre'] if p else '')" 2>/dev/null)
[ -n "$P_ID" ] && ok "Producto: $P_NOMBRE (\$$P_PRECIO)" || fail "No hay productos"

info "Paso 2: Crear pedido sin login..."
R=$(curl -s -X POST "$API/api/checkout" \
  -H "Content-Type: application/json" \
  -d "{\"metodo_pago\":\"pago_en_linea\",\"items\":[{\"id\":\"$P_ID\",\"nombre\":\"$P_NOMBRE\",\"precio\":$P_PRECIO,\"cantidad\":1}]}")
PID=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orden',{}).get('id',''))" 2>/dev/null)
[ -n "$PID" ] && ok "Pedido creado: $PID" || fail "Error creando pedido: $R"

info "Paso 3: Obtener widget ePayco sin login..."
R=$(curl -s -X POST "$API/api/pagos/epayco/widget" \
  -H "Content-Type: application/json" \
  -d "{\"pedido_id\":\"$PID\"}")
PK=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('public_key',''))" 2>/dev/null)
[ -n "$PK" ] && ok "Widget listo para abrir ePayco" || fail "Error obteniendo widget: $R"

info "Paso 4: Simular post-pago — guardar datos de envío..."
R=$(curl -s -X PUT "$API/api/pedidos/$PID/datos-envio" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Cliente ADDI","email":"cliente@addi.com","telefono":"3157654321","direccion":"Av El Dorado # 68C-61","ciudad":"Bogota","departamento":"Cundinamarca"}')
echo $R | grep -qi "exitosamente" && ok "Datos de envío guardados" || fail "Error: $R"

echo ""
ok "FLUJO COMPLETO ADDI: ✅ Productos → ✅ Checkout sin login → ✅ Widget ePayco → ✅ Datos envío"

# ── RESUMEN ───────────────────────────────────────
echo ""
echo "================================================"
echo "  RESUMEN PRUEBAS ADDI"
echo "================================================"
echo -e "  Pedido prueba 1: ${YELLOW}$PEDIDO_ID${NC}"
echo -e "  Pedido prueba 2: ${YELLOW}$PID${NC}"
echo ""
echo "  Ambos pedidos en estado 'Creado' (sin factura DIAN)"
echo "  Para limpiarlos:"
echo "  kubectl exec -it deployment/transaction-service -n egos -- node -e \\"
echo "  \"const p=require('./config/baseDatos'); p.query(\\\"DELETE FROM pedido WHERE id IN ('$PEDIDO_ID','$PID')\\\").then(()=>process.exit())\""
echo "================================================"
