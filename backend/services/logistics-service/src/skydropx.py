"""
Cliente Skydropx Colombia — EGOS
Flujo correcto:
  1. POST /api/v1/quotations  → obtener cotización
  2. GET  /api/v1/quotations/{id} → esperar is_completed + elegir rate
  3. POST /api/v1/shipments/  → crear envío con rate_id

Sandbox: sb-pro.skydropx.com.co
"""
import httpx
import asyncio
import os
import time
from typing import Optional

SKYDROPX_BASE = os.getenv("SKYDROPX_BASE_URL", "https://sb-pro.skydropx.com.co")
CLIENT_ID     = os.getenv("SKYDROPX_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("SKYDROPX_CLIENT_SECRET", "")

# Dimensiones por defecto del paquete EGOS (prendas de vestir)
PAQUETE_PESO  = float(os.getenv("SKYDROPX_PESO_KG",  "1.5"))
PAQUETE_LARGO = int(os.getenv("SKYDROPX_LARGO_CM",   "35"))
PAQUETE_ANCHO = int(os.getenv("SKYDROPX_ANCHO_CM",   "20"))
PAQUETE_ALTO  = int(os.getenv("SKYDROPX_ALTO_CM",    "5"))

# Bodega origen
BODEGA = {
    "name":       os.getenv("SKYDROPX_BODEGA_NOMBRE",    "EGOS Colombia"),
    "company":    os.getenv("SKYDROPX_BODEGA_EMPRESA",   "VERTEL & CATILLO S.A.S"),
    "street1":    os.getenv("SKYDROPX_BODEGA_DIRECCION", "Carrera 107 A Bis 69 B 58"),
    "area_level1": os.getenv("SKYDROPX_BODEGA_DEPTO",    "Cundinamarca"),
    "area_level2": os.getenv("SKYDROPX_BODEGA_CIUDAD",   "Bogotá"),
    "postal_code": os.getenv("SKYDROPX_BODEGA_CP",       "11001"),
    "country_code": "CO",
    "phone":      os.getenv("SKYDROPX_BODEGA_TELEFONO",  "3017879852"),
    "email":      os.getenv("SKYDROPX_BODEGA_EMAIL",     "servicioalcliente@egoscolombia.com"),
    "reference":  os.getenv("SKYDROPX_BODEGA_REFERENCIA", ""),
}

# Mapa ciudad → código postal 5 dígitos (formato Skydropx Colombia)
CODIGOS_POSTALES = {
    "bogotá": "11001", "bogota": "11001",
    "medellín": "05001", "medellin": "05001",
    "cali": "76001",
    "barranquilla": "08001",
    "cartagena": "13001",
    "bucaramanga": "68001",
    "pereira": "66001",
    "manizales": "17001",
    "cúcuta": "54001", "cucuta": "54001",
    "ibagué": "73001", "ibague": "73001",
    "santa marta": "47001",
    "villavicencio": "50001",
    "pasto": "52001",
    "montería": "23001", "monteria": "23001",
    "neiva": "41001",
    "armenia": "63001",
    "popayán": "19001", "popayan": "19001",
    "valledupar": "20001",
    "sincelejo": "70001",
    "tunja": "15001",
    "florencia": "18001",
    "quibdó": "27001", "quibdo": "27001",
    "riohacha": "44001",
    "san andrés": "88001", "san andres": "88001",
    "yopal": "85001",
    "mocoa": "86001",
    "mitú": "97001", "mitu": "97001",
    "puerto inírida": "94001", "puerto inirida": "94001",
    "leticia": "91001",
    "puerto carreño": "99001", "puerto carreno": "99001",
}


def _obtener_cp(ciudad: str) -> str:
    """Retorna el código postal de 5 dígitos para una ciudad colombiana."""
    return CODIGOS_POSTALES.get(ciudad.lower().strip(), "11001")

# Cache del token OAuth
_token_cache = {"access_token": None, "expires_at": 0}


# ============================================================
# AUTH
# ============================================================

async def obtener_token() -> str:
    ahora = time.time()
    if _token_cache["access_token"] and ahora < _token_cache["expires_at"] - 60:
        return _token_cache["access_token"]

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{SKYDROPX_BASE}/api/v1/oauth/token",
            json={
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "grant_type":    "client_credentials",
            }
        )
        res.raise_for_status()
        data = res.json()
        _token_cache["access_token"] = data["access_token"]
        _token_cache["expires_at"]   = ahora + data.get("expires_in", 7200)
        print(f"✅ Skydropx token obtenido")
        return _token_cache["access_token"]


async def _headers() -> dict:
    token = await obtener_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ============================================================
# PASO 1 — Crear cotización
# ============================================================

async def _crear_cotizacion(client: httpx.AsyncClient, destinatario: dict, valor: float) -> Optional[dict]:
    """
    Crea una cotización y retorna el dict completo de la respuesta.
    """
    headers = await _headers()

    payload = {
        "quotation": {
            "address_from": {
                "country_code": "CO",
                "area_level1":  BODEGA["area_level1"],
                "area_level2":  BODEGA["area_level2"],
                "postal_code":  BODEGA["postal_code"],
            },
            "address_to": {
                "country_code": "CO",
                "area_level1":  destinatario.get("area_level1", destinatario.get("state", "Cundinamarca")),
                "area_level2":  destinatario.get("area_level2", destinatario.get("city", "Bogotá")),
                "postal_code":  destinatario.get("postal_code") or _obtener_cp(
                    destinatario.get("area_level2", destinatario.get("city", "Bogotá"))
                ),
            },
            "parcels": [{
                "weight":          PAQUETE_PESO,
                "length":          PAQUETE_LARGO,
                "width":           PAQUETE_ANCHO,
                "height":          PAQUETE_ALTO,
                "declared_amount": max(10000, min(float(valor), 5000000)),
            }]
        }
    }

    res = await client.post(
        f"{SKYDROPX_BASE}/api/v1/quotations",
        headers=headers,
        json=payload
    )

    if res.status_code not in (200, 201):
        print(f"❌ Error creando cotización: {res.status_code} {res.text[:300]}")
        return None

    data = res.json()
    print(f"✅ Cotización creada: {data.get('id')} | is_completed: {data.get('is_completed')}")
    return data


# ============================================================
# PASO 2 — Esperar cotización completa y elegir rate
# ============================================================

async def _obtener_mejor_rate(client: httpx.AsyncClient, cotizacion: dict) -> Optional[dict]:
    """
    Si la cotización ya viene completa del POST la usa directamente.
    Si no, hace polling hasta is_completed.
    """
    headers = await _headers()
    cotizacion_id = cotizacion.get("id")

    def _elegir(data: dict) -> Optional[dict]:
        rates = data.get("rates", [])
        validos = [
            r for r in rates
            if r.get("success") and r.get("status") in (
                "approved", "price_found_external", "price_found_internal", "coverage_checked"
            )
        ]
        if not validos:
            print(f"⚠️ Sin rates válidos. Statuses: {[r.get('status') for r in rates]}")
            return None
        validos.sort(key=lambda r: float(r.get("total") or r.get("amount") or 9999))
        mejor = validos[0]
        print(f"✅ Rate elegido: {mejor.get('provider_display_name')} ${mejor.get('total')} COP — {mejor.get('days')} días")
        return mejor

    # Si ya vino completa del POST inicial, usarla directamente
    if cotizacion.get("is_completed"):
        rate = _elegir(cotizacion)
        if rate:
            return rate
        # Sin rates válidos en el POST, intentar GET una vez
        await asyncio.sleep(3)

    # Polling
    for intento in range(15):
        await asyncio.sleep(3)
        res = await client.get(
            f"{SKYDROPX_BASE}/api/v1/quotations/{cotizacion_id}",
            headers=headers
        )
        if res.status_code != 200:
            print(f"❌ Error consultando cotización: {res.status_code}")
            return None
        data = res.json()
        print(f"⏳ Cotización pendiente (intento {intento + 1}/15)...")
        if data.get("is_completed"):
            return _elegir(data)

    print("⚠️ Cotización no completó en tiempo esperado")
    return None


# ============================================================
# PASO 3 — Crear envío con rate_id
# ============================================================

async def _crear_shipment(client: httpx.AsyncClient, rate_id: str, destinatario: dict, pedido_id: str) -> Optional[dict]:
    """
    Crea el envío usando el rate_id seleccionado.
    Retorna dict con shipment_id, tracking_number, carrier, dias_entrega, costo_envio, label_url
    """
    headers = await _headers()

    payload = {
        "shipment": {
            "rate_id": rate_id,
            "address_from": {
                "street1":   BODEGA["street1"],
                "name":      BODEGA["name"],
                "company":   BODEGA["company"],
                "phone":     BODEGA["phone"],
                "email":     BODEGA["email"],
                "reference": BODEGA["reference"],
            },
            "address_to": {
                "street1":   destinatario.get("street1", destinatario.get("address", "")),
                "name":      destinatario.get("name", "Cliente"),
                "company":   "",
                "phone":     destinatario.get("phone", ""),
                "email":     destinatario.get("email", ""),
                "reference": destinatario.get("reference", ""),
            },
            "packages": [{
                "package_number":  "1",
                "package_content": "Prendas de vestir",
                "package_type":    "4G",
            }]
        }
    }

    res = await client.post(
        f"{SKYDROPX_BASE}/api/v1/shipments/",
        headers=headers,
        json=payload
    )

    if res.status_code not in (200, 201, 202):
        print(f"❌ Error creando shipment: {res.status_code} {res.text[:300]}")
        return None

    data = res.json().get("data", {})
    attrs = data.get("attributes", {})

    # Extraer tracking del included (packages)
    tracking = attrs.get("master_tracking_number")
    label_url = None

    included = res.json().get("included", [])
    for item in included:
        if item.get("type") == "package":
            pkg_attrs = item.get("attributes", {})
            if not tracking:
                tracking = pkg_attrs.get("tracking_number")
            label_url = pkg_attrs.get("label_url")
            break

    shipment_id = data.get("id")
    carrier     = attrs.get("carrier_name", "")

    print(f"✅ Shipment creado — Pedido {pedido_id} | ID: {shipment_id} | Tracking: {tracking} | Carrier: {carrier}")

    return {
        "shipment_id":     shipment_id,
        "tracking_number": tracking,
        "carrier":         carrier,
        "dias_entrega":    3,
        "costo_envio":     attrs.get("total", "0"),
        "label_url":       label_url,
    }


# ============================================================
# FUNCIÓN PRINCIPAL
# ============================================================

async def crear_guia(pedido_id: str, destinatario: dict, valor_declarado: float = 50000) -> Optional[dict]:
    """
    Flujo completo: cotizar → elegir rate → crear guía.

    destinatario debe tener:
      - name, street1 (o address), phone, email
      - area_level1 (departamento), area_level2 (ciudad)
      - postal_code, country_code (default CO)
      - reference (opcional)
    """
    valor = max(10000, min(float(valor_declarado), 5000000))

    async with httpx.AsyncClient(timeout=60) as client:
        # Paso 1: Cotizar — retorna dict completo
        cotizacion = await _crear_cotizacion(client, destinatario, valor)
        if not cotizacion:
            return None

        # Paso 2: Elegir rate — recibe dict completo
        rate = await _obtener_mejor_rate(client, cotizacion)
        if not rate:
            return None

        # Paso 3: Crear shipment
        resultado = await _crear_shipment(client, rate["id"], destinatario, pedido_id)
        if not resultado:
            return None

        resultado["dias_entrega"] = rate.get("days", 3)
        resultado["costo_envio"]  = rate.get("total", "0")
        return resultado


# ============================================================
# WEBHOOK — Interpretar estado
# ============================================================

def interpretar_estado_webhook(status: str) -> Optional[str]:
    mapa = {
        "created":          None,
        "picked_up":        "En Camino",
        "in_transit":       "En Camino",
        "out_for_delivery": "En Camino",
        "delivered":        "Entregado",
        "exception":        None,
        "failed_attempt":   None,
        "returned":         "Devuelto",
        "cancelled":        None,
    }
    return mapa.get(status.lower())


# ============================================================
# UTILIDADES
# ============================================================

def esta_configurado() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET)
