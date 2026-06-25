# app/routes/stock.py

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_db
from app.repositories.stock_repo import StockRepository
from app.services.stock_service import StockService
from app.dependencies.auth import require_authenticated_user, require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion
from app.schemas.stock import (
    AjusteStockCreate,
    DevolucionStockCreate,
    ExistenciaListResponse,
    SaldoStockOut,
    MovimientoStockOut,
    MovimientoStockListResponse,
)


# Lectura: cualquier autenticado (el TÉCNICO consulta existencias).
# Escritura (ajustes/devoluciones): ADMIN / OPERADOR.
router = APIRouter(
    prefix="/stock",
    tags=["Stock"],
    dependencies=[Depends(require_authenticated_user)],
)


def get_service(conn: Connection = Depends(get_db)) -> StockService:
    return StockService(StockRepository(conn))


# ==========================================================
# READ
# ==========================================================

@router.get("", response_model=ExistenciaListResponse)
def list_existencias(
    search: Optional[str] = Query(default=None),
    tipo_producto_id: Optional[int] = Query(default=None, ge=1),
    solo_con_stock: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: StockService = Depends(get_service),
):
    return {
        "items": service.existencias(
            search=search,
            tipo_producto_id=tipo_producto_id,
            solo_con_stock=solo_con_stock,
            limit=limit,
            offset=offset,
        )
    }


@router.get("/{producto_id}", response_model=SaldoStockOut)
def get_saldo(
    producto_id: int,
    service: StockService = Depends(get_service),
):
    try:
        return service.saldo(producto_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{producto_id}/movimientos", response_model=MovimientoStockListResponse)
def kardex(
    producto_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    service: StockService = Depends(get_service),
):
    try:
        return {"items": service.kardex(producto_id, limit=limit, offset=offset)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================================
# WRITE (ADMIN / OPERADOR)
# ==========================================================

@router.post(
    "/ajustes",
    response_model=MovimientoStockOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def crear_ajuste(
    payload: AjusteStockCreate,
    service: StockService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.registrar_ajuste(
            producto_id=payload.producto_id,
            cantidad=payload.cantidad,
            positivo=payload.positivo,
            motivo=payload.motivo,
        )
        auditor.log(
            modulo=AuditModulo.STOCK,
            accion=AuditAccion.STOCK_AJUSTE,
            entidad="movimiento_stock",
            entidad_id=result["mov_stock_id"],
            detalle=f"producto_id={payload.producto_id} signo={'+' if payload.positivo else '-'} cantidad={payload.cantidad}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


@router.post(
    "/devoluciones",
    response_model=MovimientoStockOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def crear_devolucion(
    payload: DevolucionStockCreate,
    service: StockService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.registrar_devolucion(
            producto_id=payload.producto_id,
            cantidad=payload.cantidad,
            motivo=payload.motivo,
            det_instalacion_id=payload.det_instalacion_id,
        )
        auditor.log(
            modulo=AuditModulo.STOCK,
            accion=AuditAccion.STOCK_DEVOLUCION,
            entidad="movimiento_stock",
            entidad_id=result["mov_stock_id"],
            detalle=f"producto_id={payload.producto_id} cantidad={payload.cantidad}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


def _status_for(detail: str) -> int:
    if detail == StockService.PRODUCTO_NO_ENCONTRADO:
        return 404
    # Stock insuficiente / cantidad inválida → regla de negocio.
    return 400
