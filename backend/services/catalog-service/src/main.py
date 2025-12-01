from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import uvicorn
import os
import time
from datetime import datetime
from config.database import conectar_bd, desconectar_bd, get_database

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

@app.on_event("shutdown")
async def shutdown_event():
    await desconectar_bd()

# Endpoints de productos
@app.get("/api/productos")
async def listar_productos(
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    precio_min: Optional[float] = Query(None, description="Precio mínimo"),
    precio_max: Optional[float] = Query(None, description="Precio máximo"),
    buscar: Optional[str] = Query(None, description="Buscar en nombre y descripción"),
    ordenar: Optional[str] = Query("relevancia", description="Ordenar por: precio_asc, precio_desc, nombre, calificacion"),
    limite: int = Query(50, description="Límite de productos"),
    pagina: int = Query(1, description="Página")
):
    print(f"📦 Obteniendo productos - Categoría: {categoria}, Búsqueda: {buscar}")
    
    db = get_database()
    if db is None:
        print("❌ MongoDB no disponible")
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

@app.post("/api/productos")
async def crear_producto(producto: dict):
    print(f"📦 Creando nuevo producto: {producto.get('nombre')}")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")
    
    try:
        # Generar ID único
        producto['id'] = str(int(time.time() * 1000))
        
        # Insertar en MongoDB
        resultado = await db.productos.insert_one(producto)
        
        if resultado.inserted_id:
            print(f"✅ Producto creado con ID: {producto['id']}")
            return {
                "exito": True,
                "mensaje": "Producto creado exitosamente",
                "producto": {
                    "id": producto['id'],
                    "nombre": producto['nombre']
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Error al insertar producto")
            
    except Exception as e:
        print(f"❌ Error creando producto: {e}")
        raise HTTPException(status_code=500, detail=f"Error creando producto: {str(e)}")

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
    categorias = [
        {"id": "1", "nombre": "Vestidos", "descripcion": "Vestidos elegantes y casuales"},
        {"id": "2", "nombre": "Camisas", "descripcion": "Camisas y blusas"},
        {"id": "3", "nombre": "Pantalones", "descripcion": "Pantalones y jeans"},
        {"id": "4", "nombre": "Blazers", "descripcion": "Blazers y chaquetas"},
        {"id": "5", "nombre": "Calzado", "descripcion": "Zapatos y calzado en general"}
    ]
    return {"categorias": categorias}

@app.get("/api/buscar")
async def buscar_productos(q: str = Query(..., description="Término de búsqueda")):
    print(f"🔍 Búsqueda: {q}")
    
    db = get_database()
    if db is not None:
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
            raise HTTPException(status_code=500, detail=f"Error en búsqueda: {str(e)}")

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
    productos_total = 0
    
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
        "categorias_total": 5,
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