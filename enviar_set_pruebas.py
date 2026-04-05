"""
Set de Pruebas DIAN — Envío automático de 50 documentos
30 Facturas + 10 Notas Crédito + 10 Notas Débito

Requisitos:
  - Archivo .p12 en la ruta configurada (DIAN_P12_PATH)
  - Contraseña del .p12 (DIAN_P12_PASSWORD)

Uso:
  python3 enviar_set_pruebas.py
  python3 enviar_set_pruebas.py --solo-facturas
  python3 enviar_set_pruebas.py --solo-notas-credito
  python3 enviar_set_pruebas.py --solo-notas-debito
  python3 enviar_set_pruebas.py --desde 5  (retoma desde documento 5)
"""
import sys
import os
import time
import json
import argparse
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend/services/facturacion-service/src'))

from datetime import datetime
from generador_xml import generar_xml_factura, DIAN_CONFIG
from generador_nota_credito import generar_nota_credito
from generador_nota_debito import generar_nota_debito
from firmador_xml import firmar_xml
from cliente_dian import enviar_factura_dian

# Configuración
RESULTADOS_PATH = os.path.join(os.path.dirname(__file__), "resultados_set_pruebas.json")

CLIENTE_PRUEBA = {
    "nombre": "VERTEL CATILLO",
    "email": "stiloymodams@gmail.com",
    "nit_cc": "902051708",
    "direccion": "CRA 107 A BIS #69B-58, Bogotá D.C."
}

PRODUCTOS_PRUEBA = [
    {"id": "PROD-001", "nombre": "Vestido Elegante Negro EGOS", "precio_unitario": 89900, "cantidad": 1},
    {"id": "PROD-002", "nombre": "Camisa Blanca Clasica EGOS", "precio_unitario": 45900, "cantidad": 1},
    {"id": "PROD-003", "nombre": "Pantalon Jean Azul EGOS", "precio_unitario": 67900, "cantidad": 1},
    {"id": "PROD-004", "nombre": "Blazer Gris Ejecutivo EGOS", "precio_unitario": 129900, "cantidad": 1},
    {"id": "PROD-005", "nombre": "Zapatos Formales Negros EGOS", "precio_unitario": 89900, "cantidad": 1},
    {"id": "PROD-006", "nombre": "Vestido Floral Primavera EGOS", "precio_unitario": 79900, "cantidad": 1},
    {"id": "PROD-007", "nombre": "Camisa Casual Azul EGOS", "precio_unitario": 39900, "cantidad": 1},
    {"id": "PROD-008", "nombre": "Pantalon Chino Beige EGOS", "precio_unitario": 59900, "cantidad": 1},
    {"id": "PROD-009", "nombre": "Falda Midi Plisada EGOS", "precio_unitario": 69900, "cantidad": 1},
    {"id": "PROD-010", "nombre": "Chaqueta Cuero Sintetico EGOS", "precio_unitario": 159900, "cantidad": 1},
]

MOTIVOS_NC = [
    ("Devolucion de mercancia", "2"),
    ("Rebaja o descuento posterior", "3"),
    ("Ajuste de precio", "4"),
    ("Devolucion parcial de mercancia", "1"),
    ("Anulacion de factura", "2"),
    ("Descuento por pronto pago", "3"),
    ("Error en facturacion", "4"),
    ("Devolucion por garantia", "1"),
    ("Bonificacion al cliente", "3"),
    ("Ajuste por diferencia de precio", "4"),
]

MOTIVOS_ND = [
    ("Intereses por mora", "1"),
    ("Gastos por cobrar", "2"),
    ("Cambio de valor", "3"),
    ("Cobro envio express", "4"),
    ("Recargo por devolucion", "1"),
    ("Intereses de financiacion", "1"),
    ("Ajuste precio al alza", "3"),
    ("Cobro seguro de envio", "2"),
    ("Penalizacion por cancelacion", "4"),
    ("Cobro empaque especial", "2"),
]


def cargar_resultados():
    if os.path.exists(RESULTADOS_PATH):
        with open(RESULTADOS_PATH, "r") as f:
            return json.load(f)
    return {"facturas": [], "notas_credito": [], "notas_debito": []}


def guardar_resultados(resultados):
    with open(RESULTADOS_PATH, "w") as f:
        json.dump(resultados, f, indent=2, default=str)


def enviar_documento(xml_string, numero_completo, tipo):
    """Firma y envía un documento a la DIAN"""
    print(f"   🔏 Firmando {tipo} {numero_completo}...")
    try:
        xml_firmado = firmar_xml(xml_string)
    except Exception as e:
        return {"exito": False, "estado": "Error Firma", "mensaje": str(e)}

    print(f"   📤 Enviando a DIAN...")
    resultado = enviar_factura_dian(xml_firmado, numero_completo)
    return resultado


def enviar_facturas(resultados, desde=0):
    """Genera y envía 30 facturas"""
    print("\n" + "=" * 60)
    print("📄 ENVIANDO 30 FACTURAS")
    print("=" * 60)

    base_numero = 990000000
    facturas_enviadas = len(resultados["facturas"])

    for i in range(desde, 30):
        numero = base_numero + i
        producto = PRODUCTOS_PRUEBA[i % len(PRODUCTOS_PRUEBA)]
        producto_con_cantidad = {**producto, "cantidad": (i % 3) + 1}

        print(f"\n📄 Factura {i+1}/30 — {DIAN_CONFIG['prefijo']}{numero}")
        print(f"   Producto: {producto['nombre']} x{producto_con_cantidad['cantidad']}")

        try:
            xml, cufe, num_completo, subtotal, iva, total = generar_xml_factura(
                numero=numero, pedido_id=f"SET-FAC-{i+1:03d}",
                cliente=CLIENTE_PRUEBA, productos=[producto_con_cantidad]
            )
            print(f"   💰 Total: ${total:,.2f} COP | CUFE: {cufe[:30]}...")

            resultado = enviar_documento(xml, num_completo, "Factura")

            registro = {
                "numero": num_completo, "cufe": cufe, "total": total,
                "estado": resultado.get("estado"), "mensaje": resultado.get("mensaje", "")[:200],
                "fecha": datetime.now().isoformat()
            }
            resultados["facturas"].append(registro)
            guardar_resultados(resultados)

            estado_emoji = "✅" if resultado.get("exito") else "❌"
            print(f"   {estado_emoji} {resultado.get('estado')} — {resultado.get('mensaje', '')[:100]}")

        except Exception as e:
            print(f"   ❌ Error: {e}")
            resultados["facturas"].append({
                "numero": f"{DIAN_CONFIG['prefijo']}{numero}", "estado": "Error", "mensaje": str(e)[:200],
                "fecha": datetime.now().isoformat()
            })
            guardar_resultados(resultados)

        time.sleep(2)

    return resultados


def enviar_notas_credito(resultados, desde=0):
    """Genera y envía 10 notas crédito (referenciando facturas enviadas)"""
    print("\n" + "=" * 60)
    print("📋 ENVIANDO 10 NOTAS CRÉDITO")
    print("=" * 60)

    if not resultados["facturas"]:
        print("   ⚠️ No hay facturas enviadas para referenciar. Envía facturas primero.")
        return resultados

    base_numero = 990000030

    for i in range(desde, 10):
        numero = base_numero + i
        factura_ref = resultados["facturas"][i % len(resultados["facturas"])]
        producto = PRODUCTOS_PRUEBA[i % len(PRODUCTOS_PRUEBA)]
        motivo, codigo = MOTIVOS_NC[i]

        print(f"\n📋 Nota Crédito {i+1}/10 — {DIAN_CONFIG['prefijo']}{numero}")
        print(f"   Ref: {factura_ref['numero']} | Motivo: {motivo}")

        try:
            xml, cude, num_completo, subtotal, iva, total = generar_nota_credito(
                numero=numero,
                factura_referencia=factura_ref["numero"],
                cufe_factura=factura_ref.get("cufe", "0" * 96),
                fecha_factura=factura_ref.get("fecha", datetime.now().isoformat())[:10],
                cliente=CLIENTE_PRUEBA, productos=[producto],
                motivo=motivo, codigo_motivo=codigo
            )
            print(f"   💰 Total: ${total:,.2f} COP")

            resultado = enviar_documento(xml, num_completo, "Nota Crédito")

            resultados["notas_credito"].append({
                "numero": num_completo, "cude": cude, "total": total,
                "factura_ref": factura_ref["numero"], "motivo": motivo,
                "estado": resultado.get("estado"), "mensaje": resultado.get("mensaje", "")[:200],
                "fecha": datetime.now().isoformat()
            })
            guardar_resultados(resultados)

            estado_emoji = "✅" if resultado.get("exito") else "❌"
            print(f"   {estado_emoji} {resultado.get('estado')} — {resultado.get('mensaje', '')[:100]}")

        except Exception as e:
            print(f"   ❌ Error: {e}")
            resultados["notas_credito"].append({
                "numero": f"{DIAN_CONFIG['prefijo']}{numero}", "estado": "Error", "mensaje": str(e)[:200],
                "fecha": datetime.now().isoformat()
            })
            guardar_resultados(resultados)

        time.sleep(2)

    return resultados


def enviar_notas_debito(resultados, desde=0):
    """Genera y envía 10 notas débito (referenciando facturas enviadas)"""
    print("\n" + "=" * 60)
    print("📋 ENVIANDO 10 NOTAS DÉBITO")
    print("=" * 60)

    if not resultados["facturas"]:
        print("   ⚠️ No hay facturas enviadas para referenciar. Envía facturas primero.")
        return resultados

    base_numero = 990000040

    for i in range(desde, 10):
        numero = base_numero + i
        factura_ref = resultados["facturas"][i % len(resultados["facturas"])]
        motivo, codigo = MOTIVOS_ND[i]

        producto_debito = {
            "id": f"DEB-{i+1:03d}",
            "nombre": motivo,
            "precio_unitario": 10000 + (i * 5000),
            "cantidad": 1
        }

        print(f"\n📋 Nota Débito {i+1}/10 — {DIAN_CONFIG['prefijo']}{numero}")
        print(f"   Ref: {factura_ref['numero']} | Motivo: {motivo}")

        try:
            xml, cude, num_completo, subtotal, iva, total = generar_nota_debito(
                numero=numero,
                factura_referencia=factura_ref["numero"],
                cufe_factura=factura_ref.get("cufe", "0" * 96),
                fecha_factura=factura_ref.get("fecha", datetime.now().isoformat())[:10],
                cliente=CLIENTE_PRUEBA, productos=[producto_debito],
                motivo=motivo, codigo_motivo=codigo
            )
            print(f"   💰 Total: ${total:,.2f} COP")

            resultado = enviar_documento(xml, num_completo, "Nota Débito")

            resultados["notas_debito"].append({
                "numero": num_completo, "cude": cude, "total": total,
                "factura_ref": factura_ref["numero"], "motivo": motivo,
                "estado": resultado.get("estado"), "mensaje": resultado.get("mensaje", "")[:200],
                "fecha": datetime.now().isoformat()
            })
            guardar_resultados(resultados)

            estado_emoji = "✅" if resultado.get("exito") else "❌"
            print(f"   {estado_emoji} {resultado.get('estado')} — {resultado.get('mensaje', '')[:100]}")

        except Exception as e:
            print(f"   ❌ Error: {e}")
            resultados["notas_debito"].append({
                "numero": f"{DIAN_CONFIG['prefijo']}{numero}", "estado": "Error", "mensaje": str(e)[:200],
                "fecha": datetime.now().isoformat()
            })
            guardar_resultados(resultados)

        time.sleep(2)

    return resultados


def imprimir_resumen(resultados):
    print("\n" + "=" * 60)
    print("📊 RESUMEN SET DE PRUEBAS")
    print("=" * 60)

    for tipo in ["facturas", "notas_credito", "notas_debito"]:
        docs = resultados.get(tipo, [])
        aceptados = sum(1 for d in docs if d.get("estado") in ["Aceptada", "Enviada"])
        errores = sum(1 for d in docs if d.get("estado") in ["Error", "Error Firma", "Rechazada"])
        print(f"\n   {tipo.upper().replace('_', ' ')}:")
        print(f"   Enviados: {len(docs)} | Aceptados: {aceptados} | Errores: {errores}")

    total_env = sum(len(resultados.get(t, [])) for t in ["facturas", "notas_credito", "notas_debito"])
    total_ok = sum(
        sum(1 for d in resultados.get(t, []) if d.get("estado") in ["Aceptada", "Enviada"])
        for t in ["facturas", "notas_credito", "notas_debito"]
    )
    print(f"\n   TOTAL: {total_env}/50 enviados | {total_ok} aceptados")
    print(f"   Resultados guardados en: {RESULTADOS_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Set de Pruebas DIAN — 50 documentos")
    parser.add_argument("--solo-facturas", action="store_true")
    parser.add_argument("--solo-notas-credito", action="store_true")
    parser.add_argument("--solo-notas-debito", action="store_true")
    parser.add_argument("--desde", type=int, default=0, help="Retomar desde documento N")
    parser.add_argument("--reset", action="store_true", help="Borrar resultados anteriores")
    args = parser.parse_args()

    print("=" * 60)
    print("🧾 SET DE PRUEBAS DIAN — SOFTWARE PROPIO EGOS")
    print("=" * 60)
    print(f"   Software: {DIAN_CONFIG['software_id']}")
    print(f"   Prefijo: {DIAN_CONFIG['prefijo']}")
    print(f"   Rango: {DIAN_CONFIG['rango_desde']} - {DIAN_CONFIG['rango_hasta']}")
    print(f"   Documentos: 30 facturas + 10 NC + 10 ND = 50 total")

    if args.reset and os.path.exists(RESULTADOS_PATH):
        os.remove(RESULTADOS_PATH)
        print("   🗑️ Resultados anteriores borrados")

    resultados = cargar_resultados()

    enviar_todo = not (args.solo_facturas or args.solo_notas_credito or args.solo_notas_debito)

    if enviar_todo or args.solo_facturas:
        resultados = enviar_facturas(resultados, args.desde)

    if enviar_todo or args.solo_notas_credito:
        resultados = enviar_notas_credito(resultados, args.desde if args.solo_notas_credito else 0)

    if enviar_todo or args.solo_notas_debito:
        resultados = enviar_notas_debito(resultados, args.desde if args.solo_notas_debito else 0)

    imprimir_resumen(resultados)
