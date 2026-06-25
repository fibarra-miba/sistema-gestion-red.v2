from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, conint, condecimal


Money = condecimal(max_digits=12, decimal_places=2, ge=0)
PositiveMoney = condecimal(max_digits=12, decimal_places=2, gt=0)


# ==========================================================
# RESUMEN (DASHBOARD)
# ==========================================================

class TopMorosoItem(BaseModel):
    cliente_id: int
    nombre_cliente: str
    apellido_cliente: str
    # float (no condecimal) para serializar como número JSON, consistente con
    # formatCurrencyARS(number) del front y con los OUT money de contratos.
    saldo_cuenta: float


class PagosResumenOut(BaseModel):
    deudores_count: int
    monto_adeudado: float
    facturado_mes: float
    pagos_pendientes_mes: int
    pagos_parciales_mes: int
    top_morosos: List[TopMorosoItem]


class ComprobanteIn(BaseModel):
    url: str
    mime: Optional[str] = None
    hash: Optional[str] = Field(default=None, max_length=64)


class GenerarPeriodoIn(BaseModel):
    periodo_anio_pago: conint(ge=2000, le=2100)
    periodo_mes_pago: conint(ge=1, le=12)
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    bonificacion_previa: Optional[Money] = 0


class GenerarLoteIn(BaseModel):
    periodo_anio_pago: conint(ge=2000, le=2100)
    periodo_mes_pago: conint(ge=1, le=12)
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    bonificacion_previa_default: Optional[Money] = 0


class PagoMovimientoIn(BaseModel):
    fecha_pago: datetime
    monto_pago: PositiveMoney
    medio_pago_id: int
    tipo_pago_id: int
    observacion: Optional[str] = Field(default=None, max_length=200)
    comprobantes: Optional[List[ComprobanteIn]] = None


class PatchFacturaBonificacionIn(BaseModel):
    bonificacion_fventas: Money


class FacturaResumenOut(BaseModel):
    factura_venta_id: int
    cliente_id: int
    fecha_emision: datetime
    fecha_vencimiento: Optional[datetime]
    importe_base: Money
    bonificacion: Money
    total: Money


class PagoComprobanteOut(BaseModel):
    pago_comprobante_id: int
    comprobante_url: str
    comprobante_mime: Optional[str]
    comprobante_hash: Optional[str]
    comprobante_created_at: datetime


class ReciboOut(BaseModel):
    recibo_id: int
    pago_mov_id: int
    comprobante_transferencia_recibo: Optional[str] = None
    recepcion_transferencia_recibo: Optional[bool] = None
    importe_recibo: Money
    fecha_recibo: datetime


class PagoMovimientoOut(BaseModel):
    pago_mov_id: int
    pago_id: int
    fecha_pago: datetime
    monto_pago: Money
    medio_pago_id: int
    tipo_pago_id: int
    comprobantes: List[PagoComprobanteOut] = []
    recibo: Optional[ReciboOut] = None


class PagoOut(BaseModel):
    pago_id: int
    contrato_id: int
    factura_venta_id: int
    periodo_anio_pago: int
    periodo_mes_pago: int
    estado: str
    total_factura: Money
    total_pagado: Money
    saldo_pendiente: Money
    excedente_credito: Money


class GenerarPeriodoOut(BaseModel):
    pago: PagoOut
    saldo_cuenta_resultante: condecimal(max_digits=12, decimal_places=2)


class GenerarLoteOut(BaseModel):
    creados: int
    omitidos_existentes: int
    errores: list[dict]


class ClienteResumenOut(BaseModel):
    cliente_id: int
    nombre_cliente: str
    apellido_cliente: str


class PagoDetalleOut(BaseModel):
    pago: PagoOut
    factura: FacturaResumenOut
    cliente: ClienteResumenOut
    movimientos: List[PagoMovimientoOut]
    saldo_cuenta_resultante: condecimal(max_digits=12, decimal_places=2)


class ContratoPagoListItemOut(BaseModel):
    pago_id: int
    periodo_anio_pago: int
    periodo_mes_pago: int
    estado: str
    total_factura: Money
    total_pagado: Money
    saldo_pendiente: Money
    excedente_credito: Money
    fecha_emision: datetime
    fecha_vencimiento: Optional[datetime]
