"""
Cliente Skydropx Colombia — EGOS
Sandbox: sb-pro.skydropx.com.co
Producción: pro.skydropx.com.co
"""
import httpx
import os
import time
import asyncio
from typing import Optional

SKYDROPX_BASE = os.getenv("SKYDROPX_BASE_URL", "https://sb-pro.skydropx.com.co")
CLIENT_ID     = os.getenv("SKYDROPX_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("SKYDROPX_CLIENT_SECRET", "")

# Dimensiones por defecto de los paquetes EGOS
PAQUETE_PESO   = float(os.getenv("SKYDROPX_PESO_KG", "1.5"))
PAQUETE_LARGO  = int(os.getenv("SKYDROPX_LARGO_CM", "35"))
PAQUETE_ANCHO  = int(os.getenv("SKYDROPX_ANCHO_CM", "20"))
PAQUETE_ALTO   = int(os.getenv("SKYDROPX_ALTO_CM", "5"))

# Dirección de bodega origen
BODEGA = {
    "person_name": os.getenv("SKYDROPX_BODEGA_NOMBRE",    "EGOS Colombia"),
    "company":     os.getenv("SKYDROPX_BODEGA_EMPRESA",   "VERTEL & CATILLO S.A.S"),
    "address":     os.getenv("SKYDROPX_BODEGA_DIRECCION", "Carrera 107 A Bis 69 B 58"),
    "city":        os.getenv("SKYDROPX_BODEGA_CIUDAD",    "Bogotá"),
    "state":       os.getenv("SKYDROPX_BODEGA_DEPTO",     "Cundinamarca"),
    "country":     "CO",
    "phone":       os.getenv("SKYDROPX_BODEGA_TELEFONO",  "3017879852"),
    "email":       os.getenv("SKYDROPX_BODEGA_EMAIL",     "servicioalcliente@egoscolombia.com"),
    "reference":   os.getenv("SKYDROPX_BODEGA_REFERENCIA", ""),
}

# Cache del token
_token_cache = {"access_token": None, "expires_at": 0}


async def obtener_token() -> str:
    ahora = time.time()
    if _token_cache["access_token"] and ahora < _token_cache["expires_at"] - 60:
        return _token_cache["access_token"]

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            f"{SKYDROPX_BASE}/api/v1/oauth/token",
            json={
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "grant_type":    "client_credentials"
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


async def crear_guia(pedido_id: str, destinatario: dict, valor_declarado: float = 50000) -> Optional[dict]:
    """
    Crea una orden + guía en Skydropx usando el flujo de órdenes Colombia.
    destinatario: {name, address, city, state, country, phone, email, reference}
    """
    headers = await _headers()

    # Valor declarado entre 10000 y 5000000 COP
    valor = max(10000, min(float(valor_declarado), 5000000))

    payload = {
        "order": {
            "reference":      pedido_id,
            "platform":       "EGOS",
            "total_price":    str(int(valor)),
            "package_type":   "box",
            "parcels": [{
                "weight":          PAQUETE_PESO,
                "length":          PAQUETE_LARGO,
                "width":           PAQUETE_ANCHO,
                "height":          PAQUETE_ALTO,
                "quantity":        1,
                "mass_unit":       "kg",
                "dimension_unit":  "cm",
                "package_content": "Prendas de vestir",
                "declared_amount": valor,
            }],
            "shipper_address": {
                "person_name": BODEGA["person_name"],
                "company":     BODEGA["company"],
                "address":     BODEGA["address"],
                "city":        BODEGA["city"],
                "state":       BODEGA["state"],
                "country":     BODEGA["country"],
                "phone":       BODEGA["phone"],
                "email":       BODEGA["email"],
                "reference":   BODEGA["reference"],
            },
            "recipient_address": {
                "person_name": destinatario.get("name", "Cliente"),
                "address":     destinatario.get("address", destinatario.get("street1", "")),
                "city":        destinatario.get("city", destinatario.get("area_level2", "")),
                "state":       destinatario.get("state", destinatario.get("area_level1", "")),
                "country":     "CO",
                "phone":       destinatario.get("phone", ""),
                "email":       destinatario.get("email", ""),
                "reference":   destinatario.get("reference", ""),
            }
        }
    }

    async with httpx.AsyncClient(timeout=60) as client:
        # 1. Crear orden
        res = await client.post(f"{SKYDROPX_BASE}/api/v1/orders/", headers=headers, json=payload)

        if res.status_code not in (200, 201):
            print(f"❌ Error creando orden Skydropx: {res.status_code} {res.text[:300]}")
            return None

        orden = res.json().get("data", {})
        orden_id = orden.get("id")
        print(f"✅ Orden Skydropx creada: {orden_id}")

        # 2. Cotizar para obtener rates
        cotizacion_payload = {
            "quotation": {
                "order_id": orden_id,
                "address_from": {
                    "country_code": "CO",
                    "area_level1":  BODEGA["state"],
                    "area_level2":  BODEGA["city"],
                },
                "address_to": {
                    "country_code": "CO",
                    "area_level1":  destinatario.get("state", destinatario.get("area_level1", "")),
                    "area_level2":  destinatario.get("city", destinatario.get("area_level2", "")),
                },
                "parcels": [{
                    "weight":          PAQUETE_PESO,
                    "length":          PAQUETE_LARGO,
                    "width":           PAQUETE_ANCHO,
                    "height":          PAQUETE_ALTO,
                    "declared_amount": valor,
                }]
            }
        }

        res_cot = await client.post(f"{SKYDROPX_BASE}/api/v1/quotations", headers=headers, json=cotizacion_payload)

        if res_cot.status_code not in (200, 201):
            print(f"❌ Error cotizando: {res_cot.status_code} {res_cot.text[:300]}")
            return None

        cotizacion = res_cot.json()
        cotizacion_id = cotizacion.get("id")

        # Esperar cotización completa
        for _ in range(10):
            if cotizacion.get("is_completed"):
                break
            await asyncio.sleep(1)
            r = await client.get(f"{SKYDROPX_BASE}/api/v1/quotations/{cotizacion_id}", headers=headers)
            if r.status_code == 200:
                cotizacion = r.json()

        # Elegir rate más económico
        rates = cotizacion.get("rates", [])
        rates_validos = [
            r for r in rates
            if r.get("success") and r.get("status") in (
                "approved", "price_found_external", "price_found_internal", "coverage_checked"
            )
        ]

        if not rates_validos:
            print(f"⚠️ No hay rates disponibles. Rates recibidos: {[r.get('status') for r in rates]}")
            return None

        rates_validos.sort(key=lambda r: float(r.get("total") or r.get("amount") or 9999))
        mejor_rate = rates_validos[0]
        print(f"✅ Rate elegido: {mejor_rate.get('provider_display_name')} ${mejor_rate.get('total')} COP — {mejor_rate.get('days')} días")

        # 3. Crear envío con el rate elegido
        shipment_payload = {
            "shipment": {
                "rate_id": mejor_rate["id"],
                "address_from": {
                    "name":      BODEGA["person_name"],
                    "company":   BODEGA["company"],
                    "street1":   BODEGA["address"],
                    "phone":     BODEGA["phone"],
                    "email":     BODEGA["email"],
                    "reference": BODEGA["reference"],
                },
                "address_to": {
                    "name":      destinatario.get("name", "Cliente"),
                    "street1":   destinatario.get("address", destinatario.get("street1", "")),
                    "phone":     destinatario.get("phone", ""),
                    "email":     destinatario.get("email", ""),
                    "reference": destinatario.get("reference", ""),
                    "company":   "",
                },
                "packages": [{
                    "package_number":  "1",
                    "package_content": "Prendas de vestir",
                }]
            }
        }

        res_ship = await client.post(f"{SKYDROPX_BASE}/api/v1/shipments/", headers=headers, json=shipment_payload)

        if res_ship.status_code not in (200, 201, 202):
            print(f"❌ Error creando envío: {res_ship.status_code} {res_ship.text[:300]}")
            return None

        data = res_ship.json().get("data", {})
        attrs = data.get("attributes", {})
        tracking = attrs.get("master_tracking_number")
        shipment_id = data.get("id")

        print(f"✅ Guía creada — Pedido {pedido_id} | Tracking: {tracking} | Carrier: {attrs.get('carrier_name')}")

        return {
            "shipment_id":     shipment_id,
            "orden_id":        orden_id,
            "tracking_number": tracking,
            "carrier":         attrs.get("carrier_name", ""),
            "dias_entrega":    mejor_rate.get("days", 3),
            "costo_envio":     mejor_rate.get("total", "0"),
        }


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


def esta_configurado() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET)
