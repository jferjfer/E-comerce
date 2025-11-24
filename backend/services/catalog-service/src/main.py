from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import uvicorn
import os
from datetime import datetime

app = FastAPI(
    title="Servicio de Catálogo v2.0",
    description="API completa para gestión de productos, categorías y tendencias de moda",
    version="2.0.0"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base de datos simulada mejorada
PRODUCTOS_DB = [
    {
        "id": "1", "nombre": "Vestido Profesional IA", "precio": 89.99,
        "categoria": "Vestidos", "descripcion": "Vestido elegante perfecto para el trabajo. Confeccionado en algodón orgánico de alta calidad.",
        "imagen": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
        "tallas": ["XS", "S", "M", "L", "XL"], "colores": ["Negro", "Azul marino", "Gris"],
        "calificacion": 5, "en_stock": True, "es_eco": True, "compatibilidad": 98, "stock": 25
    },
    {
        "id": "2", "nombre": "Camisa Casual IA", "precio": 47.90,
        "categoria": "Camisas", "descripcion": "Camisa cómoda de lino sostenible, ideal para el día a día. Diseño versátil y fresco.",
        "imagen": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
        "tallas": ["S", "M", "L", "XL"], "colores": ["Blanco", "Beige", "Azul claro"],
        "calificacion": 4, "en_stock": True, "es_eco": True, "compatibilidad": 95, "stock": 18
    },
    {
        "id": "3", "nombre": "Pantalón Versátil", "precio": 79.90,
        "categoria": "Pantalones", "descripcion": "Pantalón de denim reciclado que combina con todo tu guardarropa. Corte moderno y cómodo.",
        "imagen": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop",
        "tallas": ["28", "30", "32", "34", "36"], "colores": ["Azul", "Negro", "Gris"],
        "calificacion": 5, "en_stock": True, "es_eco": True, "compatibilidad": 92, "stock": 12
    },
    {
        "id": "4", "nombre": "Blazer Inteligente IA", "precio": 129.90,
        "categoria": "Blazers", "descripcion": "Blazer premium de lana merino. Perfecto para completar tu look profesional con elegancia.",
        "imagen": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop",
        "tallas": ["S", "M", "L", "XL"], "colores": ["Negro", "Gris oscuro", "Azul marino"],
        "calificacion": 5, "en_stock": True, "compatibilidad": 96, "stock": 8
    },
    {
        "id": "5", "nombre": "Falda Midi Elegante", "precio": 65.90,
        "categoria": "Faldas", "descripcion": "Falda midi con corte A, perfecta para ocasiones formales e informales.",
        "imagen": "https://images.unsplash.com/photo-1583496661160-fb5886a13d27?w=400&h=500&fit=crop",
        "tallas": ["XS", "S", "M", "L"], "colores": ["Negro", "Camel", "Verde oliva"],
        "calificacion": 4, "en_stock": True, "es_eco": False, "compatibilidad": 89, "stock": 15
    }
]

CATEGORIAS_DB = [
    {"id": "1", "nombre": "Vestidos", "descripcion": "Vestidos elegantes y casuales", "productos_count": 1},
    {"id": "2", "nombre": "Camisas", "descripcion": "Camisas y blusas", "productos_count": 1},
    {"id": "3", "nombre": "Pantalones", "descripcion": "Pantalones y jeans", "productos_count": 1},
    {"id": "4", "nombre": "Blazers", "descripcion": "Blazers y chaquetas", "productos_count": 1},
    {"id": "5", "nombre": "Faldas", "descripcion": "Faldas de todos los estilos", "productos_count": 1}
]

# Endpoints de productos
@app.get("/api/productos")
async def listar_productos(
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    precio_min: Optional[float] = Query(None, description="Precio mínimo"),
    precio_max: Optional[float] = Query(None, description="Precio máximo"),
    buscar: Optional[str] = Query(None, description="Buscar en nombre y descripción"),
    ordenar: Optional[str] = Query("relevancia", description="Ordenar por: precio_asc, precio_desc, nombre, calificacion"),
    limite: int = Query(20, description="Límite de productos"),
    pagina: int = Query(1, description="Página")
):
    print(f"📦 Obteniendo productos - Categoría: {categoria}, Búsqueda: {buscar}")
    
    productos = PRODUCTOS_DB.copy()
    
    # Filtros
    if categoria:
        productos = [p for p in productos if p["categoria"].lower() == categoria.lower()]
    
    if precio_min is not None:
        productos = [p for p in productos if p["precio"] >= precio_min]
    
    if precio_max is not None:
        productos = [p for p in productos if p["precio"] <= precio_max]
    
    if buscar:
        productos = [p for p in productos if buscar.lower() in p["nombre"].lower() or buscar.lower() in p["descripcion"].lower()]
    
    # Ordenamiento
    if ordenar == "precio_asc":
        productos.sort(key=lambda x: x["precio"])
    elif ordenar == "precio_desc":
        productos.sort(key=lambda x: x["precio"], reverse=True)
    elif ordenar == "nombre":
        productos.sort(key=lambda x: x["nombre"])
    elif ordenar == "calificacion":
        productos.sort(key=lambda x: x["calificacion"], reverse=True)
    
    # Paginación
    inicio = (pagina - 1) * limite
    fin = inicio + limite
    productos_paginados = productos[inicio:fin]
    
    return {
        "productos": productos_paginados,
        "total": len(productos),
        "pagina": pagina,
        "limite": limite,
        "total_paginas": (len(productos) + limite - 1) // limite
    }

@app.get("/api/productos/destacados")
async def productos_destacados():
    print("⭐ Obteniendo productos destacados")
    destacados = [p for p in PRODUCTOS_DB if p["calificacion"] >= 5][:3]
    return {"productos": destacados, "total": len(destacados)}

@app.get("/api/productos/{producto_id}")
async def obtener_producto(producto_id: str):
    producto = next((p for p in PRODUCTOS_DB if p["id"] == producto_id), None)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"producto": producto}

@app.get("/api/categorias")
async def listar_categorias():
    print("📂 Obteniendo categorías")
    return {"categorias": CATEGORIAS_DB}

@app.get("/api/buscar")
async def buscar_productos(q: str = Query(..., description="Término de búsqueda")):
    print(f"🔍 Búsqueda: {q}")
    resultados = [p for p in PRODUCTOS_DB if q.lower() in p["nombre"].lower() or q.lower() in p["descripcion"].lower()]
    return {"productos": resultados, "total": len(resultados), "termino": q}

@app.get("/api/tendencias")
async def obtener_tendencias():
    print("📈 Obteniendo tendencias")
    return {
        "tendencias": [
            {"id": "1", "nombre": "Moda Sostenible", "descripcion": "Productos eco-friendly", "productos_count": 4},
            {"id": "2", "nombre": "Oficina Moderna", "descripcion": "Looks profesionales", "productos_count": 3},
            {"id": "3", "nombre": "Casual Chic", "descripcion": "Elegancia relajada", "productos_count": 2}
        ]
    }

@app.get("/salud")
async def verificar_salud():
    return {
        "estado": "activo",
        "servicio": "catalogo",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "productos_total": len(PRODUCTOS_DB),
        "categorias_total": len(CATEGORIAS_DB)
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3002))
    print(f"🚀 Catalog Service v2.0 iniciando en puerto {puerto}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=puerto,
        reload=os.getenv("ENTORNO") == "desarrollo"
    )