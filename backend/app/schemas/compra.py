# app/schemas/compra.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# COMPRAS - WRITE
# ==========================================================

class CompraDetalleCreate(BaseModel):
    producto_id: int = Field(..., ge=1)
    presentacion_id: Optional[int] = Field(None, ge=1)
    # Cantidad en unidad de compra (p.ej. 1 bolsa). Si no hay presentación,
    # es la cantidad en unidad base.
    cantidad_presentacion: float = Field(..., gt=0)
    # Costo de UNA unidad de compra (p.ej. precio de la bolsa). Si no hay
    # presentación, es el costo por unidad base.
    costo_presentacion: float = Field(..., ge=0)


class CompraCreate(BaseModel):
    proveedor_id: int = Field(..., ge=1)
    codigo_fcompras: Optional[str] = Field(None, max_length=50)
    descripcion_fcompras: Optional[str] = Field(None, max_length=200)
    fecha_fcompras: Optional[datetime] = None
    detalles: List[CompraDetalleCreate] = Field(..., min_length=1)


# ==========================================================
# COMPRAS - RESPONSES
# ==========================================================

class CompraDetalleOut(BaseModel):
    det_factura_compra_id: int
    factura_compra_id: int
    producto_id: int
    nombre_producto: Optional[str] = None
    presentacion_id: Optional[int] = None
    nombre_presentacion: Optional[str] = None
    cantidad_presentacion: float
    factor_aplicado: float
    cantidad_base: float
    costo_unitario_base: float
    subtotal: float

    class Config:
        from_attributes = True


class CompraOut(BaseModel):
    factura_compra_id: int
    proveedor_id: int
    nombre_prov: Optional[str] = None
    codigo_fcompras: Optional[str] = None
    descripcion_fcompras: Optional[str] = None
    fecha_fcompras: datetime
    importe_total_fcompras: float
    estado_factura_compra_id: int
    descripcion_efcompra: Optional[str] = None
    detalles: List[CompraDetalleOut] = []

    class Config:
        from_attributes = True


class CompraListItem(BaseModel):
    factura_compra_id: int
    proveedor_id: int
    nombre_prov: Optional[str] = None
    codigo_fcompras: Optional[str] = None
    descripcion_fcompras: Optional[str] = None
    fecha_fcompras: datetime
    importe_total_fcompras: float
    estado_factura_compra_id: int
    descripcion_efcompra: Optional[str] = None

    class Config:
        from_attributes = True


class CompraListResponse(BaseModel):
    items: List[CompraListItem]
