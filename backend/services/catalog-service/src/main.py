from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import uvicorn
import os
from datetime import datetime
from config.database import conectar_bd, desconectar_bd, get_database

# Datos estáticos como fallback
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
        "calificacion": 5, "en_stock": True, "compatibilidad": 96, "stock": 15
    }
]

CATEGORIAS_DB = [
    {"id": "1", "nombre": "Vestidos", "descripcion": "Vestidos elegantes y casuales"},
    {"id": "2", "nombre": "Camisas", "descripcion": "Camisas y blusas"},
    {"id": "3", "nombre": "Pantalones", "descripcion": "Pantalones y jeans"},
    {"id": "4", "nombre": "Blazers", "descripcion": "Blazers y chaquetas"},
    {"id": "5", "nombre": "Calzado", "descripcion": "Zapatos y calzado en general"}
]

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

# Eventos de inicio y cierre
@app.on_event("startup")
async def startup_event():
    await conectar_bd()
    await inicializar_datos()

@app.on_event("shutdown")
async def shutdown_event():
    await desconectar_bd()

async def inicializar_datos():
    """Inicializar datos si no existen"""
    db = get_database()
    
    # Verificar si ya hay productos
    productos_count = await db.productos.count_documents({})
    if productos_count == 0:
        # Insertar productos iniciales
        productos_iniciales = [
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
            }
        ]
        await db.productos.insert_many(productos_iniciales)
        print("✅ Productos iniciales insertados en MongoDB")



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
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")
    
    try:
        filtro = {}
        
        # Construir filtros MongoDB
        if categoria:
            filtro["categoria"] = {"$regex": categoria, "$options": "i"}
        
        if precio_min is not None or precio_max is not None:
            filtro["precio"] = {}
            if precio_min is not None:
                filtro["precio"]["$gte"] = precio_min
            if precio_max is not None:
                filtro["precio"]["$lte"] = precio_max
        
        if buscar:
            filtro["$or"] = [
                {"nombre": {"$regex": buscar, "$options": "i"}},
                {"descripcion": {"$regex": buscar, "$options": "i"}}
            ]
        
        # Ordenamiento
        sort_field = "_id"
        sort_direction = 1
        if ordenar == "precio_asc":
            sort_field, sort_direction = "precio", 1
        elif ordenar == "precio_desc":
            sort_field, sort_direction = "precio", -1
        elif ordenar == "nombre":
            sort_field, sort_direction = "nombre", 1
        elif ordenar == "calificacion":
            sort_field, sort_direction = "calificacion", -1
        
        # Consulta con paginación
        skip = (pagina - 1) * limite
        
        productos_cursor = db.productos.find(filtro).sort(sort_field, sort_direction).skip(skip).limit(limite)
        productos = await productos_cursor.to_list(length=limite)
        
        # Contar total
        total = await db.productos.count_documents(filtro)
        
        print(f"✅ Productos encontrados: {len(productos)} de {total} total")
        
        # Limpiar _id de MongoDB
        for producto in productos:
            if "_id" in producto:
                del producto["_id"]
        
        return {
            "productos": productos,
            "total": total,
            "pagina": pagina,
            "limite": limite,
            "total_paginas": (total + limite - 1) // limite
        }
    except Exception as e:
        print(f"❌ Error consultando MongoDB: {e}")
        raise HTTPException(status_code=500, detail=f"Error consultando productos: {str(e)}")

@app.get("/api/productos/destacados")
async def productos_destacados():
    print("⭐ Obteniendo productos destacados")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")
    
    try:
        productos_cursor = db.productos.find({"calificacion": {"$gte": 4}}).limit(6)
        productos = await productos_cursor.to_list(length=6)
        
        # Limpiar _id de MongoDB
        for producto in productos:
            if "_id" in producto:
                del producto["_id"]
                
        print(f"✅ Productos destacados encontrados: {len(productos)}")
        return {"productos": productos, "total": len(productos)}
    except Exception as e:
        print(f"❌ Error MongoDB: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo destacados: {str(e)}")

@app.get("/api/productos/{producto_id}")
async def obtener_producto(producto_id: str):
    db = get_database()
    producto = await db.productos.find_one({"id": producto_id})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Limpiar _id de MongoDB
    if "_id" in producto:
        del producto["_id"]
    
    return {"producto": producto}

@app.get("/api/categorias")
async def listar_categorias():
    print("📂 Obteniendo categorías")
    return {"categorias": CATEGORIAS_DB}

@app.get("/api/buscar")
async def buscar_productos(q: str = Query(..., description="Término de búsqueda")):
    print(f"🔍 Búsqueda: {q}")
    
    db = get_database()
    if db is not None:
        # Usar MongoDB si está disponible
        try:
            filtro = {
                "$or": [
                    {"nombre": {"$regex": q, "$options": "i"}},
                    {"descripcion": {"$regex": q, "$options": "i"}}
                ]
            }
            productos_cursor = db.productos.find(filtro)
            productos = await productos_cursor.to_list(length=50)
            
            # Limpiar _id de MongoDB
            for producto in productos:
                if "_id" in producto:
                    del producto["_id"]
                    
            return {"productos": productos, "total": len(productos), "termino": q}
        except Exception as e:
            print(f"❌ Error MongoDB: {e}")
    
    # Fallback a datos estáticos
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
    db = get_database()
    productos_total = len(PRODUCTOS_DB)
    
    if db is not None:
        try:
            productos_total = await db.productos.count_documents({})
        except:
            pass
    
    return {
        "estado": "activo",
        "servicio": "catalogo",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "productos_total": productos_total,
        "categorias_total": len(CATEGORIAS_DB),
        "mongodb_conectado": db is not None
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