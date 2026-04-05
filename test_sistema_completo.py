"""
Test completo del sistema EGOS — todas las funcionalidades
"""
import requests
import json
import sys

BASE = "https://api.egoscolombia.com.co"
RESULTADOS = []

def test(nombre, ok, detalle=""):
    emoji = "✅" if ok else "❌"
    RESULTADOS.append((nombre, ok, detalle))
    print(f"  {emoji} {nombre}{': ' + detalle if detalle else ''}")

def post(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.post(f"{BASE}{url}", json=data, headers=headers, timeout=10)

def get(url, token=None, params=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.get(f"{BASE}{url}", headers=headers, params=params, timeout=10)

def put(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.put(f"{BASE}{url}", json=data, headers=headers, timeout=10)

print("\n" + "="*60)
print("🧪 TEST COMPLETO SISTEMA EGOS")
print("="*60)

# ============================================
# 4. AUTH SERVICE
# ============================================
print("\n=== 4. AUTH SERVICE ===")

r = post("/api/auth/login", {"email": "ceo@estilomoda.com", "password": "admin123"})
d = r.json()
CEO_TOKEN = d.get("token", "")
test("Login CEO", r.status_code == 200 and bool(CEO_TOKEN), d.get("usuario", {}).get("rol", ""))

r = post("/api/auth/login", {"email": "demo@estilomoda.com", "password": "admin123"})
d = r.json()
CLIENTE_TOKEN = d.get("token", "")
test("Login Cliente", r.status_code == 200 and bool(CLIENTE_TOKEN), d.get("usuario", {}).get("rol", ""))

r = post("/api/auth/login", {"email": "contador@egoscolombia.com", "password": "Contador2024!"})
d = r.json()
CONTADOR_TOKEN = d.get("token", "")
test("Login Contador", r.status_code == 200 and bool(CONTADOR_TOKEN), d.get("usuario", {}).get("rol", ""))

r = get("/api/auth/verificar", CEO_TOKEN)
test("Verificar token JWT", r.status_code == 200, r.json().get("usuario", {}).get("rol", ""))

r = get("/api/usuarios/perfil", CLIENTE_TOKEN)
test("Obtener perfil usuario", r.status_code == 200, r.json().get("datos", {}).get("nombre", ""))

r = post("/api/auth/login", {"email": "noexiste@test.com", "password": "wrong"})
test("Login credenciales inválidas", r.status_code == 401 and not r.json().get("exito", True), "HTTP 401 correcto")

# ============================================
# 5. CATÁLOGO
# ============================================
print("\n=== 5. CATÁLOGO SERVICE ===")

r = get("/api/productos")
d = r.json()
PRODUCTO = d.get("productos", [{}])[0] if d.get("productos") else {}
PROD_ID = PRODUCTO.get("id", "")
test("Listar productos", r.status_code == 200 and d.get("total", 0) > 0, f"{d.get('total', 0)} productos")

r = get(f"/api/productos/{PROD_ID}")
test("Obtener producto por ID", r.status_code == 200, PRODUCTO.get("nombre", ""))

r = get("/api/categorias")
test("Listar categorías", r.status_code == 200, f"{len(r.json().get('categorias', []))} categorías")

r = get("/api/productos", params={"buscar": "vestido"})
test("Buscar productos", r.status_code == 200, f"{r.json().get('total', 0)} resultados")

r = get("/api/productos", params={"categoria": "Vestidos"})
test("Filtrar por categoría", r.status_code == 200, f"{r.json().get('total', 0)} vestidos")

r = get("/api/productos", params={"ordenar": "precio_asc"})
test("Ordenar por precio", r.status_code == 200)

# ============================================
# 6. CARRITO
# ============================================
print("\n=== 6. CARRITO ===")

r = get("/api/carrito", CLIENTE_TOKEN)
test("Obtener carrito vacío", r.status_code == 200)

r = post("/api/carrito", {"id_producto": PROD_ID, "cantidad": 1}, CLIENTE_TOKEN)
test("Agregar producto al carrito", r.status_code == 200, r.json().get("mensaje", ""))

r = get("/api/carrito", CLIENTE_TOKEN)
items = r.json().get("datos", {}).get("productos", [])
test("Carrito con producto", r.status_code == 200 and len(items) > 0, f"{len(items)} items")

# ============================================
# 7. CHECKOUT Y PEDIDOS
# ============================================
print("\n=== 7. CHECKOUT Y PEDIDOS ===")

CHECKOUT_DATA = {
    "metodo_pago": "pago_en_linea",
    "direccion_envio": "Carrera 107 A Bis 69 B 58, Bogotá",
    "items": [{"id": PROD_ID, "nombre": PRODUCTO.get("nombre", ""), "precio": PRODUCTO.get("precio", 0), "cantidad": 1}]
}
r = post("/api/checkout", CHECKOUT_DATA, CLIENTE_TOKEN)
d = r.json()
PEDIDO_ID = d.get("orden", {}).get("id", "")
test("Crear pedido (checkout)", r.status_code == 200 and bool(PEDIDO_ID), f"Pedido {PEDIDO_ID}")

r = get("/api/pedidos", CLIENTE_TOKEN)
test("Listar pedidos del cliente", r.status_code == 200, f"{r.json().get('total', 0)} pedidos")

r = get(f"/api/pedidos/{PEDIDO_ID}/historial", CLIENTE_TOKEN)
test("Historial del pedido", r.status_code == 200)

# Admin: listar todos los pedidos
r = get("/api/admin/pedidos", CEO_TOKEN)
test("Admin: listar todos los pedidos", r.status_code == 200, f"{r.json().get('total', 0)} pedidos")

# Cambiar estado del pedido
r = put(f"/api/pedidos/{PEDIDO_ID}/estado", {"estado": "Confirmado", "comentario": "Test"}, CEO_TOKEN)
test("Cambiar estado pedido", r.status_code == 200, r.json().get("estado_nuevo", ""))

# ============================================
# 8. DEVOLUCIONES
# ============================================
print("\n=== 8. DEVOLUCIONES ===")

r = post(f"/api/pedidos/{PEDIDO_ID}/devolucion", {"razon": "Producto no cumple expectativas"}, CLIENTE_TOKEN)
test("Solicitar devolución", r.status_code == 200, r.json().get("devolucion", {}).get("estado", ""))

r = get("/api/devoluciones", CEO_TOKEN)
test("Listar devoluciones (admin)", r.status_code == 200, f"{r.json().get('total', 0)} devoluciones")

# ============================================
# 9. SOCIAL SERVICE
# ============================================
print("\n=== 9. SOCIAL SERVICE ===")

r = get(f"/api/resenas/{PROD_ID}")
test("Obtener reseñas producto", r.status_code == 200, f"{r.json().get('total', 0)} reseñas")

r = post("/api/resenas", {"producto_id": PROD_ID, "calificacion": 5, "comentario": "Excelente producto test"}, CLIENTE_TOKEN)
test("Crear reseña", r.status_code in [200, 201])

r = get("/api/listas-deseos", CLIENTE_TOKEN)
test("Obtener lista de deseos", r.status_code == 200)

r = post("/api/listas-deseos", {"producto_id": PROD_ID}, CLIENTE_TOKEN)
test("Agregar a lista de deseos", r.status_code == 200)

# ============================================
# 10. MARKETING SERVICE
# ============================================
print("\n=== 10. MARKETING SERVICE ===")

r = get("/api/cupones")
test("Listar cupones", r.status_code == 200, f"{r.json().get('total', 0)} cupones")

r = post("/api/cupones/validar", {"codigo": "BIENVENIDA20", "monto_compra": 100000})
test("Validar cupón", r.status_code in [200, 404])

r = get("/api/campanas")
test("Listar campañas", r.status_code == 200, f"{r.json().get('total', 0)} campañas")

r = get("/api/analytics/resumen")
test("Analytics resumen", r.status_code == 200)

# ============================================
# 11. CRÉDITO SERVICE
# ============================================
print("\n=== 11. CRÉDITO SERVICE ===")

r = post("/api/credito/evaluar", {
    "usuario_id": 1,
    "fecha_registro": "2024-01-01T00:00:00",
    "total_compras_historico": 3000000,
    "numero_compras": 10
})
d = r.json()
test("Evaluar crédito cliente", r.status_code == 200, f"Califica: {d.get('califica')} — Límite: ${d.get('limite_aprobado', 0):,.0f}")

r = get(f"/api/credito/interno/usuario/1")
test("Obtener créditos usuario", r.status_code == 200, f"{r.json().get('total', 0)} créditos")

r = get("/api/bonos/usuario/1")
test("Obtener bonos usuario", r.status_code == 200)

# ============================================
# 12. LOGÍSTICA SERVICE
# ============================================
print("\n=== 12. LOGÍSTICA SERVICE ===")

r = get("/api/almacenes")
test("Listar almacenes", r.status_code == 200, f"{r.json().get('total', 0)} almacenes")

r = get(f"/api/inventario/{PROD_ID}")
test("Consultar inventario producto", r.status_code == 200, f"Disponible: {r.json().get('total_disponible', 0)}")

# ============================================
# 13. AI SERVICE
# ============================================
print("\n=== 13. AI SERVICE ===")

r = post("/api/chat", {"mensaje": "Hola, busco un vestido elegante", "historial": []})
d = r.json()
test("Chat IA (María)", r.status_code == 200 and bool(d.get("respuesta")), d.get("respuesta", "")[:50] + "...")

r = post("/api/recomendaciones/personalizada", {"usuario_id": "1", "productos_vistos": [], "limite": 3})
test("Recomendaciones IA", r.status_code == 200, f"{r.json().get('total', 0)} recomendaciones")

# ============================================
# 14. FACTURACIÓN SERVICE
# ============================================
print("\n=== 14. FACTURACIÓN SERVICE ===")

r = get(f"/api/facturas/pedido/{PEDIDO_ID}")
test("Factura del pedido", r.status_code in [200, 404], "generándose en background" if r.status_code == 404 else r.json().get("numero", ""))

r = get("/api/facturas/admin/todas", CEO_TOKEN)
test("Admin: listar facturas", r.status_code == 200, f"{r.json().get('total', 0)} facturas")

# ============================================
# 15. CONTABILIDAD SERVICE
# ============================================
print("\n=== 15. CONTABILIDAD SERVICE ===")

r = get("/api/contabilidad/dashboard")
d = r.json()
test("Dashboard contabilidad", r.status_code == 200, f"Ventas: ${d.get('resumen', {}).get('ventas_mes', 0):,.0f}")

r = get("/api/contabilidad/libro-diario", params={"limite": 5})
test("Libro diario", r.status_code == 200, f"{r.json().get('total', 0)} asientos")

r = get("/api/contabilidad/libro-mayor")
test("Libro mayor", r.status_code == 200, f"{r.json().get('total', 0)} saldos")

r = get("/api/contabilidad/balance-general")
d = r.json()
test("Balance general", r.status_code == 200, f"Cuadra: {d.get('ecuacion', {}).get('cuadra', False)}")

r = get("/api/contabilidad/estado-resultados")
d = r.json()
test("Estado resultados P&G", r.status_code == 200, f"Ingresos: ${d.get('ingresos', {}).get('total', 0):,.0f}")

r = get("/api/contabilidad/iva/2026/2")
test("IVA bimestral", r.status_code == 200, f"IVA: ${r.json().get('iva_a_pagar', 0):,.0f}")

r = get("/api/contabilidad/simple/2026/2")
test("Anticipo SIMPLE", r.status_code == 200, f"Anticipo: ${r.json().get('valor_anticipo', 0):,.0f}")

r = get("/api/contabilidad/puc", params={"nivel": 4})
test("PUC colombiano", r.status_code == 200, f"{r.json().get('total', 0)} cuentas nivel 4")

r = get("/api/contabilidad/exogena/2026")
test("Información exógena", r.status_code == 200)

# ============================================
# RESUMEN FINAL
# ============================================
print("\n" + "="*60)
print("📊 RESUMEN FINAL")
print("="*60)
ok = sum(1 for _, r, _ in RESULTADOS if r)
total = len(RESULTADOS)
fallidos = [(n, d) for n, r, d in RESULTADOS if not r]

print(f"\n  ✅ Pasaron: {ok}/{total}")
print(f"  ❌ Fallaron: {total - ok}/{total}")
print(f"  📈 Cobertura: {round(ok/total*100, 1)}%")

if fallidos:
    print(f"\n  Tests fallidos:")
    for n, d in fallidos:
        print(f"    ❌ {n}: {d}")

print()
