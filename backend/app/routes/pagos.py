# app/routes/pagos.py

from __future__ import annotations

from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException
from psycopg import Connection

from app.schemas.pago import (
    GenerarPeriodoIn,
    GenerarPeriodoOut,
    GenerarLoteIn,
    GenerarLoteOut,
    PagoMovimientoIn,
    PagoDetalleOut,
    ContratoPagoListItemOut,
    PatchFacturaBonificacionIn,
    PagosResumenOut,
)
from app.repositories.contratos_repo import ContractRepository
from app.repositories.pagos_repo import PagosRepo
from app.repositories.catalogos_repo import CatalogosRepo
from app.repositories.precios_repo import PreciosRepo
from app.repositories.promociones_repo import PromocionesRepo
from app.repositories.cuentas_repo import CuentaRepo
from app.services.pagos_service import PagosService
from app.dependencies.auth import require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion
from app.db import get_db


## router = APIRouter(tags=["Pagos"])
router = APIRouter(
    tags=["Pagos"],
    dependencies=[Depends(require_roles("ADMIN", "COBRANZAS"))],
)


def _svc(conn: Connection) -> PagosService:
    return PagosService(
        contratos_repo=ContractRepository(conn),
        pagos_repo=PagosRepo(conn),
        catalogos_repo=CatalogosRepo(conn),
        precios_repo=PreciosRepo(conn),
        promo_repo=PromocionesRepo(conn),
        cuenta_repo=CuentaRepo(conn),
    )


@router.get("/pagos/resumen", response_model=PagosResumenOut)
def get_pagos_resumen(conn: Connection = Depends(get_db)):
    return _svc(conn).resumen()


@router.post("/contratos/{contrato_id}/pagos/generar", response_model=GenerarPeriodoOut)
def generar_periodo_contrato(
    contrato_id: int,
    body: GenerarPeriodoIn,
    conn: Connection = Depends(get_db),
    auditor: Auditor = Depends(get_auditor),
):
    fecha_emision = body.fecha_emision or date.today()
    with conn.transaction():
        res = _svc(conn).generar_periodo_individual(
            contrato_id=contrato_id,
            periodo_anio_pago=body.periodo_anio_pago,
            periodo_mes_pago=body.periodo_mes_pago,
            fecha_emision=fecha_emision,
            fecha_vencimiento=body.fecha_vencimiento,
            bonificacion_previa=body.bonificacion_previa,
        )
    auditor.log(
        modulo=AuditModulo.PAGOS,
        accion=AuditAccion.GEN_INDIVIDUAL,
        entidad="pagos",
        entidad_id=res["pago_id"],
        detalle=f"contrato_id={contrato_id} periodo={body.periodo_anio_pago}-{body.periodo_mes_pago}",
    )
    return {
        "pago": {
            "pago_id": res["pago_id"],
            "contrato_id": res["contrato_id"],
            "factura_venta_id": res["factura_venta_id"],
            "periodo_anio_pago": res["periodo_anio_pago"],
            "periodo_mes_pago": res["periodo_mes_pago"],
            "estado": res["estado"],
            "total_factura": res["total_factura"],
            "total_pagado": res["total_pagado"],
            "saldo_pendiente": res["saldo_pendiente"],
            "excedente_credito": res["excedente_credito"],
        },
        "saldo_cuenta_resultante": res["saldo_cuenta_resultante"],
    }


@router.post("/pagos/generar-lote", response_model=GenerarLoteOut)
def generar_lote(
    body: GenerarLoteIn,
    conn: Connection = Depends(get_db),
    auditor: Auditor = Depends(get_auditor),
):
    fecha_emision = body.fecha_emision or date.today()
    res = _svc(conn).generar_lote(
        periodo_anio_pago=body.periodo_anio_pago,
        periodo_mes_pago=body.periodo_mes_pago,
        fecha_emision=fecha_emision,
        fecha_vencimiento=body.fecha_vencimiento,
        bonificacion_default=body.bonificacion_previa_default,
    )
    auditor.log(
        modulo=AuditModulo.PAGOS,
        accion=AuditAccion.GEN_LOTE,
        entidad="pagos",
        detalle=(
            f"periodo={body.periodo_anio_pago}-{body.periodo_mes_pago} "
            f"creados={res['creados']} omitidos={res['omitidos_existentes']}"
        ),
    )
    return res


@router.post("/pagos/{pago_id}/movimientos", response_model=PagoDetalleOut)
def crear_movimiento_pago(
    pago_id: int,
    body: PagoMovimientoIn,
    conn: Connection = Depends(get_db),
    auditor: Auditor = Depends(get_auditor),
):
    with conn.transaction():
        res = _svc(conn).registrar_movimiento_pago(
            pago_id=pago_id,
            fecha_pago=body.fecha_pago,
            monto=body.monto_pago,
            medio_pago_id=body.medio_pago_id,
            tipo_pago_id=body.tipo_pago_id,
            observacion=body.observacion,
            comprobantes=[c.model_dump() for c in (body.comprobantes or [])],
        )

    auditor.log(
        modulo=AuditModulo.PAGOS,
        accion=AuditAccion.MOVIMIENTO,
        entidad="pagos",
        entidad_id=pago_id,
        detalle=f"monto={body.monto_pago} medio_pago_id={body.medio_pago_id}",
    )

    det = _svc(conn).get_pago_detalle(pago_id)
    det["pago"]["estado"] = res["estado"]
    det["saldo_cuenta_resultante"] = res["saldo_cuenta_resultante"]
    return det


@router.get("/pagos/{pago_id}", response_model=PagoDetalleOut)
def get_pago(pago_id: int, conn: Connection = Depends(get_db)):
    return _svc(conn).get_pago_detalle(pago_id)


@router.get("/pagos/{pago_id}/movimientos")
def get_pago_movimientos(pago_id: int, conn: Connection = Depends(get_db)):
    det = _svc(conn).get_pago_detalle(pago_id)
    return det["movimientos"]


@router.get("/pagos/{pago_id}/movimientos/{pago_mov_id}")
def get_pago_movimiento(
    pago_id: int,
    pago_mov_id: int,
    conn: Connection = Depends(get_db),
):
    det = _svc(conn).get_pago_detalle(pago_id)

    for m in det["movimientos"]:
        if m["pago_mov_id"] == pago_mov_id:
            return m

    raise HTTPException(status_code=404, detail="Movimiento no encontrado")


@router.patch("/facturas-ventas/{factura_venta_id}")
def patch_factura(
    factura_venta_id: int,
    body: PatchFacturaBonificacionIn,
    conn: Connection = Depends(get_db),
    auditor: Auditor = Depends(get_auditor),
):
    result = _svc(conn).patch_factura_bonificacion(factura_venta_id, body.bonificacion_fventas)
    auditor.log(
        modulo=AuditModulo.PAGOS,
        accion=AuditAccion.FACTURA_BONIFICACION,
        entidad="facturas_ventas",
        entidad_id=factura_venta_id,
        detalle=f"bonificacion={body.bonificacion_fventas}",
    )
    return result


@router.get("/contratos/{contrato_id}/pagos", response_model=list[ContratoPagoListItemOut])
def list_pagos_contrato(
    contrato_id: int,
    anio: int | None = Query(default=None),
    mes: int | None = Query(default=None, ge=1, le=12),
    estado: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    conn: Connection = Depends(get_db),
):
    return _svc(conn).list_pagos_contrato(contrato_id, anio, mes, estado, limit, offset)


@router.get("/clientes/{cliente_id}/cuenta")
def get_cuenta_cliente(cliente_id: int, conn: Connection = Depends(get_db)):
    return _svc(conn).get_cuenta_cliente(cliente_id)


@router.get("/clientes/{cliente_id}/cuenta/movimientos")
def list_movs_cuenta_cliente(
    cliente_id: int,
    desde: str | None = Query(default=None),
    hasta: str | None = Query(default=None),
    tipo: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    conn: Connection = Depends(get_db),
):
    repo = CuentaRepo(conn)
    return repo.get_cuenta_movimientos(cliente_id, desde, hasta, tipo, limit, offset)
