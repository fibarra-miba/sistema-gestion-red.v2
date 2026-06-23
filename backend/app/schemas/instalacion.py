# app/schemas/instalacion.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# CONTRATOS - CONDICION TECNICA
# ==========================================================

class ConfirmarCondicionTecnicaIn(BaseModel):
    apto: bool
    fecha_programacion_pinstalacion: Optional[datetime] = None
    tecnico_pinstalacion: Optional[str] = Field(default=None, max_length=50)
    notas_pinstalacion: Optional[str] = Field(default=None, max_length=500)


class ConfirmarCondicionTecnicaOut(BaseModel):
    contrato_id: int
    estado_contrato_id: int
    programacion_id: Optional[int] = None


# ==========================================================
# PROGRAMACION
# ==========================================================

class ProgramacionInstalacionCreate(BaseModel):
    contrato_id: int = Field(..., ge=1)
    domicilio_id: int = Field(..., ge=1)
    fecha_programacion_pinstalacion: datetime
    tecnico_pinstalacion: Optional[str] = Field(default=None, max_length=50)
    notas_pinstalacion: Optional[str] = Field(default=None, max_length=500)


class ProgramacionInstalacionResponse(BaseModel):
    programacion_id: int
    domicilio_id: int
    contrato_id: int
    fecha_programacion_pinstalacion: datetime
    estado_programacion_id: int
    tecnico_pinstalacion: Optional[str] = None
    notas_pinstalacion: Optional[str] = None
    fecha_creacion_pinstalacion: datetime

    class Config:
        from_attributes = True


class ProgramacionInstalacionListResponse(BaseModel):
    items: List[ProgramacionInstalacionResponse]


class ReprogramarInstalacionIn(BaseModel):
    fecha_programacion_pinstalacion: datetime
    tecnico_pinstalacion: Optional[str] = Field(default=None, max_length=50)
    notas_pinstalacion: Optional[str] = Field(default=None, max_length=500)
    motivo_reprogramacion: Optional[str] = Field(default=None, max_length=500)


class ReprogramacionInstalacionResponse(BaseModel):
    reprogramacion_id: int
    programacion_id: int
    fecha_reprogramada_anterior: Optional[datetime] = None
    fecha_reprogramada_nueva: datetime
    tecnico_reprogramacion: Optional[str] = None
    motivo_reprogramacion: Optional[str] = None
    notas_reprogramacion: Optional[str] = None
    fecha_creacion_reprogramacion: datetime

    class Config:
        from_attributes = True


class ReprogramacionInstalacionListResponse(BaseModel):
    items: List[ReprogramacionInstalacionResponse]


class ReintentarInstalacionIn(BaseModel):
    fecha_programacion_pinstalacion: datetime
    tecnico_pinstalacion: Optional[str] = Field(default=None, max_length=50)
    notas_pinstalacion: Optional[str] = Field(default=None, max_length=500)


class EjecutarProgramacionIn(BaseModel):
    codigo_instalacion: Optional[str] = Field(default=None, max_length=20)
    observacion_instalacion: Optional[str] = Field(default=None, max_length=500)
    fecha_instalacion: Optional[datetime] = None


# ==========================================================
# INSTALACIONES
# ==========================================================

class InstalacionCreate(BaseModel):
    programacion_id: int = Field(..., ge=1)
    contrato_id: int = Field(..., ge=1)
    domicilio_id: int = Field(..., ge=1)
    codigo_instalacion: Optional[str] = Field(default=None, max_length=20)
    observacion_instalacion: Optional[str] = Field(default=None, max_length=500)
    fecha_instalacion: Optional[datetime] = None


class InstalacionResponse(BaseModel):
    instalacion_id: int
    programacion_id: int
    contrato_id: int
    domicilio_id: int
    codigo_instalacion: Optional[str] = None
    fecha_instalacion: datetime
    estado_instalacion_id: int
    observacion_instalacion: Optional[str] = None
    fecha_creacion_instalacion: datetime

    class Config:
        from_attributes = True


class InstalacionListResponse(BaseModel):
    items: List[InstalacionResponse]


class InstalacionAccionOut(BaseModel):
    instalacion_id: int
    estado_instalacion_id: int
    contrato_id: int
    estado_contrato_id: Optional[int] = None


# ==========================================================
# DETALLE INSTALACION
# ==========================================================

class DetalleInstalacionCreate(BaseModel):
    producto_id: int = Field(..., ge=1)
    descripcion_dinstalacion: Optional[str] = Field(default=None, max_length=150)
    cantidad_dinstalacion: float = Field(..., gt=0)
    unidad_dinstalacion: str = Field(..., min_length=1, max_length=10)
    observacion_dinstalacion: Optional[str] = Field(default=None, max_length=200)


class DetalleInstalacionResponse(BaseModel):
    det_instalacion_id: int
    instalacion_id: int
    producto_id: int
    descripcion_dinstalacion: Optional[str] = None
    cantidad_dinstalacion: float
    unidad_dinstalacion: str
    observacion_dinstalacion: Optional[str] = None
    fecha_creacion_dinstalacion: datetime

    class Config:
        from_attributes = True


class DetalleInstalacionListResponse(BaseModel):
    items: List[DetalleInstalacionResponse]


# ==========================================================
# GARANTIA (MINIMO)
# ==========================================================

# El contrato se deriva de la instalación; el estado nace ACTIVA en el backend.
# fecha_inicio es opcional (default now()): editable para carga masiva histórica.
class GarantiaCreate(BaseModel):
    instalacion_id: int = Field(..., ge=1)
    producto_id: int = Field(..., ge=1)
    fecha_inicio_garantia: Optional[datetime] = None


# Update acotado al ciclo de vida: anular (estado ANULADA + resolución) y
# correcciones de fechas/motivo para carga masiva.
class GarantiaUpdate(BaseModel):
    estado_garantia_id: Optional[int] = Field(default=None, ge=1)
    fecha_inicio_garantia: Optional[datetime] = None
    fecha_fin_garantia: Optional[datetime] = None
    motivo_garantia: Optional[str] = Field(default=None, max_length=200)
    resolucion_garantia: Optional[str] = None


class GarantiaOut(BaseModel):
    garantia_id: int
    instalacion_id: int
    contrato_id: int
    producto_id: int
    fecha_inicio_garantia: datetime
    fecha_fin_garantia: Optional[datetime] = None
    estado_garantia_id: int
    motivo_garantia: Optional[str] = None
    resolucion_garantia: Optional[str] = None
    fecha_creacion_garantia: datetime
    # Enriquecido vía join (evita N+1 en el frontend).
    nombre_producto: Optional[str] = None
    marca_producto: Optional[str] = None
    modelo_producto: Optional[str] = None
    descripcion_egarantia: Optional[str] = None

    class Config:
        from_attributes = True


class GarantiaListResponse(BaseModel):
    items: List[GarantiaOut]
