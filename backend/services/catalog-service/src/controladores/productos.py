from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List

from modelos.producto import ProductoCrear, ProductoActualizar, ProductoRespuesta, FiltrosProducto
from servicios.servicio_productos import ServicioProductos

router = APIRouter()

def obtener_servicio_productos():
    return ServicioProductos()

@router.post("/", response_model=ProductoRespuesta, status_code=201)
async def crear_producto(
    producto: ProductoCrear,
    servicio: ServicioProductos = Depends(obtener_servicio_productos)
):
    """Crear un nuevo producto"""
    try:
        producto_creado = await servicio.crear_producto(producto)
        return ProductoRespuesta(**producto_creado)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear producto: {str(e)}")

@router.get("/")
async def listar_productos():
    """Listar productos"""
    return {
        "productos": [
            {
                "id": "prod_001",
                "nombre": "Vestido Floral Primavera",
                "precio": 69.99,
                "descripcion": "Vestido midi con estampado floral",
                "imagen": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"
            },
            {
                "id": "prod_002",
                "nombre": "Camiseta Básica Premium",
                "precio": 24.99,
                "descripcion": "Camiseta 100% algodón orgánico",
                "imagen": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"
            },
            {
                "id": "prod_003",
                "nombre": "Jeans Skinny Mujer",
                "precio": 59.99,
                "descripcion": "Jeans de corte skinny con elastano",
                "imagen": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400"
            }
        ],
        "total": 3
    }

@router.get("/{id_producto}", response_model=ProductoRespuesta)
async def obtener_producto(
    id_producto: str,
    servicio: ServicioProductos = Depends(obtener_servicio_productos)
):
    """Obtener un producto por ID"""
    producto = await servicio.obtener_producto_por_id(id_producto)
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return ProductoRespuesta(**producto)

@router.put("/{id_producto}", response_model=ProductoRespuesta)
async def actualizar_producto(
    id_producto: str,
    datos: ProductoActualizar,
    servicio: ServicioProductos = Depends(obtener_servicio_productos)
):
    """Actualizar un producto"""
    producto_actualizado = await servicio.actualizar_producto(id_producto, datos)
    
    if not producto_actualizado:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return ProductoRespuesta(**producto_actualizado)

@router.delete("/{id_producto}")
async def eliminar_producto(
    id_producto: str,
    servicio: ServicioProductos = Depends(obtener_servicio_productos)
):
    """Eliminar un producto"""
    eliminado = await servicio.eliminar_producto(id_producto)
    
    if not eliminado:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"mensaje": "Producto eliminado exitosamente"}

@router.get("/destacados")
async def obtener_productos_destacados():
    """Obtener productos destacados para la página de inicio"""
    return {
        "productos": [
            {
                "id": "prod_001",
                "nombre": "Vestido Floral Primavera",
                "precio": 69.99,
                "descripcion": "Vestido midi con estampado floral",
                "imagen": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"
            },
            {
                "id": "prod_002",
                "nombre": "Camiseta Básica Premium",
                "precio": 24.99,
                "descripcion": "Camiseta 100% algodón orgánico",
                "imagen": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"
            }
        ],
        "total": 2
    }