from fastapi import FastAPI, HTTPException, Query, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional, List
import uvicorn
import os
import time
from datetime import datetime
from config.base_datos import conectar_bd, cerrar_bd, obtener_bd
from config.cloudinary_config import cloudinary
from servicios.servicio_imagenes import subir_imagen_producto, subir_multiples_imagenes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await conectar_bd()
    yield
    # Shutdown
    await cerrar_bd()

app = FastAPI(
    title="Servicio de Catálogo v2.0",
    description="API completa para gestión de productos, categorías y tendencias de moda",
    version="2.0.0",
    lifespan=lifespan
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    db = obtener_bd()
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
        
        # Limpiar _id de MongoDB y asegurar ID único
        for i, producto in enumerate(productos):
            if "_id" in producto:
                del producto["_id"]
            # Asegurar que cada producto tenga un ID único
            if not producto.get("id"):
                producto["id"] = f"prod_{i+1}_{int(time.time())}"
        
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
    
    db = obtener_bd()
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
    
    db = obtener_bd()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")
    
    try:
        productos_cursor = db.productos.find({"calificacion": {"$gte": 4}}).limit(6)
        productos = await productos_cursor.to_list(length=6)
        
        # Limpiar _id de MongoDB y asegurar ID único
        for i, producto in enumerate(productos):
            if "_id" in producto:
                del producto["_id"]
            # Asegurar que cada producto tenga un ID único
            if not producto.get("id"):
                producto["id"] = f"prod_{i+1}_{int(time.time())}"
                
        print(f"✅ Productos destacados encontrados: {len(productos)}")
        return {"productos": productos, "total": len(productos)}
    except Exception as e:
        print(f"❌ Error MongoDB: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo destacados: {str(e)}")

@app.get("/api/productos/{producto_id}")
async def obtener_producto(producto_id: str):
    db = obtener_bd()
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
    
    db = obtener_bd()
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

# Endpoints de imágenes
@app.post("/api/productos/{producto_id}/imagen")
async def subir_imagen(
    producto_id: str,
    imagen: UploadFile = File(...)
):
    """Sube imagen principal del producto a Cloudinary"""
    
    print(f"📸 Subiendo imagen para producto {producto_id}")
    print(f"   Filename: {imagen.filename}")
    print(f"   Content-Type: {imagen.content_type}")
    
    # Validar tipo de archivo
    if not imagen.content_type or not imagen.content_type.startswith('image/'):
        print(f"❌ Tipo de archivo inválido: {imagen.content_type}")
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes")
    
    # Validar tamaño (5MB máximo)
    contenido = await imagen.read()
    print(f"   Tamaño: {len(contenido)} bytes")
    
    if len(contenido) > 5 * 1024 * 1024:
        print(f"❌ Imagen muy grande: {len(contenido)} bytes")
        raise HTTPException(status_code=400, detail="Imagen muy grande (máximo 5MB)")
    
    try:
        print(f"☁️ Subiendo a Cloudinary...")
        # Subir a Cloudinary
        url_imagen = await subir_imagen_producto(contenido, producto_id)
        print(f"✅ Imagen subida: {url_imagen}")
        
        # Actualizar producto en MongoDB
        db = obtener_bd()
        if db is not None:
            resultado = await db.productos.update_one(
                {"id": producto_id},
                {"$set": {"imagen": url_imagen}}
            )
            print(f"✅ Producto actualizado en MongoDB: {resultado.modified_count} documentos")
        
        return {
            "exito": True,
            "mensaje": "Imagen subida exitosamente",
            "url": url_imagen
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/productos/{producto_id}/imagenes-adicionales")
async def subir_imagenes_adicionales(
    producto_id: str,
    imagenes: List[UploadFile] = File(...)
):
    """Sube múltiples imágenes adicionales del producto"""
    
    if len(imagenes) > 5:
        raise HTTPException(status_code=400, detail="Máximo 5 imágenes adicionales")
    
    try:
        # Leer todas las imágenes
        archivos_bytes = []
        for imagen in imagenes:
            if not imagen.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"Archivo {imagen.filename} no es una imagen")
            
            contenido = await imagen.read()
            if len(contenido) > 5 * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"Imagen {imagen.filename} muy grande (máximo 5MB)")
            
            archivos_bytes.append(contenido)
        
        # Subir a Cloudinary
        urls = await subir_multiples_imagenes(archivos_bytes, producto_id)
        
        # Actualizar producto en MongoDB
        db = obtener_bd()
        if db is not None:
            await db.productos.update_one(
                {"id": producto_id},
                {"$set": {"imagenes_adicionales": urls}}
            )
        
        return {
            "exito": True,
            "mensaje": f"{len(urls)} imágenes subidas exitosamente",
            "urls": urls
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/salud")
async def verificar_salud():
    db = obtener_bd()
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
        "mongodb_conectado": db is not None,
        "cloudinary_configurado": True
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