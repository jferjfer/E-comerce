from fastapi import FastAPI, HTTPException, Query, Depends, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional, List
import uvicorn
import os
import time
import jwt as pyjwt
from datetime import datetime
from config.base_datos import conectar_bd, cerrar_bd, obtener_bd
from config.cloudinary_config import cloudinary
from servicios.servicio_imagenes import subir_imagen_producto, subir_multiples_imagenes
from controladores import categorias

# Campos sensibles que solo ven roles internos
CAMPOS_SENSIBLES = {'costo_adquisicion', 'proveedor_id', 'referencia_proveedor', 'precio_manual'}
ROLES_INTERNOS = {'product_manager', 'category_manager', 'seller_premium', 'ceo', 'contador', 'cfo', 'operations_director'}

def obtener_rol_request(request: Request) -> Optional[str]:
    """Extrae el rol del JWT sin bloquear si no hay token"""
    try:
        auth = request.headers.get('authorization', '')
        if not auth.startswith('Bearer '):
            return None
        token = auth.replace('Bearer ', '')
        secret = os.getenv('JWT_SECRETO', '')
        if not secret:
            return None
        decoded = pyjwt.decode(token, secret, algorithms=['HS256'])
        return decoded.get('rol')
    except Exception:
        return None

def filtrar_campos_sensibles(producto: dict, rol: Optional[str]) -> dict:
    """Elimina campos sensibles si el rol no es interno"""
    if rol in ROLES_INTERNOS:
        return producto
    return {k: v for k, v in producto.items() if k not in CAMPOS_SENSIBLES}

# Productos hardcodeados como fallback
PRODUCTOS_FALLBACK = [
    {"id": "1", "nombre": "Vestido Elegante Negro", "precio": 89900, "categoria": "Vestidos", "descripcion": "Vestido elegante perfecto para ocasiones especiales", "imagen": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", "calificacion": 5, "en_stock": True, "tallas": ["S", "M", "L"], "colores": ["Negro"]},
    {"id": "2", "nombre": "Camisa Blanca Clásica", "precio": 45900, "categoria": "Camisas", "descripcion": "Camisa blanca versátil para cualquier ocasión", "imagen": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400", "calificacion": 4.5, "en_stock": True, "tallas": ["S", "M", "L", "XL"], "colores": ["Blanco"]},
    {"id": "3", "nombre": "Pantalón Jean Azul", "precio": 67900, "categoria": "Pantalones", "descripcion": "Jean clásico de corte moderno", "imagen": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", "calificacion": 4.8, "en_stock": True, "tallas": ["28", "30", "32", "34"], "colores": ["Azul"]},
    {"id": "4", "nombre": "Blazer Gris Ejecutivo", "precio": 129900, "categoria": "Blazers", "descripcion": "Blazer profesional de alta calidad", "imagen": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400", "calificacion": 5, "en_stock": True, "tallas": ["S", "M", "L"], "colores": ["Gris"]},
    {"id": "5", "nombre": "Zapatos Formales Negros", "precio": 89900, "categoria": "Calzado", "descripcion": "Zapatos elegantes para eventos formales", "imagen": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400", "calificacion": 4.7, "en_stock": True, "tallas": ["38", "39", "40", "41", "42"], "colores": ["Negro"]},
    {"id": "6", "nombre": "Vestido Floral Primavera", "precio": 79900, "categoria": "Vestidos", "descripcion": "Vestido fresco con estampado floral", "imagen": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400", "calificacion": 4.6, "en_stock": True, "tallas": ["S", "M", "L"], "colores": ["Multicolor"]},
    {"id": "7", "nombre": "Camisa Casual Azul", "precio": 39900, "categoria": "Camisas", "descripcion": "Camisa casual perfecta para el día a día", "imagen": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400", "calificacion": 4.3, "en_stock": True, "tallas": ["S", "M", "L"], "colores": ["Azul"]},
    {"id": "8", "nombre": "Pantalón Chino Beige", "precio": 59900, "categoria": "Pantalones", "descripcion": "Pantalón chino cómodo y elegante", "imagen": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400", "calificacion": 4.5, "en_stock": True, "tallas": ["28", "30", "32", "34"], "colores": ["Beige"]},
]

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
    allow_origins=[
        "https://egoscolombia.com.co",
        "http://149.130.182.9:3005",
        "http://localhost:3000",
        "http://149.130.182.9:3000",
        "http://149.130.182.9"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(categorias.router, prefix="/api/categorias", tags=["categorias"])

# Endpoints de productos
@app.get("/api/productos")
async def listar_productos(
    request: Request,
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    precio_min: Optional[float] = Query(None, description="Precio mínimo"),
    precio_max: Optional[float] = Query(None, description="Precio máximo"),
    buscar: Optional[str] = Query(None, description="Buscar en nombre y descripción"),
    ordenar: Optional[str] = Query("relevancia", description="Ordenar por: precio_asc, precio_desc, nombre, calificacion"),
    limite: int = Query(50, description="Límite de productos"),
    pagina: int = Query(1, description="Página"),
    todos: bool = Query(False, description="Incluir productos inactivos (solo admin)")
):
    rol = obtener_rol_request(request)
    print(f"📦 Obteniendo productos - Categoría: {categoria}, Búsqueda: {buscar} | Rol: {rol}")
    
    db = obtener_bd()
    
    # Si no hay BD, usar productos hardcodeados
    if db is None:
        print("⚠️ MongoDB no disponible, usando productos hardcodeados")
        productos = PRODUCTOS_FALLBACK.copy()
        
        # Aplicar filtros
        if categoria:
            productos = [p for p in productos if p["categoria"].lower() == categoria.lower()]
        
        if precio_min is not None:
            productos = [p for p in productos if p["precio"] >= precio_min]
        
        if precio_max is not None:
            productos = [p for p in productos if p["precio"] <= precio_max]
        
        if buscar:
            productos = [p for p in productos if buscar.lower() in p["nombre"].lower() or buscar.lower() in p["descripcion"].lower()]
        
        # Ordenar
        if ordenar == "precio_asc":
            productos.sort(key=lambda x: x["precio"])
        elif ordenar == "precio_desc":
            productos.sort(key=lambda x: x["precio"], reverse=True)
        elif ordenar == "nombre":
            productos.sort(key=lambda x: x["nombre"])
        elif ordenar == "calificacion":
            productos.sort(key=lambda x: x.get("calificacion", 0), reverse=True)
        
        total = len(productos)
        print(f"✅ Productos hardcodeados: {total}")
        
        return {
            "productos": [filtrar_campos_sensibles(p, rol) for p in productos],
            "total": total,
            "pagina": 1,
            "limite": limite,
            "total_paginas": 1
        }

    # Si hay BD, usar MongoDB
    try:
        filtro = {}
        
        # Solo productos activos para clientes (sin parámetro todos)
        if not todos:
            filtro["en_stock"] = True
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
            "productos": [filtrar_campos_sensibles(p, rol) for p in productos],
            "total": total,
            "pagina": pagina,
            "limite": limite,
            "total_paginas": (total + limite - 1) // limite
        }
    except Exception as e:
        print(f"❌ Error consultando MongoDB: {e}")
        return {
            "productos": [filtrar_campos_sensibles(p, rol) for p in PRODUCTOS_FALLBACK],
            "total": len(PRODUCTOS_FALLBACK),
            "pagina": 1,
            "limite": limite,
            "total_paginas": 1
        }

@app.post("/api/productos")
async def crear_producto(producto: dict):
    print(f"📦 Creando nuevo producto: {producto.get('nombre')}")

    db = obtener_bd()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")

    try:
        # Generar ID único basado en timestamp
        producto['id'] = str(int(time.time() * 1000))
        producto['fecha_creacion'] = datetime.now().isoformat()

        # Verificar que el SKU no esté duplicado
        sku = producto.get('sku')
        if sku:
            existente = await db.productos.find_one({"sku": sku})
            if existente:
                raise HTTPException(status_code=409, detail=f"Ya existe un producto con el SKU {sku}")

        # Crear índice único en sku si no existe
        await db.productos.create_index("sku", unique=True, sparse=True)

        resultado = await db.productos.insert_one(producto)

        if resultado.inserted_id:
            print(f"✅ Producto creado — ID: {producto['id']} | SKU: {sku}")
            return {
                "exito": True,
                "mensaje": "Producto creado exitosamente",
                "producto": {
                    "id": producto['id'],
                    "nombre": producto['nombre'],
                    "sku": sku,
                    "precio": producto.get('precio')
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Error al insertar producto")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creando producto: {e}")
        raise HTTPException(status_code=500, detail=f"Error creando producto: {str(e)}")

@app.get("/api/productos/destacados")
async def productos_destacados(request: Request):
    rol = obtener_rol_request(request)
    print("⭐ Obteniendo productos destacados")
    
    db = obtener_bd()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")
    
    try:
        productos_cursor = db.productos.find({"calificacion": {"$gte": 4}}).limit(6)
        productos = await productos_cursor.to_list(length=6)
        
        for i, producto in enumerate(productos):
            if "_id" in producto:
                del producto["_id"]
            if not producto.get("id"):
                producto["id"] = f"prod_{i+1}_{int(time.time())}"
                
        print(f"✅ Productos destacados encontrados: {len(productos)}")
        return {"productos": [filtrar_campos_sensibles(p, rol) for p in productos], "total": len(productos)}
    except Exception as e:
        print(f"❌ Error MongoDB: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo destacados: {str(e)}")

@app.put("/api/productos/{producto_id}")
async def actualizar_producto(producto_id: str, datos: dict):
    print(f"✏️ Actualizando producto {producto_id}")

    db = obtener_bd()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")

    try:
        # Limpiar campos None y vacíos
        datos_limpios = {k: v for k, v in datos.items() if v is not None and k != '_id'}
        datos_limpios["fecha_actualizacion"] = datetime.now().isoformat()

        resultado = await db.productos.update_one(
            {"id": producto_id},
            {"$set": datos_limpios}
        )

        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        # Retornar producto actualizado
        producto = await db.productos.find_one({"id": producto_id})
        if producto and "_id" in producto:
            del producto["_id"]

        print(f"✅ Producto {producto_id} actualizado")
        return {
            "exito": True,
            "mensaje": "Producto actualizado exitosamente",
            "producto": producto
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error actualizando producto: {e}")
        raise HTTPException(status_code=500, detail=f"Error actualizando producto: {str(e)}")


@app.delete("/api/productos/{producto_id}")
async def eliminar_producto(producto_id: str):
    db = obtener_bd()
    if db is None:
        raise HTTPException(status_code=500, detail="Base de datos no disponible")
    resultado = await db.productos.delete_one({"id": producto_id})
    if resultado.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"exito": True, "mensaje": "Producto eliminado"}


@app.get("/api/productos/{producto_id}")
async def obtener_producto(producto_id: str, request: Request):
    rol = obtener_rol_request(request)
    db = obtener_bd()
    if db is None:
        prod = next((p for p in PRODUCTOS_FALLBACK if p["id"] == producto_id), None)
        if not prod:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return {"producto": filtrar_campos_sensibles(prod, rol)}

    producto = await db.productos.find_one({"id": producto_id})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if "_id" in producto:
        del producto["_id"]

    return {"producto": filtrar_campos_sensibles(producto, rol)}



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
    uvicorn.run(app, host="0.0.0.0", port=puerto)