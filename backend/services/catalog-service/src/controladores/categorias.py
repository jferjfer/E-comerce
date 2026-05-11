from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List
import jwt
import os
from config.base_datos import obtener_bd

# v2.0 - Categorías en MongoDB con permisos de Product Manager
router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRETO", "secret")

def verificar_product_manager(authorization: Optional[str] = Header(None)):
    """Verificar que el usuario sea Product Manager"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        rol = payload.get("rol")
        
        if rol != "product_manager":
            raise HTTPException(
                status_code=403, 
                detail="Solo el Product Manager puede gestionar categorías"
            )
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.get("/")
async def listar_categorias():
    """Listar todas las categorías desde MongoDB (público)"""
    try:
        bd = obtener_bd()
        categorias = await bd["categorias"].find({}).to_list(length=100)
        
        # Convertir ObjectId a string y limpiar
        for cat in categorias:
            if "_id" in cat:
                del cat["_id"]
        
        return {"categorias": categorias}
    except Exception as e:
        print(f"⚠️ Error obteniendo categorías: {e}")
        return {"categorias": []}

@router.post("/seed")
async def seed_categorias():
    """Insertar categorías iniciales en MongoDB (temporal - sin autenticación)"""
    categorias_iniciales = [
        {"id": "1", "nombre": "Blazers", "descripcion": "Blazers elegantes y formales"},
        {"id": "2", "nombre": "Blusas", "descripcion": "Blusas casuales y formales"},
        {"id": "3", "nombre": "Cardigans", "descripcion": "Cardigans cómodos y versátiles"},
        {"id": "4", "nombre": "Conjuntos", "descripcion": "Conjuntos coordinados"},
        {"id": "5", "nombre": "Faldas", "descripcion": "Faldas de diferentes estilos"},
        {"id": "6", "nombre": "Jeans", "descripcion": "Jeans de mezclilla"},
        {"id": "7", "nombre": "Pantalones", "descripcion": "Pantalones casuales y formales"},
        {"id": "8", "nombre": "Tops", "descripcion": "Tops modernos"},
        {"id": "9", "nombre": "Vestidos", "descripcion": "Vestidos para toda ocasión"},
        {"id": "10", "nombre": "Lencería", "descripcion": "Ropa interior femenina elegante y sensual"}
    ]
    
    try:
        bd = obtener_bd()
        
        # Limpiar categorías existentes
        await bd["categorias"].delete_many({})
        
        # Insertar nuevas
        resultado = await bd["categorias"].insert_many(categorias_iniciales)
        
        return {
            "mensaje": "Categorías insertadas exitosamente",
            "total": len(resultado.inserted_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/")
async def crear_categoria(
    nombre: str,
    descripcion: str,
    authorization: Optional[str] = Header(None)
):
    """Crear nueva categoría en MongoDB (solo Product Manager)"""
    verificar_product_manager(authorization)
    
    try:
        bd = obtener_bd()
        
        # Verificar que no exista
        existe = await bd["categorias"].find_one({"nombre": {"$regex": f"^{nombre}$", "$options": "i"}})
        if existe:
            raise HTTPException(status_code=400, detail="La categoría ya existe")
        
        # Obtener el último ID
        ultima = await bd["categorias"].find_one(sort=[("id", -1)])
        nuevo_id = str(int(ultima["id"]) + 1) if ultima else "1"
        
        nueva_categoria = {
            "id": nuevo_id,
            "nombre": nombre,
            "descripcion": descripcion
        }
        
        await bd["categorias"].insert_one(nueva_categoria)
        
        # Limpiar _id para respuesta
        if "_id" in nueva_categoria:
            del nueva_categoria["_id"]
        
        return {
            "mensaje": "Categoría creada exitosamente",
            "categoria": nueva_categoria
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{categoria_id}")
async def eliminar_categoria(
    categoria_id: str,
    authorization: Optional[str] = Header(None)
):
    """Eliminar categoría de MongoDB (solo Product Manager)"""
    verificar_product_manager(authorization)
    
    try:
        bd = obtener_bd()
        
        categoria = await bd["categorias"].find_one({"id": categoria_id})
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        await bd["categorias"].delete_one({"id": categoria_id})
        
        # Limpiar _id para respuesta
        if "_id" in categoria:
            del categoria["_id"]
        
        return {
            "mensaje": "Categoría eliminada exitosamente",
            "categoria": categoria
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")