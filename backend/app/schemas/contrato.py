# app/schemas/contrato.py

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# ENUM
# ==========================================================

class ContractStatus(str, Enum):
    BORRADOR = "BORRADOR"
    PENDIENTE_INSTALACION = "PENDIENTE_INSTALACION"
    ACTIVO = "ACTIVO"
    SUSPENDIDO = "SUSPENDIDO"
    BAJA = "BAJA"
    CANCELADO = "CANCELADO"


# ==========================================================
# CREATE
# ==========================================================

class ContractCreate(BaseModel):
    cliente_id: int = Field(..., ge=1)
    domicilio_id: int = Field(..., ge=1)
    plan_id: int = Field(..., ge=1)


# ==========================================================
# RESPONSE (RAW / OPERATIVO)
# ==========================================================

class ContractResponse(BaseModel):
    contrato_id: int
    cliente_id: int
    domicilio_id: int
    plan_id: int
    precio_base_contrato: float
    fecha_inicio_contrato: datetime
    fecha_fin_contrato: Optional[datetime] = None
    estado_contrato_id: int
    aplica_promocion: bool = False
    promocion_id: Optional[int] = None

    class Config:
        from_attributes = True


# ==========================================================
# RESPONSE (COMERCIAL / ENRIQUECIDO)
# ==========================================================

class ContractCommercialResponse(BaseModel):
    contrato_id: int
    cliente_id: int
    cliente_nombre: str
    cliente_apellido: str
    domicilio_id: int
    domicilio_resumen: Optional[str] = None
    plan_id: int
    plan_nombre: str
    precio_base_contrato: float
    fecha_inicio_contrato: datetime
    fecha_fin_contrato: Optional[datetime] = None
    estado_contrato_id: int
    estado_contrato_descripcion: str
    aplica_promocion: bool = False
    promocion_id: Optional[int] = None

    class Config:
        from_attributes = True


# ==========================================================
# LIST
# ==========================================================

class ContractListResponse(BaseModel):
    items: List[ContractResponse]


class ContractCommercialListResponse(BaseModel):
    items: List[ContractCommercialResponse]


# ==========================================================
# ACTION SCHEMAS
# ==========================================================

class ContractSuspend(BaseModel):
    motivo: Optional[str] = Field(None, max_length=200)


class ContractTerminate(BaseModel):
    motivo: Optional[str] = Field(None, max_length=200)


class ContractChangePlan(BaseModel):
    new_plan_id: int = Field(..., ge=1)


class ContractConfirmTechnicalCondition(BaseModel):
    apto: bool
    fecha_programacion_pinstalacion: Optional[datetime] = None
    tecnico_pinstalacion: Optional[str] = Field(default=None, max_length=50)
    notas_pinstalacion: Optional[str] = Field(default=None, max_length=500)


class ContractConfirmTechnicalConditionResponse(BaseModel):
    contrato_id: int
    estado_contrato_id: int
    programacion_id: Optional[int] = None
