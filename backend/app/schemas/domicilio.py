from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class DomicilioCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    complejo: Optional[str] = None
    piso: Optional[int] = None
    depto: Optional[str] = None
    calle: Optional[str] = None
    numero: Optional[int] = None
    referencias: Optional[str] = None
    fecha_desde_dom: Optional[datetime] = None
    fecha_hasta_dom: Optional[datetime] = None

    # Campo estándar
    estado_domicilio_id: Optional[int] = Field(default=None, ge=1)

    # Alias para compatibilidad con tests existentes
    estado_domicilio: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode="after")
    def normalize_estado(self):
        if self.estado_domicilio_id is None:
            if self.estado_domicilio is not None:
                self.estado_domicilio_id = self.estado_domicilio
            else:
                raise ValueError("estado_domicilio_id es requerido")
        return self


class DomicilioOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    domicilio_id: int
    cliente_id: int
    complejo: Optional[str] = None
    piso: Optional[int] = None
    depto: Optional[str] = None
    calle: Optional[str] = None
    numero: Optional[int] = None
    referencias: Optional[str] = None
    fecha_desde_dom: datetime
    fecha_hasta_dom: Optional[datetime] = None
    estado_domicilio_id: int


class DomicilioVigenteOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    domicilio_id: int
    cliente_id: int
    complejo: Optional[str] = None
    piso: Optional[int] = None
    depto: Optional[str] = None
    calle: Optional[str] = None
    numero: Optional[int] = None
    referencias: Optional[str] = None
    fecha_desde_dom: datetime
    fecha_hasta_dom: Optional[datetime] = None
    estado_domicilio_id: int