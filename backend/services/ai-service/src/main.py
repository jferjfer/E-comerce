from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(
    title="Servicio de IA",
    description="API para recomendaciones y análisis de estilo",
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

@app.get("/salud")
async def verificar_salud():
    return {
        "estado": "activo",
        "servicio": "inteligencia-artificial",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.get("/api/recomendaciones")
async def obtener_recomendaciones():
    return {
        "recomendaciones": [
            {
                "producto_id": "prod_001",
                "puntuacion": 0.95,
                "razon": "Basado en tu historial de compras"
            },
            {
                "producto_id": "prod_002", 
                "puntuacion": 0.87,
                "razon": "Productos similares que te gustaron"
            }
        ]
    }

@app.get("/api/estilos")
async def analizar_estilos():
    return {
        "estilos": [
            {
                "nombre": "Casual Moderno",
                "confianza": 0.85,
                "productos_sugeridos": ["prod_002", "prod_003"]
            },
            {
                "nombre": "Elegante Clásico",
                "confianza": 0.78,
                "productos_sugeridos": ["prod_001", "prod_004"]
            }
        ]
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3007))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=puerto,
        reload=os.getenv("ENTORNO") == "desarrollo"
    )