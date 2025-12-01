from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from typing import Optional
from datetime import datetime

app = FastAPI(title="Credit Service", version="2.0.0")

# Modelos
class SolicitudCredito(BaseModel):
    usuario_id: int
    monto_solicitado: float
    tipo_credito: str = "interno"
    
class RespuestaCredito(BaseModel):
    aprobado: bool
    monto_aprobado: float
    tasa_interes: float
    plazo_meses: int

# Datos simulados
creditos_db = {}

@app.get("/salud")
async def verificar_salud():
    return {"estado": "activo", "servicio": "Credit Service", "version": "2.0.0"}

@app.post("/api/credito/solicitar", response_model=RespuestaCredito)
async def solicitar_credito(solicitud: SolicitudCredito):
    # Lógica básica de aprobación
    if solicitud.monto_solicitado <= 1000000:  # 1M COP
        return RespuestaCredito(
            aprobado=True,
            monto_aprobado=solicitud.monto_solicitado,
            tasa_interes=2.5,
            plazo_meses=12
        )
    else:
        return RespuestaCredito(
            aprobado=False,
            monto_aprobado=0,
            tasa_interes=0,
            plazo_meses=0
        )

@app.get("/api/credito/historial/{usuario_id}")
async def obtener_historial_credito(usuario_id: int):
    return {
        "usuario_id": usuario_id,
        "creditos_activos": [],
        "historial_pagos": [],
        "score_crediticio": 750
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3008)