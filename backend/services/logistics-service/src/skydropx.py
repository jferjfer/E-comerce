"""
Cliente Skydropx Colombia — EGOS
Sandbox: pro.skydropx.com.co
"""
import httpx
import os
import time
import asyncio
from typing import Optional

SKYDROPX_BASE = "https://pro.skydropx.com.co"
CLIENT_ID     = os.getenv("SKYDROPX_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("SKYDROPX_CLIENT_SECRET", "")

# Dimensiones por defecto de los paquetes EGOS
PAQUETE_PESO   = float(os.getenv("SKYDROPX_PESO_KG", "1.5"))
PAQUETE_LARGO  = int(os.getenv("SKYDROPX_LARGO_CM", "35"))
PAQUETE_ANCHO  = int(os.getenv("SKYDROPX_ANCHO_CM", "20"))
PAQUETE_ALTO   = int(os.getenv("SKYDROPX_ALTO_CM", "5"))

# Dirección de bodega origen (configurable)
BODEGA = {
    "name":        os.getenv("SKYDROPX_BODEGA_NOMBRE",    "EGOS Colombia"),
    "company":     os.getenv("SKYDROPX_BODEGA_EMPRESA",   "VERTEL & CATILLO S.A.S"),
    "street1":     os.getenv("SKYDROPX_BODEGA_DIRECCION", ""),
    "area_level1": os.getenv("SKYDROPX_BODEGA_DEPTO",     "Cundinamarca"),
    "area_level2": os.getenv("SKYDROPX_BODEGA_CIUDAD",    "Bogotá"),
    "postal_code": os.getenv("SKYDROPX_BODEGA_CP",        "110111"),
    "country_code":"CO",
    "phone":       os.getenv("SKYDROPX_BODEGA_TELEFONO",  "3017879852"),
    "email":       os.getenv("SKYDROPX_BODEGA_EMAIL",     "servicioalcliente@egoscolombia.com"),
    "reference":   os.getenv("SKYDROPX_BODEGA_REFERENCIA",""),
}

# Cache del token
_token_cache = {"access_token": None, "expires_at": 0}


async def obtener_token() -> str:
    """Obtiene o renueva el Bearer token de Skydropx."""
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
        print(f"✅ Skydropx token obtenido, expira en {data.get('expires_in', 7200)}s")
        return _token_cache["access_token"]


async def _headers() -> dict:
    token = await obtener_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


async def cotizar(direccion_destino: dict, valor_declarado: float = 50000) -> Optional[dict]:
    """
    Cotiza el envío y retorna el rate más económico disponible.
    direccion_destino: {street1, area_level1, area_level2, postal_code, country_code, name, phone, email}
    """
    headers = await _headers()

    payload = {
        "quotation": {
            "address_from": {
                "country_code": BODEGA["country_code"],
                "postal_code":  BODEGA["postal_code"],
                "area_level1":  BODEGA["area_level1"],
                "area_level2":  BODEGA["area_level2"],
            },
            "address_to": {
                "country_code": direccion_destino.get("country_code", "CO"),
                "postal_code":  direccion_destino.get("postal_code", ""),
                "area_level1":  direccion_destino.get("area_level1", ""),
                "area_level2":  direccion_destino.get("area_level2", ""),
            },
            "parcels": [{
                "weight":          PAQUETE_PESO,
                "length":          PAQUETE_LARGO,
                "width":           PAQUETE_ANCHO,
                "height":          PAQUETE_ALTO,
                "declared_amount": valor_declarado,
                "package_content": "Prendas de vestir"
            }]
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(f"{SKYDROPX_BASE}/api/v1/quotations", headers=headers, json=payload)
        if res.status_code not in (200, 201):
            print(f"❌ Error cotizando Skydropx: {res.status_code} {res.text[:200]}")
            return None

        cotizacion = res.json()
        cotizacion_id = cotizacion.get("id")

        # Esperar a que la cotización esté completa (máx 10s)
        for _ in range(10):
            if cotizacion.get("is_completed"):
                break
            await asyncio.sleep(1)
            res2 = await client.get(f"{SKYDROPX_BASE}/api/v1/quotations/{cotizacion_id}", headers=headers)
            if res2.status_code == 200:
                cotizacion = res2.json()

        # Elegir el rate más económico con status aprobado
        rates = cotizacion.get("rates", [])
        rates_validos = [
            r for r in rates
            if r.get("success") and r.get("status") in ("approved", "price_found_external", "price_found_internal", "coverage_checked")
        ]

        if not rates_validos:
            print(f"⚠️ No hay rates disponibles para la cotización {cotizacion_id}")
            return None

        rates_validos.sort(key=lambda r: float(r.get("total") or r.get("amount") or 9999))
        mejor_rate = rates_validos[0]

        print(f"✅ Cotización {cotizacion_id} — Mejor rate: {mejor_rate.get('provider_display_name')} ${mejor_rate.get('total')} COP")
        return {"cotizacion_id": cotizacion_id, "rate": mejor_rate}


async def crear_guia(pedido_id: str, destinatario: dict, valor_declarado: float = 50000) -> Optional[dict]:
    """
    Crea la guía de envío en Skydropx.
    destinatario: {name, street1, area_level1, area_level2, postal_code, country_code, phone, email, reference}
    Retorna: {shipment_id, tracking_number, carrier, dias_entrega}
    """
    # 1. Cotizar
    resultado_cotizacion = await cotizar(destinatario, valor_declarado)
    if not resultado_cotizacion:
        return None

    rate = resultado_cotizacion["rate"]
    headers = await _headers()

    # 2. Crear envío
    payload = {
        "shipment": {
            "rate_id": rate["id"],
            "address_from": {
                "name":        BODEGA["name"],
                "company":     BODEGA["company"],
                "street1":     BODEGA["street1"],
                "phone":       BODEGA["phone"],
                "email":       BODEGA["email"],
                "reference":   BODEGA["reference"],
            },
            "address_to": {
                "name":        destinatario.get("name", "Cliente"),
                "street1":     destinatario.get("street1", ""),
                "phone":       destinatario.get("phone", ""),
                "email":       destinatario.get("email", ""),
                "reference":   destinatario.get("reference", ""),
                "company":     "",
            },
            "packages": [{
                "package_number":  "1",
                "package_content": "Prendas de vestir",
            }]
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(f"{SKYDROPX_BASE}/api/v1/shipments/", headers=headers, json=payload)

        if res.status_code not in (200, 201, 202):
            print(f"❌ Error creando guía Skydropx: {res.status_code} {res.text[:300]}")
            return None

        data = res.json().get("data", {})
        attrs = data.get("attributes", {})
        tracking = attrs.get("master_tracking_number")
        shipment_id = data.get("id")

        print(f"✅ Guía creada — Pedido {pedido_id} | Tracking: {tracking} | Carrier: {attrs.get('carrier_name')}")

        return {
            "shipment_id":      shipment_id,
            "tracking_number":  tracking,
            "carrier":          attrs.get("carrier_name", ""),
            "dias_entrega":     rate.get("days", 3),
            "costo_envio":      rate.get("total", "0"),
            "rate_id":          rate["id"],
        }


def interpretar_estado_webhook(status: str) -> Optional[str]:
    """
    Mapea el status de Skydropx al estado de pedido de EGOS.
    Retorna None si no hay cambio de estado.
    """
    mapa = {
        "delivered":          "Entregado",
        "in_transit":         "En Camino",
        "out_for_delivery":   "En Camino",
        "picked_up":          "En Camino",
        "exception":          None,   # novedad — no cambia estado
        "failed_attempt":     None,
        "returned":           "Devuelto",
    }
    return mapa.get(status.lower())


def esta_configurado() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET)
