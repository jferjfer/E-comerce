from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

TipoTendencia = Literal["Clasica", "Urbana", "Deportiva", "Elegante"]

class TendenciaBase(BaseModel):
    nombre: TipoTendencia
    descripcion: Optional[str] = None
    atributos_asociados: Optional[dict] = {}
    temporada: Optional[str] = None
    activo: bool = True

class TendenciaCrear(TendenciaBase):
    pass

class TendenciaActualizar(BaseModel):
    nombre: Optional[TipoTendencia] = None
    descripcion: Optional[str] = None
    atributos_asociados: Optional[dict] = None
    temporada: Optional[str] = None
    activo: Optional[bool] = None

class TendenciaRespuesta(TendenciaBase):
    id: str = Field(alias="_id")
    fecha_creacion: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }