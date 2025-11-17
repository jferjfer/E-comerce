from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(
    title="Servicio de Catálogo",
    description="API para gestión de productos, categorías y tendencias de moda",
    version="1.0.0"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas directas
@app.get("/api/productos")
async def listar_productos():
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

@app.get("/api/productos/destacados")
async def productos_destacados():
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

@app.get("/api/categorias")
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

@app.get("/salud")
async def verificar_salud():
    return {
        "estado": "activo",
        "servicio": "catalogo",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.get("/productos-simple/")
async def productos_simple():
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

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3002))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=puerto,
        reload=os.getenv("ENTORNO") == "desarrollo"
    )