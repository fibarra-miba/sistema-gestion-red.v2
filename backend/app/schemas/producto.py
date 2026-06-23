# app/schemas/producto.py

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# PRODUCTOS - CREATE / UPDATE
# ==========================================================

class ProductoCreate(BaseModel):
    nombre_producto: str = Field(..., min_length=1, max_length=150)
    descripcion_producto: Optional[str] = Field(None, max_length=200)
    marca_producto: str = Field(..., min_length=1, max_length=50)
    modelo_producto: str = Field(..., min_length=1, max_length=50)
    tipo_producto_id: int = Field(..., ge=1)


class ProductoUpdate(BaseModel):
    nombre_producto: Optional[str] = Field(None, min_length=1, max_length=150)
    descripcion_producto: Optional[str] = Field(None, max_length=200)
    marca_producto: Optional[str] = Field(None, min_length=1, max_length=50)
    modelo_producto: Optional[str] = Field(None, min_length=1, max_length=50)
    tipo_producto_id: Optional[int] = Field(None, ge=1)
    activo_producto: Optional[bool] = None


# ==========================================================
# PRODUCTOS - RESPONSES
# ==========================================================

class ProductoOut(BaseModel):
    producto_id: int
    nombre_producto: str
    descripcion_producto: Optional[str] = None
    marca_producto: str
    modelo_producto: str
    activo_producto: bool
    tipo_producto_id: int
    # Enriquecido vía join con tipo_producto (evita N+1 en el frontend).
    codigo_tproducto: Optional[str] = None
    descripcion_tproducto: Optional[str] = None

    class Config:
        from_attributes = True


class ProductoListResponse(BaseModel):
    items: List[ProductoOut]
