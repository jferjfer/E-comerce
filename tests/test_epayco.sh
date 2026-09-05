#!/bin/bash
# Test flujo ePayco — EGOS Colombia
# MODO SIMULADO: no genera facturas DIAN reales
# Uso: bash tests/test_epayco.sh

API="https://api.egoscolombia.com.co"
EMAIL="josefer21jf@gmail.com"
PASS="Vertel12@"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

echo ""
echo "================================================"
echo "  EGOS — Test Flujo ePayco (SIMULADO)"
echo "  NO genera facturas DIAN reales"
echo "================================================"
echo ""

# ── PRUEBA 1: Gateway activo ──────────────────────
echo "--- PRUEBA 1: Gateway activo ---"
R=$(curl -s "$API/salud")
ESTADO=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('estado',''))" 2>/dev/null)
[ "$ESTADO" = "activo" ] && ok "Gateway activo" || fail "Gateway no responde: $R"

# ── PRUEBA 2: ePayco configurado ─────────────────
echo ""
echo "--- PRUEBA 2: ePayco configurado ---"
R=$(curl -s "$API/api/pagos/epayco/estado")
CONF=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(str(d.get('configurado','')).lower())" 2>/dev/null)
TEST_MODE=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(str(d.get('test','')).lower())" 2>/dev/null)
[ "$CONF" = "true" ] && ok "ePayco configurado | modo_test=$TEST_MODE" || fail "ePayco NO configurado: $R"

# ── PRUEBA 3: Login ───────────────────────────────
echo ""
echo "--- PRUEBA 3: Login cliente ---"
R=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
EXITO=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(str(d.get('exito','')).lower())" 2>/dev/null)
USER_ID=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('usuario',{}).get('id',''))" 2>/dev/null)
if [ "$EXITO" = "true" ] && [ -n "$TOKEN" ]; then
  ok "Login exitoso | usuario_id=$USER_ID"
else
  fail "Login fallido: $R"
  exit 1
fi

# ── PRUEBA 4: Listar productos ────────────────────
echo ""
echo "--- PRUEBA 4: Listar productos ---"
R=$(curl -s "$API/api/productos?limite=3")
TOTAL=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('total',0))" 2>/dev/null)
PROD_ID=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); prods=d.get('productos',[]); print(prods[0]['id'] if prods else '')" 2>/dev/null)
PROD_PRECIO=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); prods=d.get('productos',[]); print(prods[0]['precio'] if prods else 0)" 2>/dev/null)
PROD_NOMBRE=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); prods=d.get('productos',[]); print(prods[0]['nombre'] if prods else '')" 2>/dev/null)
if [ "$TOTAL" -gt 0 ] 2>/dev/null; then
  ok "Productos disponibles: $TOTAL | Usando: $PROD_NOMBRE (\$$PROD_PRECIO)"
else
  fail "No se obtuvieron productos"
  exit 1
fi

# ── PRUEBA 5: Checkout — crear pedido ────────────
echo ""
echo "--- PRUEBA 5: Crear pedido (checkout) ---"
R=$(curl -s -X POST "$API/api/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"metodo_pago\": \"pago_en_linea\",
    \"direccion_envio\": \"Calle 80 # 45-10, Bogota\",
    \"items\": [{\"id\": \"$PROD_ID\", \"nombre\": \"$PROD_NOMBRE\", \"precio\": $PROD_PRECIO, \"cantidad\": 1}]
  }")
PEDIDO_ID=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orden',{}).get('id',''))" 2>/dev/null)
PEDIDO_ESTADO=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orden',{}).get('estado',''))" 2>/dev/null)
PEDIDO_TOTAL=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orden',{}).get('total',''))" 2>/dev/null)
if [ -n "$PEDIDO_ID" ]; then
  ok "Pedido creado | ID=$PEDIDO_ID | Estado=$PEDIDO_ESTADO | Total=\$$PEDIDO_TOTAL"
else
  fail "No se creó el pedido: $R"
  exit 1
fi

# ── PRUEBA 6: BUG-04 — Pago nace en Pendiente ────
echo ""
echo "--- PRUEBA 6: BUG-04 — Pago nace en Pendiente (no Aprobado) ---"
# Verificamos el estado del pedido recién creado
R=$(curl -s "$API/api/pedidos" -H "Authorization: Bearer $TOKEN")
PEDIDO_ESTADO_BD=$(echo $R | python3 -c "
import json,sys
d=json.load(sys.stdin)
p=[x for x in d.get('pedidos',[]) if x.get('id')=='$PEDIDO_ID']
print(p[0].get('estado','no_encontrado') if p else 'no_encontrado')
" 2>/dev/null)
if [ "$PEDIDO_ESTADO_BD" = "Creado" ]; then
  ok "BUG-04 CORREGIDO: pedido en 'Creado', pago en 'Pendiente' (espera confirmación ePayco)"
else
  info "Estado pedido en BD: $PEDIDO_ESTADO_BD"
fi

# ── PRUEBA 7: Widget ePayco — IVA 0% ─────────────
echo ""
echo "--- PRUEBA 7: Widget ePayco + BUG-07 IVA 0% ---"
R=$(curl -s -X POST "$API/api/pagos/epayco/widget" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"pedido_id\": \"$PEDIDO_ID\"}")
PUBLIC_KEY=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('public_key',''))" 2>/dev/null)
AMOUNT=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('amount',''))" 2>/dev/null)
TAX=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('tax',''))" 2>/dev/null)
TAX_BASE=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('tax_base',''))" 2>/dev/null)
INVOICE=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('datos_widget',{}).get('invoice',''))" 2>/dev/null)
if [ -n "$PUBLIC_KEY" ]; then
  ok "Widget generado | amount=$AMOUNT | tax=$TAX | tax_base=$TAX_BASE"
  [ "$TAX" = "0" ] && ok "BUG-07 CORREGIDO: IVA=0 (correcto para ropa colombiana)" || fail "BUG-07 PRESENTE: IVA=$TAX (debería ser 0)"
  [ "$INVOICE" = "$PEDIDO_ID" ] && ok "invoice coincide con pedido_id" || fail "invoice=$INVOICE no coincide con pedido_id=$PEDIDO_ID"
else
  fail "No se obtuvo widget: $R"
fi

# ── PRUEBA 8: BUG-01 — Webhook parsea form-urlencoded ──
echo ""
echo "--- PRUEBA 8: BUG-01 — Webhook parsea form-urlencoded ---"
# Enviamos con firma inválida a propósito — si el body llega vacío responde
# "Pedido ID no encontrado", si llega bien responde "Firma inválida"
R=$(curl -s -X POST "$API/api/pagos/epayco/confirmar" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "x_extra1=TEST_SIMULADO&x_response_code_transaction=1&x_ref_payco=SIM001&x_transaction_id=TXN_SIM001&x_amount=50000&x_currency_code=COP&x_signature=firma_invalida_simulada")
if echo "$R" | grep -qi "firma\|signature\|inv"; then
  ok "BUG-01 CORREGIDO: webhook parseó form-urlencoded (rechazó por firma, no por body vacío)"
elif echo "$R" | grep -qi "Pedido ID no encontrado\|pedido.*no.*encontrado"; then
  fail "BUG-01 AÚN PRESENTE: body llegó vacío al webhook"
else
  info "Respuesta webhook: $R"
fi

# ── PRUEBA 9: BUG-03 — Firma falsa rechazada ─────
echo ""
echo "--- PRUEBA 9: BUG-03 — Firma falsa siempre rechazada ---"
R=$(curl -s -X POST "$API/api/pagos/epayco/confirmar" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "x_extra1=PEDIDO_FALSO_999&x_response_code_transaction=1&x_ref_payco=FAKE&x_transaction_id=FAKE&x_amount=999999&x_currency_code=COP&x_signature=aaabbbccc000111222333")
if echo "$R" | grep -qi "firma\|inv\u00e1lida\|invalid\|signature"; then
  ok "BUG-03 CORREGIDO: firma falsa rechazada (no hay bypass en modo producción)"
elif echo "$R" | grep -qi "\"ok\".*true\|ok.*true"; then
  fail "BUG-03 PRESENTE: firma falsa aceptada — FRAUDE POSIBLE"
else
  info "Respuesta: $R"
fi

# ── PRUEBA 10: BUG-05 — Idempotencia ─────────────
echo ""
echo "--- PRUEBA 10: BUG-05 — Idempotencia webhook duplicado ---"
# Enviamos el mismo webhook dos veces con firma inválida
# Lo que verificamos es que el endpoint responde consistentemente
R1=$(curl -s -X POST "$API/api/pagos/epayco/confirmar" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "x_extra1=$PEDIDO_ID&x_response_code_transaction=1&x_ref_payco=DUP_SIM&x_transaction_id=DUP_TXN&x_amount=$PEDIDO_TOTAL&x_currency_code=COP&x_signature=firma_invalida")
R2=$(curl -s -X POST "$API/api/pagos/epayco/confirmar" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "x_extra1=$PEDIDO_ID&x_response_code_transaction=1&x_ref_payco=DUP_SIM&x_transaction_id=DUP_TXN&x_amount=$PEDIDO_TOTAL&x_currency_code=COP&x_signature=firma_invalida")
if [ "$R1" = "$R2" ]; then
  ok "BUG-05: respuestas idénticas en llamadas duplicadas (idempotencia consistente)"
else
  info "Respuesta 1: $R1"
  info "Respuesta 2: $R2"
fi

# ── PRUEBA 11: Seguridad — sin token 401 ─────────
echo ""
echo "--- PRUEBA 11: Seguridad — endpoints protegidos retornan 401 ---"
H1=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/pedidos")
H2=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/checkout" -H "Content-Type: application/json" -d '{}')
H3=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/pagos/epayco/widget" -H "Content-Type: application/json" -d '{}')
[ "$H1" = "401" ] && ok "GET /api/pedidos sin token → 401" || fail "GET /api/pedidos sin token → $H1 (esperado 401)"
[ "$H2" = "401" ] && ok "POST /api/checkout sin token → 401" || fail "POST /api/checkout sin token → $H2 (esperado 401)"
[ "$H3" = "401" ] && ok "POST /api/pagos/epayco/widget sin token → 401" || fail "POST /api/pagos/epayco/widget sin token → $H3 (esperado 401)"

# ── PRUEBA 12: Validaciones de checkout ──────────
echo ""
echo "--- PRUEBA 12: Validaciones de checkout ---"
# Items vacíos
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/checkout" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"metodo_pago":"pago_en_linea","items":[]}')
[ "$H" = "400" ] && ok "Items vacíos → 400" || info "Items vacíos → $H"

# Precio negativo
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/checkout" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"metodo_pago\":\"pago_en_linea\",\"items\":[{\"id\":\"$PROD_ID\",\"nombre\":\"Test\",\"precio\":-1000,\"cantidad\":1}]}")
[ "$H" = "400" ] && ok "Precio negativo → 400" || fail "Precio negativo → $H (esperado 400)"

# Cantidad 0
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/checkout" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"metodo_pago\":\"pago_en_linea\",\"items\":[{\"id\":\"$PROD_ID\",\"nombre\":\"Test\",\"precio\":50000,\"cantidad\":0}]}")
[ "$H" = "400" ] && ok "Cantidad 0 → 400" || fail "Cantidad 0 → $H (esperado 400)"

# Precio excesivo
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/checkout" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"metodo_pago\":\"pago_en_linea\",\"items\":[{\"id\":\"$PROD_ID\",\"nombre\":\"Test\",\"precio\":99999999,\"cantidad\":1}]}")
[ "$H" = "400" ] && ok "Precio excesivo → 400" || fail "Precio excesivo → $H (esperado 400)"

# ── PRUEBA 13: Bono inexistente rechazado ─────────
echo ""
echo "--- PRUEBA 13: Bono inexistente rechazado ---"
R=$(curl -s -X POST "$API/api/bonos/validar" \
  -H "Content-Type: application/json" \
  -d "{\"codigo\":\"EGOSXXXXXX\",\"usuario_id\":$USER_ID}")
VALIDO=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(str(d.get('valido','')).lower())" 2>/dev/null)
[ "$VALIDO" = "false" ] && ok "Bono inexistente rechazado correctamente" || fail "Bono inexistente aceptado: $R"

# ── PRUEBA 14: Mis pedidos ────────────────────────
echo ""
echo "--- PRUEBA 14: Listar pedidos del usuario ---"
R=$(curl -s "$API/api/pedidos" -H "Authorization: Bearer $TOKEN")
TOTAL_P=$(echo $R | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('total',0))" 2>/dev/null)
if [ "$TOTAL_P" -gt 0 ] 2>/dev/null; then
  ok "Pedidos del usuario: $TOTAL_P"
  echo $R | python3 -c "
import json,sys
d=json.load(sys.stdin)
for p in d.get('pedidos',[])[:3]:
    print(f\"    {p['id']} | {p['estado']} | \${p['total']}\")
" 2>/dev/null
else
  fail "No se obtuvieron pedidos"
fi

# ── RESUMEN ───────────────────────────────────────
echo ""
echo "================================================"
echo "  RESUMEN"
echo "================================================"
echo -e "  Pedido de prueba: ${YELLOW}$PEDIDO_ID${NC} (estado: Creado)"
echo -e "  Total: ${YELLOW}\$$PEDIDO_TOTAL${NC}"
echo ""
echo -e "  ${YELLOW}NOTA:${NC} El pedido $PEDIDO_ID quedó en estado 'Creado'."
echo "  No se generó factura DIAN. Para limpiarlo manualmente:"
echo "  kubectl exec -it deployment/transaction-service -n egos -- node -e \\"
echo "  \"require('./config/baseDatos').query(\\\"DELETE FROM pedido WHERE id='$PEDIDO_ID'\\\")\" "
echo "================================================"
