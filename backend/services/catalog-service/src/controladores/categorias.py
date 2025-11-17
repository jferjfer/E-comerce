from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def listar_categorias():
    return {
        "categorias": [
            {"id": "cat_001", "nombre": "Mujer"},
            {"id": "cat_002", "nombre": "Hombre"},
            {"id": "cat_003", "nombre": "Vestidos"},
            {"id": "cat_004", "nombre": "Camisetas"},
            {"id": "cat_005", "nombre": "Pantalones"}
        ]
    }