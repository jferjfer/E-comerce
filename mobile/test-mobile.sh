#!/bin/bash
# ============================================================
#  EGOS MOBILE — Script de pruebas end-to-end
#  Prueba todos los endpoints que usa la app mobile
# ============================================================

API="https://api.egoscolombia.com.co"
EMAIL="test_mobile_$(date +%s)@egos.com.co"
PASSWORD="TestMobile123!"
TOKEN=""
USUARIO_ID=""
PRODUCTO_ID=""
PEDIDO_ID=""

PASS=0
FAIL=0
TOTAL=0

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

header() {
  echo ""
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD}  🧪 EGOS MOBILE — Pruebas End-to-End${NC}"
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════${NC}"
  echo -e "  API: ${YELLOW}$API${NC}"
  echo -e "  Email: ${YELLOW}$EMAIL${NC}"
  echo ""
}

test_case() {
  local nombre="$1"
  local status="$2"
  local esperado="$3"
  local respuesta="$4"
  TOTAL=$((TOTAL + 1))

  if [[ "$status" == "$esperado" ]] || [[ "$esperado" == "2xx" && "$status" =~ ^2 ]]; then
    echo -e "  ${GREEN}✅ [$TOTAL]${NC} $nombre ${GREEN}($status)${NC}"
    PASS=$((PASS + 1))
    return 0
  else
    echo -e "  ${RED}❌ [$TOTAL]${NC} $nombre ${RED}(esperado $esperado, obtenido $status)${NC}"
    if [[ -n "$respuesta" ]]; then
      echo -e "     ${YELLOW}↳ $(echo $respuesta | head -c 200)${NC}"
    fi
    FAIL=$((FAIL + 1))
    return 1
  fi
}

# ─── INICIO ──────────────────────────────────────────────────
header

# ────────────────────────────────────────────────────────────
echo -e "${BOLD}📋 BLOQUE 1 — Público (sin auth)${NC}"
echo "──────────────────────────────────────────"

# 1. Productos
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/productos?limite=5")
BODY=$(cat /tmp/egos_resp.json)
PRODUCTOS_COUNT=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('productos',[])))" 2>/dev/null)
test_case "GET /api/productos" "$RESP" "200" "$BODY"
echo -e "     ${YELLOW}↳ $PRODUCTOS_COUNT productos recibidos${NC}"

# Guardar primer producto
PRODUCTO_ID=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('productos',[])[0].get('id',''))" 2>/dev/null)

# 2. Categorías
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/categorias")
BODY=$(cat /tmp/egos_resp.json)
CATS_COUNT=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('categorias',[])))" 2>/dev/null)
test_case "GET /api/categorias" "$RESP" "200" "$BODY"
echo -e "     ${YELLOW}↳ $CATS_COUNT categorías recibidas${NC}"

# 3. Detalle producto
if [[ -n "$PRODUCTO_ID" ]]; then
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/productos/$PRODUCTO_ID")
  BODY=$(cat /tmp/egos_resp.json)
  PROD_NOMBRE=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('producto',{}).get('nombre','?'))" 2>/dev/null)
  test_case "GET /api/productos/:id" "$RESP" "200" "$BODY"
  echo -e "     ${YELLOW}↳ Producto: $PROD_NOMBRE${NC}"
else
  echo -e "  ${YELLOW}⚠️  [$TOTAL] Detalle producto — sin ID disponible${NC}"
fi

# 4. Reseñas producto
if [[ -n "$PRODUCTO_ID" ]]; then
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/resenas/$PRODUCTO_ID")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "GET /api/resenas/:id" "$RESP" "200" "$BODY"
fi

# 5. Campañas
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/campanas")
BODY=$(cat /tmp/egos_resp.json)
CAMP_COUNT=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('campanas',[])))" 2>/dev/null)
test_case "GET /api/campanas" "$RESP" "200" "$BODY"
echo -e "     ${YELLOW}↳ $CAMP_COUNT campañas activas${NC}"

# 6. Cupones
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/cupones")
BODY=$(cat /tmp/egos_resp.json)
CUP_COUNT=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('cupones',[])))" 2>/dev/null)
test_case "GET /api/cupones" "$RESP" "200" "$BODY"
echo -e "     ${YELLOW}↳ $CUP_COUNT cupones disponibles${NC}"

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🔐 BLOQUE 2 — Autenticación${NC}"
echo "──────────────────────────────────────────"

# 7. Registro
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Test\",\"apellido\":\"Mobile\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"documento_tipo\":\"CC\",\"documento_numero\":\"123456789\",\"acepta_terminos\":true,\"acepta_datos\":true}")
BODY=$(cat /tmp/egos_resp.json)
test_case "POST /api/auth/register" "$RESP" "2xx" "$BODY"

# 8. Login
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
BODY=$(cat /tmp/egos_resp.json)
test_case "POST /api/auth/login" "$RESP" "200" "$BODY"

TOKEN=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or d.get('datos',{}).get('token',''))" 2>/dev/null)
USUARIO_ID=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); u=d.get('usuario') or d.get('datos',{}).get('usuario',{}); print(u.get('id',''))" 2>/dev/null)

if [[ -n "$TOKEN" ]]; then
  echo -e "     ${YELLOW}↳ Token obtenido ✓ | Usuario ID: $USUARIO_ID${NC}"
else
  echo -e "     ${RED}↳ No se obtuvo token — pruebas con auth no ejecutarán${NC}"
fi

# 9. Perfil
if [[ -n "$TOKEN" ]]; then
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/usuarios/perfil" \
    -H "Authorization: Bearer $TOKEN")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "GET /api/usuarios/perfil" "$RESP" "200" "$BODY"
fi

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🛒 BLOQUE 3 — Carrito${NC}"
echo "──────────────────────────────────────────"

if [[ -n "$TOKEN" && -n "$PRODUCTO_ID" ]]; then

  # 10. Agregar al carrito
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/carrito" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"id_producto\":\"$PRODUCTO_ID\",\"cantidad\":1}")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "POST /api/carrito (agregar)" "$RESP" "2xx" "$BODY"

  # 11. Ver carrito
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/carrito" \
    -H "Authorization: Bearer $TOKEN")
  BODY=$(cat /tmp/egos_resp.json)
  ITEMS=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('datos',{}).get('productos', d.get('items',[]))))" 2>/dev/null)
  test_case "GET /api/carrito" "$RESP" "200" "$BODY"
  echo -e "     ${YELLOW}↳ $ITEMS item(s) en carrito${NC}"

else
  echo -e "  ${YELLOW}⚠️  Carrito — sin token o producto ID, omitiendo${NC}"
fi

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}📦 BLOQUE 4 — Pedidos & Checkout${NC}"
echo "──────────────────────────────────────────"

if [[ -n "$TOKEN" && -n "$PRODUCTO_ID" ]]; then

  # 12. Checkout
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/checkout" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"metodo_pago\":\"pago_en_linea\",\"direccion_envio\":\"Calle Test 123\",\"items\":[{\"id\":\"$PRODUCTO_ID\",\"nombre\":\"Test\",\"precio\":50000,\"cantidad\":1}],\"descuento_bono\":0}")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "POST /api/checkout" "$RESP" "2xx" "$BODY"

  PEDIDO_ID=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('orden',{}).get('id', d.get('pedido',{}).get('id','')))" 2>/dev/null)
  if [[ -n "$PEDIDO_ID" ]]; then
    echo -e "     ${YELLOW}↳ Pedido creado: #$PEDIDO_ID${NC}"
  fi

  # 13. Ver pedidos
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/pedidos" \
    -H "Authorization: Bearer $TOKEN")
  BODY=$(cat /tmp/egos_resp.json)
  PED_COUNT=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('pedidos',[])))" 2>/dev/null)
  test_case "GET /api/pedidos" "$RESP" "200" "$BODY"
  echo -e "     ${YELLOW}↳ $PED_COUNT pedido(s) encontrado(s)${NC}"

  # 14. Historial pedido
  if [[ -n "$PEDIDO_ID" ]]; then
    RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/pedidos/$PEDIDO_ID/historial" \
      -H "Authorization: Bearer $TOKEN")
    BODY=$(cat /tmp/egos_resp.json)
    test_case "GET /api/pedidos/:id/historial" "$RESP" "200" "$BODY"
  fi

else
  echo -e "  ${YELLOW}⚠️  Checkout/Pedidos — sin token, omitiendo${NC}"
fi

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}❤️  BLOQUE 5 — Favoritos${NC}"
echo "──────────────────────────────────────────"

if [[ -n "$TOKEN" && -n "$PRODUCTO_ID" ]]; then

  # 15. Agregar favorito
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/listas-deseos" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"producto_id\":\"$PRODUCTO_ID\"}")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "POST /api/listas-deseos (agregar)" "$RESP" "2xx" "$BODY"

  # 16. Ver favoritos
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/listas-deseos" \
    -H "Authorization: Bearer $TOKEN")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "GET /api/listas-deseos" "$RESP" "200" "$BODY"

  # 17. Eliminar favorito
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X DELETE "$API/api/listas-deseos/$PRODUCTO_ID" \
    -H "Authorization: Bearer $TOKEN")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "DELETE /api/listas-deseos/:id (eliminar)" "$RESP" "2xx" "$BODY"

fi

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🎁 BLOQUE 6 — Bonos & Marketing${NC}"
echo "──────────────────────────────────────────"

# 18. Validar bono (código inexistente — debe responder)
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/bonos/validar" \
  -H "Content-Type: application/json" \
  -d "{\"codigo\":\"TEST123\",\"usuario_id\":1}")
BODY=$(cat /tmp/egos_resp.json)
test_case "POST /api/bonos/validar" "$RESP" "200" "$BODY"

# 19. Bonos de usuario
if [[ -n "$TOKEN" && -n "$USUARIO_ID" ]]; then
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" "$API/api/bonos/usuario/$USUARIO_ID" \
    -H "Authorization: Bearer $TOKEN")
  BODY=$(cat /tmp/egos_resp.json)
  test_case "GET /api/bonos/usuario/:id" "$RESP" "200" "$BODY"
fi

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}💳 BLOQUE 7 — Crédito${NC}"
echo "──────────────────────────────────────────"

if [[ -n "$TOKEN" && -n "$USUARIO_ID" ]]; then

  # 20. Evaluar crédito
  RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/credito/evaluar" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"usuario_id\":$USUARIO_ID,\"fecha_registro\":\"2024-01-01T00:00:00Z\",\"total_compras_historico\":0,\"numero_compras\":0}")
  BODY=$(cat /tmp/egos_resp.json)
  CALIFICA=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print('Sí' if d.get('califica') else 'No')" 2>/dev/null)
  test_case "POST /api/credito/evaluar" "$RESP" "200" "$BODY"
  echo -e "     ${YELLOW}↳ ¿Califica para crédito? $CALIFICA${NC}"

fi

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🤖 BLOQUE 8 — Chat IA (Noa)${NC}"
echo "──────────────────────────────────────────"

# 21. Chat IA
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"mensaje\":\"Hola, busco un vestido elegante\",\"historial\":[]}")
BODY=$(cat /tmp/egos_resp.json)
RESPUESTA_IA=$(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('respuesta',''))[:80])" 2>/dev/null)
test_case "POST /api/chat (IA Noa)" "$RESP" "200" "$BODY"
if [[ -n "$RESPUESTA_IA" ]]; then
  echo -e "     ${YELLOW}↳ Noa: \"$RESPUESTA_IA...\"${NC}"
fi

# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}📲 BLOQUE 9 — Recuperar contraseña${NC}"
echo "──────────────────────────────────────────"

# 22. Recuperar contraseña
RESP=$(curl -s -o /tmp/egos_resp.json -w "%{http_code}" -X POST "$API/api/auth/recuperar-contrasena" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")
BODY=$(cat /tmp/egos_resp.json)
test_case "POST /api/auth/recuperar-contrasena" "$RESP" "2xx" "$BODY"

# ────────────────────────────────────────────────────────────
# RESUMEN FINAL
echo ""
echo -e "${CYAN}${BOLD}══════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  📊 RESULTADOS FINALES${NC}"
echo -e "${CYAN}${BOLD}══════════════════════════════════════════${NC}"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}✅ $PASS/$TOTAL pruebas pasaron — TODO OK${NC}"
else
  echo -e "  ${GREEN}✅ $PASS/$TOTAL pasaron${NC}"
  echo -e "  ${RED}❌ $FAIL/$TOTAL fallaron${NC}"
fi

echo ""
echo -e "  ${YELLOW}Usuario de prueba creado:${NC}"
echo -e "  Email:    $EMAIL"
echo -e "  Password: $PASSWORD"
echo ""

# Cleanup
rm -f /tmp/egos_resp.json

exit $FAIL
