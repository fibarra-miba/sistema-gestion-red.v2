# app/schemas/stock.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# MOVIMIENTOS - WRITE
# ==========================================================

class AjusteStockCreate(BaseModel):
    producto_id: int = Field(..., ge=1)
    cantidad: float = Field(..., gt=0)
    positivo: bool = Field(..., description="True suma stock, False resta")
    motivo: str = Field(..., min_length=1, max_length=150)


class DevolucionStockCreate(BaseModel):
    producto_id: int = Field(..., ge=1)
    cantidad: float = Field(..., gt=0)
    motivo: str = Field(..., min_length=1, max_length=150)
    det_instalacion_id: Optional[int] = Field(None, ge=1)


# ==========================================================
# RESPONSES
# ==========================================================

class ExistenciaOut(BaseModel):
    producto_id: int
    nombre_producto: str
    marca_producto: str
    modelo_producto: str
    unidad_stock_producto: Optional[str] = None
    tipo_producto_id: int
    codigo_tproducto: Optional[str] = None
    cantidad: float
    valor: float
    costo_promedio: float

    class Config:
        from_attributes = True


class ExistenciaListResponse(BaseModel):
    items: List[ExistenciaOut]


class SaldoStockOut(BaseModel):
    producto_id: int
    cantidad: float
    valor: float
    costo_promedio: float


class MovimientoStockOut(BaseModel):
    mov_stock_id: int
    producto_id: int
    factor_b_stock: float
    observacion_dmstock: Optional[str] = None
    tipo_mov_id: int
    codigo_tmstock: str
    descripcion_tmstock: str
    signo_tmstock: str
    fecha_mstock: datetime
    costo_unitario_mstock: float
    det_instalacion_id: Optional[int] = None
    det_factura_compra_id: Optional[int] = None

    class Config:
        from_attributes = True


class MovimientoStockListResponse(BaseModel):
    items: List[MovimientoStockOut]
