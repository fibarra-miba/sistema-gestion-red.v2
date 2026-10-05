# app/schemas/instalacion.py

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# RESUMEN (DASHBOARD)
# ==========================================================

class InstalacionAgendaItem(BaseModel):
    programacion_id: int
    contrato_id: int
    fecha_programacion: datetime
    tecnico: Optional[str] = None
    nombre_cliente: str
    apellido_cliente: str


class InstalacionesResumenOut(BaseModel):
    pendientes: int
    fallidas: int
    programadas_hoy: int
    agenda_hoy: List[InstalacionAgendaItem]


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


# Corrección de datos de carga de una instalación ya ejecutada. No toca el
# ciclo de vida (estado) ni la programación de origen: para eso están las
# acciones completar/cancelar/fallar/dar-baja y reprogramar.
class InstalacionUpdate(BaseModel):
    fecha_instalacion: Optional[datetime] = None
    codigo_instalacion: Optional[str] = Field(default=None, max_length=20)
    observacion_instalacion: Optional[str] = Field(default=None, max_length=500)


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
    # Contexto para mostrar en la UI sin exponer solo ids.
    cliente_nombre: Optional[str] = None
    cliente_apellido: Optional[str] = None
    domicilio_resumen: Optional[str] = None

    class Config:
        from_attributes = True


class InstalacionListResponse(BaseModel):
    items: List[InstalacionResponse]


class InstalacionCompletar(BaseModel):
    fecha_instalacion: Optional[datetime] = None


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
    # Gasto de materiales: costo de la salida de stock imputada a la línea.
    costo_unitario_dinstalacion: Optional[float] = None
    costo_total_dinstalacion: Optional[float] = None

    class Config:
        from_attributes = True


class DetalleInstalacionListResponse(BaseModel):
    items: List[DetalleInstalacionResponse]


# ==========================================================
# GARANTIA (MINIMO)
# ==========================================================

# El contrato se deriva de la instalación; el estado nace ACTIVA en el backend.
# fecha_inicio es opcional (default now()): editable para carga masiva histórica.
# Cobro inline del alta: fecha default = inicio de la garantía, monto default = total.
class CobroGarantiaAltaCreate(BaseModel):
    fecha_cobro_garantia: Optional[datetime] = None
    monto_cobro_garantia: Optional[float] = Field(default=None, gt=0)
    medio_pago_id: int = Field(..., ge=1)
    comprobante_cobro_garantia: Optional[str] = Field(default=None, max_length=200)


class GarantiaCreate(BaseModel):
    instalacion_id: int = Field(..., ge=1)
    producto_id: int = Field(..., ge=1)
    fecha_inicio_garantia: Optional[datetime] = None
    monto_garantia: Optional[float] = Field(default=None, ge=0)
    cobro: Optional[CobroGarantiaAltaCreate] = None


# Cobro del depósito (no es factura ni toca cuenta corriente).
class CobroGarantiaCreate(BaseModel):
    fecha_cobro_garantia: Optional[datetime] = None
    monto_cobro_garantia: float = Field(..., gt=0)
    medio_pago_id: int = Field(..., ge=1)
    comprobante_cobro_garantia: Optional[str] = Field(default=None, max_length=200)


class ReciboGarantiaOut(BaseModel):
    recibo_garantia_id: int
    cobro_garantia_id: int
    garantia_id: int
    numero_recibo_garantia: str
    fecha_emision_recibo_garantia: datetime
    importe_recibo_garantia: float
    cliente_nombre: str
    cliente_apellido: str
    producto_descripcion: str
    monto_garantia: float
    total_cobrado_al_emitir: float
    saldo_pendiente_al_emitir: float
    medio_pago_descripcion: str
    comprobante_cobro_garantia: Optional[str] = None
    fecha_cobro_garantia: datetime

    class Config:
        from_attributes = True


class CobroGarantiaOut(BaseModel):
    cobro_garantia_id: int
    garantia_id: int
    fecha_cobro_garantia: datetime
    monto_cobro_garantia: float
    medio_pago_id: int
    descripcion_medio_pago: str
    comprobante_cobro_garantia: Optional[str] = None
    fecha_creacion_cobro_garantia: datetime
    recibo: ReciboGarantiaOut

    class Config:
        from_attributes = True


# Update acotado al ciclo de vida: anular (estado ANULADA + resolución) y
# correcciones de fechas/motivo para carga masiva.
class GarantiaUpdate(BaseModel):
    estado_garantia_id: Optional[int] = Field(default=None, ge=1)
    fecha_inicio_garantia: Optional[datetime] = None
    fecha_fin_garantia: Optional[datetime] = None
    motivo_garantia: Optional[str] = Field(default=None, max_length=200)
    resolucion_garantia: Optional[str] = None
    monto_garantia: Optional[float] = Field(default=None, ge=0)


class GarantiaOut(BaseModel):
    garantia_id: int
    instalacion_id: int
    contrato_id: int
    producto_id: int
    monto_garantia: Optional[float] = None
    fecha_inicio_garantia: datetime
    fecha_fin_garantia: Optional[datetime] = None
    estado_garantia_id: int
    motivo_garantia: Optional[str] = None
    resolucion_garantia: Optional[str] = None
    fecha_creacion_garantia: datetime
    total_cobrado: float = 0
    saldo_pendiente_cobro: Optional[float] = None
    # Enriquecido vía join (evita N+1 en el frontend).
    nombre_producto: Optional[str] = None
    marca_producto: Optional[str] = None
    modelo_producto: Optional[str] = None
    descripcion_egarantia: Optional[str] = None
    cliente_id: int
    cliente_nombre: Optional[str] = None
    cliente_apellido: Optional[str] = None

    class Config:
        from_attributes = True


class GarantiaListResponse(BaseModel):
    items: List[GarantiaOut]


# Depósitos reembolsables retenidos actualmente ("comprometido" = ACTIVAS),
# devueltos y retenidos. Para el panel de garantías.
class GarantiasResumenOut(BaseModel):
    comprometido: float
    cantidad_activas: int
    devuelto: float
    retenido: float
    cobrado: float
    pendiente_cobro: float
