from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class CategoriaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = None
    id_categoria_padre: Optional[str] = None
    nivel: int = Field(0, ge=0)
    imagen: Optional[str] = None
    activo: bool = True

class CategoriaCrear(CategoriaBase):
    pass

class CategoriaActualizar(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = None
    id_categoria_padre: Optional[str] = None
    nivel: Optional[int] = Field(None, ge=0)
    imagen: Optional[str] = None
    activo: Optional[bool] = None

class CategoriaRespuesta(CategoriaBase):
    id: str = Field(alias="_id")
    fecha_creacion: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }