from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import jwt
import os
from config.base_datos import obtener_bd

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRETO", "secret")
ROLES_CATEGORIAS = {'product_manager', 'ceo'}


class CategoriaInput(BaseModel):
    nombre: str
    descripcion: str = ""
    imagen: str = ""


def verificar_product_manager(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload.get("rol") not in ROLES_CATEGORIAS:
            raise HTTPException(status_code=403, detail="Sin permisos para gestionar categorías")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.get("/")
async def listar_categorias():
    try:
        bd = obtener_bd()
        categorias = await bd["categorias"].find({}).to_list(length=100)
        for cat in categorias:
            if "_id" in cat:
                del cat["_id"]
        return {"categorias": categorias}
    except Exception as e:
        print(f"⚠️ Error obteniendo categorías: {e}")
        return {"categorias": []}


@router.post("/seed")
async def seed_categorias():
    categorias_iniciales = [
        {"id": "1",  "nombre": "Blazers",    "descripcion": "Blazers elegantes y formales"},
        {"id": "2",  "nombre": "Blusas",     "descripcion": "Blusas casuales y formales"},
        {"id": "3",  "nombre": "Cardigans",  "descripcion": "Cardigans cómodos y versátiles"},
        {"id": "4",  "nombre": "Conjuntos",  "descripcion": "Conjuntos coordinados"},
        {"id": "5",  "nombre": "Faldas",     "descripcion": "Faldas de diferentes estilos"},
        {"id": "6",  "nombre": "Jeans",      "descripcion": "Jeans de mezclilla"},
        {"id": "7",  "nombre": "Pantalones", "descripcion": "Pantalones casuales y formales"},
        {"id": "8",  "nombre": "Tops",       "descripcion": "Tops modernos"},
        {"id": "9",  "nombre": "Vestidos",   "descripcion": "Vestidos para toda ocasión"},
        {"id": "10", "nombre": "Lencería",   "descripcion": "Ropa interior femenina elegante y sensual"},
    ]
    try:
        bd = obtener_bd()
        await bd["categorias"].delete_many({})
        resultado = await bd["categorias"].insert_many(categorias_iniciales)
        return {"mensaje": "Categorías insertadas exitosamente", "total": len(resultado.inserted_ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/")
async def crear_categoria(datos: CategoriaInput, authorization: Optional[str] = Header(None)):
    verificar_product_manager(authorization)
    try:
        bd = obtener_bd()
        existe = await bd["categorias"].find_one({"nombre": {"$regex": f"^{datos.nombre}$", "$options": "i"}})
        if existe:
            raise HTTPException(status_code=400, detail="La categoría ya existe")
        ultima = await bd["categorias"].find_one(sort=[("id", -1)])
        try:
            nuevo_id = str(int(ultima["id"]) + 1) if ultima else "1"
        except (ValueError, TypeError):
            import time
            nuevo_id = str(int(time.time() * 1000))
        nueva = {"id": nuevo_id, "nombre": datos.nombre, "descripcion": datos.descripcion, "imagen": datos.imagen}
        await bd["categorias"].insert_one(nueva)
        if "_id" in nueva:
            del nueva["_id"]
        return {"mensaje": "Categoría creada exitosamente", "categoria": nueva}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/{categoria_id}")
async def actualizar_categoria(categoria_id: str, datos: CategoriaInput, authorization: Optional[str] = Header(None)):
    verificar_product_manager(authorization)
    try:
        bd = obtener_bd()
        categoria = await bd["categorias"].find_one({"id": categoria_id})
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        update = {"nombre": datos.nombre, "descripcion": datos.descripcion, "imagen": datos.imagen}
        await bd["categorias"].update_one({"id": categoria_id}, {"$set": update})
        categoria.update(update)
        if "_id" in categoria:
            del categoria["_id"]
        return {"mensaje": "Categoría actualizada", "categoria": categoria}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/{categoria_id}")
async def eliminar_categoria(categoria_id: str, authorization: Optional[str] = Header(None)):
    verificar_product_manager(authorization)
    try:
        bd = obtener_bd()
        categoria = await bd["categorias"].find_one({"id": categoria_id})
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        await bd["categorias"].delete_one({"id": categoria_id})
        if "_id" in categoria:
            del categoria["_id"]
        return {"mensaje": "Categoría eliminada exitosamente", "categoria": categoria}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
