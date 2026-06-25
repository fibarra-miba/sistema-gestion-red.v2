# app/schemas/proveedor.py

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ProveedorCreate(BaseModel):
    nombre_prov: str = Field(..., min_length=1, max_length=150)
    direccion_prov: Optional[str] = Field(None, max_length=150)
    descripcion_prov: Optional[str] = Field(None, max_length=200)
    link_maps_prov: Optional[str] = None
    telefono_prov: Optional[str] = Field(None, max_length=30)
    email_prov: Optional[str] = Field(None, max_length=120)
    web_prov: Optional[str] = Field(None, max_length=100)
    observacion_prov: Optional[str] = None
    estado_proveedor_id: int = Field(..., ge=1)


class ProveedorUpdate(BaseModel):
    nombre_prov: Optional[str] = Field(None, min_length=1, max_length=150)
    direccion_prov: Optional[str] = Field(None, max_length=150)
    descripcion_prov: Optional[str] = Field(None, max_length=200)
    link_maps_prov: Optional[str] = None
    telefono_prov: Optional[str] = Field(None, max_length=30)
    email_prov: Optional[str] = Field(None, max_length=120)
    web_prov: Optional[str] = Field(None, max_length=100)
    observacion_prov: Optional[str] = None
    estado_proveedor_id: Optional[int] = Field(None, ge=1)


class ProveedorOut(BaseModel):
    proveedor_id: int
    nombre_prov: Optional[str] = None
    direccion_prov: Optional[str] = None
    descripcion_prov: Optional[str] = None
    link_maps_prov: Optional[str] = None
    telefono_prov: Optional[str] = None
    email_prov: Optional[str] = None
    web_prov: Optional[str] = None
    observacion_prov: Optional[str] = None
    estado_proveedor_id: int
    # Enriquecido vía join con estado_proveedor.
    descripcion_eprov: Optional[str] = None

    class Config:
        from_attributes = True


class ProveedorListResponse(BaseModel):
    items: List[ProveedorOut]
