from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    talla: Optional[str] = None
    color: Optional[str] = None
    precio: float = Field(..., gt=0)
    imagen: Optional[str] = None
    descripcion: Optional[str] = None
    atributos: Optional[dict] = {}
    ids_categoria: List[str] = []
    id_tendencia_moda: Optional[str] = None
    referencia_inventario: Optional[str] = None
    activo: bool = True

class ProductoCrear(ProductoBase):
    pass

class ProductoActualizar(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    talla: Optional[str] = None
    color: Optional[str] = None
    precio: Optional[float] = Field(None, gt=0)
    imagen: Optional[str] = None
    descripcion: Optional[str] = None
    atributos: Optional[dict] = None
    ids_categoria: Optional[List[str]] = None
    id_tendencia_moda: Optional[str] = None
    referencia_inventario: Optional[str] = None
    activo: Optional[bool] = None

class ProductoRespuesta(BaseModel):
    id: str = Field(alias="_id")
    nombre: str
    precio: float
    descripcion: Optional[str] = None
    imagen: Optional[str] = None
    talla: Optional[str] = None
    color: Optional[str] = None
    activo: Optional[bool] = True
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat() if v else None
        }

class FiltrosProducto(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    tendencia: Optional[str] = None
    precio_min: Optional[float] = None
    precio_max: Optional[float] = None
    color: Optional[str] = None
    talla: Optional[str] = None
    activo: Optional[bool] = True
    pagina: int = Field(1, ge=1)
    limite: int = Field(10, ge=1, le=100)