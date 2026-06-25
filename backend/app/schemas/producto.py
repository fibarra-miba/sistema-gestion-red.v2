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
    unidad_stock_producto: Optional[str] = Field(None, max_length=20)


class ProductoUpdate(BaseModel):
    nombre_producto: Optional[str] = Field(None, min_length=1, max_length=150)
    descripcion_producto: Optional[str] = Field(None, max_length=200)
    marca_producto: Optional[str] = Field(None, min_length=1, max_length=50)
    modelo_producto: Optional[str] = Field(None, min_length=1, max_length=50)
    tipo_producto_id: Optional[int] = Field(None, ge=1)
    unidad_stock_producto: Optional[str] = Field(None, max_length=20)
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
    unidad_stock_producto: Optional[str] = None
    # Enriquecido vía join con tipo_producto (evita N+1 en el frontend).
    codigo_tproducto: Optional[str] = None
    descripcion_tproducto: Optional[str] = None

    class Config:
        from_attributes = True


class ProductoListResponse(BaseModel):
    items: List[ProductoOut]


# ==========================================================
# PRESENTACIONES (unidad de compra → factor a stock)
# ==========================================================

class PresentacionCreate(BaseModel):
    nombre_presentacion: str = Field(..., min_length=1, max_length=150)
    unidad_compra_presentacion: str = Field(..., min_length=1, max_length=15)
    factor_a_stock: float = Field(..., gt=0)


class PresentacionOut(BaseModel):
    presentacion_id: int
    producto_id: int
    nombre_presentacion: str
    unidad_compra_presentacion: str
    factor_a_stock: float

    class Config:
        from_attributes = True


class PresentacionListResponse(BaseModel):
    items: List[PresentacionOut]
