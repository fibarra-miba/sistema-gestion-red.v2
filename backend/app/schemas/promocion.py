# app/schemas/promocion.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# tipo_promocion sembrado en 005: 1=PORCENTAJE, 2=DESCUENTO_FIJO.
# El constraint chk_promociones_tipo_consistente referencia estos IDs.
TIPO_PORCENTAJE = 1
TIPO_DESCUENTO_FIJO = 2


# ==========================================================
# CREATE / UPDATE
# ==========================================================

class PromocionCreate(BaseModel):
    nombre_promo: str = Field(..., min_length=1, max_length=100)
    descripcion_promo: Optional[str] = Field(None, max_length=150)
    tipo_promo_id: int = Field(..., ge=1)
    porcentaje_descuento: Optional[float] = Field(None, gt=0, le=100)
    monto_descuento: Optional[float] = Field(None, gt=0)
    fecha_vigencia_desde_promo: datetime
    fecha_vigencia_hasta_promo: Optional[datetime] = None
    # Una promo recién creada nace usable; la consistencia tipo↔valor la valida
    # el service (espeja chk_promociones_tipo_consistente).
    activo_promo: bool = True


class PromocionUpdate(BaseModel):
    nombre_promo: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion_promo: Optional[str] = Field(None, max_length=150)
    tipo_promo_id: Optional[int] = Field(None, ge=1)
    porcentaje_descuento: Optional[float] = Field(None, gt=0, le=100)
    monto_descuento: Optional[float] = Field(None, gt=0)
    fecha_vigencia_desde_promo: Optional[datetime] = None
    fecha_vigencia_hasta_promo: Optional[datetime] = None
    activo_promo: Optional[bool] = None


# ==========================================================
# RESPONSES
# ==========================================================

class PromocionOut(BaseModel):
    promocion_id: int
    nombre_promo: str
    descripcion_promo: Optional[str] = None
    tipo_promo_id: int
    # Enriquecido vía join con tipo_promocion (evita N+1 en el front).
    descripcion_tpromo: Optional[str] = None
    porcentaje_descuento: Optional[float] = None
    monto_descuento: Optional[float] = None
    fecha_vigencia_desde_promo: datetime
    fecha_vigencia_hasta_promo: Optional[datetime] = None
    activo_promo: bool

    class Config:
        from_attributes = True


class PromocionListResponse(BaseModel):
    items: List[PromocionOut]
