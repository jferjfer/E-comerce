from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def listar_categorias():
    return {
        "categorias": [
            {"id": "1", "nombre": "Blazers", "descripcion": "Blazers"},
            {"id": "2", "nombre": "Blusas", "descripcion": "Blusas"},
            {"id": "3", "nombre": "Cardigans", "descripcion": "Cardigans"},
            {"id": "4", "nombre": "Conjuntos", "descripcion": "Conjuntos"},
            {"id": "5", "nombre": "Faldas", "descripcion": "Faldas"},
            {"id": "6", "nombre": "Jeans", "descripcion": "Jeans"},
            {"id": "7", "nombre": "Pantalones", "descripcion": "Pantalones"},
            {"id": "8", "nombre": "Tops", "descripcion": "Tops"},
            {"id": "9", "nombre": "Vestidos", "descripcion": "Vestidos"},
            {"id": "10", "nombre": "Lencería", "descripcion": "Ropa interior femenina elegante y sensual"}
        ]
    }