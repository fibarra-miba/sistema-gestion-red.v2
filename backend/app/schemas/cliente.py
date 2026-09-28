from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


def _dni_vacio_a_none(value: Optional[str]) -> Optional[str]:
    """DNI es opcional: normalizar cadena vacía/espacios a None para guardar NULL."""
    if value is None:
        return None
    value = value.strip()
    return value or None


class ClienteOut(BaseModel):
    cliente_id: int
    nombre: str = Field(..., alias="nombre_cliente")
    apellido: str = Field(..., alias="apellido_cliente")
    dni: Optional[str] = Field(None, alias="dni_cliente")
    telefono: str = Field(..., alias="telefono_cliente")
    email: Optional[EmailStr] = Field(None, alias="email_cliente")
    fecha_alta: Optional[datetime] = Field(None, alias="fecha_alta_cliente")
    estado_cliente_id: int
    observaciones: Optional[str] = Field(None, alias="observacion_cliente")

    class Config:
        allow_population_by_field_name = True
        from_attributes = True


class ClienteCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=50)
    apellido: str = Field(..., min_length=1, max_length=50)
    dni: Optional[str] = Field(None, min_length=5, max_length=20)
    telefono: str = Field(..., min_length=5, max_length=20)
    email: Optional[EmailStr] = None
    estado_cliente_id: int = Field(..., ge=1)
    observaciones: Optional[str] = Field(None, max_length=100)

    _normaliza_dni = field_validator("dni", mode="before")(_dni_vacio_a_none)

class ClienteUpdate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=50)
    apellido: str = Field(..., min_length=1, max_length=50)
    dni: Optional[str] = Field(None, min_length=5, max_length=20)
    telefono: str = Field(..., min_length=5, max_length=20)
    email: Optional[EmailStr] = None
    observaciones: Optional[str] = Field(None, max_length=100)

    _normaliza_dni = field_validator("dni", mode="before")(_dni_vacio_a_none)


class ClientesResumenOut(BaseModel):
    total: int
    activos: int
    inactivos: int