# app/schemas/plan.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# PLANES - CREATE / UPDATE
# ==========================================================

class PlanCreate(BaseModel):
    nombre_plan: str = Field(..., min_length=3, max_length=50)
    velocidad_mbps_plan: int = Field(..., gt=0)
    descripcion_plan: Optional[str] = Field(None, max_length=100)
    estado_plan_id: int = Field(..., ge=1)


class PlanUpdate(BaseModel):
    nombre_plan: Optional[str] = Field(None, min_length=3, max_length=50)
    velocidad_mbps_plan: Optional[int] = Field(None, gt=0)
    descripcion_plan: Optional[str] = Field(None, max_length=100)
    estado_plan_id: Optional[int] = Field(None, ge=1)


# ==========================================================
# PLANES - RESPONSES
# ==========================================================

class PlanResponse(BaseModel):
    plan_id: int
    nombre_plan: str
    velocidad_mbps_plan: int
    descripcion_plan: Optional[str]
    estado_plan_id: int

    class Config:
        from_attributes = True


class PlanCommercialResponse(BaseModel):
    plan_id: int
    nombre_plan: str
    velocidad_mbps_plan: int
    descripcion_plan: Optional[str]
    estado_plan_id: int
    precio_vigente: Optional[float] = None
    fecha_desde_precio_vigente: Optional[datetime] = None
    fecha_hasta_precio_vigente: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlanListResponse(BaseModel):
    items: List[PlanCommercialResponse]


# ==========================================================
# PRECIOS DEL PLAN
# ==========================================================

class PlanPriceCreate(BaseModel):
    precio_mensual_pplanes: float = Field(..., gt=0)
    fecha_desde_pplanes: datetime
    fecha_hasta_pplanes: Optional[datetime] = None


class PlanPriceUpdate(BaseModel):
    precio_mensual_pplanes: Optional[float] = Field(None, gt=0)
    fecha_desde_pplanes: Optional[datetime] = None
    fecha_hasta_pplanes: Optional[datetime] = None


class PlanPriceResponse(BaseModel):
    precios_planes_id: int
    plan_id: int
    precio_mensual_pplanes: float
    fecha_desde_pplanes: datetime
    fecha_hasta_pplanes: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlanPriceListResponse(BaseModel):
    items: List[PlanPriceResponse]
