# app/routes/compras.py

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_db
from app.repositories.compras_repo import ComprasRepository
from app.repositories.stock_repo import StockRepository
from app.services.compras_service import ComprasService
from app.services.stock_service import StockService
from app.dependencies.auth import require_authenticated_user, require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion
from app.schemas.compra import (
    CompraCreate,
    CompraOut,
    CompraListResponse,
)


# Lectura: cualquier autenticado. Escritura: ADMIN / OPERADOR.
router = APIRouter(
    prefix="/compras",
    tags=["Compras"],
    dependencies=[Depends(require_authenticated_user)],
)


def get_service(conn: Connection = Depends(get_db)) -> ComprasService:
    stock = StockService(StockRepository(conn))
    return ComprasService(ComprasRepository(conn), stock)


# ==========================================================
# READ
# ==========================================================

@router.get("", response_model=CompraListResponse)
def list_compras(
    proveedor_id: Optional[int] = Query(default=None, ge=1),
    estado_factura_compra_id: Optional[int] = Query(default=None, ge=1),
    desde: Optional[datetime] = Query(default=None),
    hasta: Optional[datetime] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: ComprasService = Depends(get_service),
):
    return {
        "items": service.list_compras(
            proveedor_id=proveedor_id,
            estado_factura_compra_id=estado_factura_compra_id,
            desde=desde,
            hasta=hasta,
            limit=limit,
            offset=offset,
        )
    }


@router.get("/{factura_compra_id}", response_model=CompraOut)
def get_compra(
    factura_compra_id: int,
    service: ComprasService = Depends(get_service),
):
    try:
        return service.get_compra(factura_compra_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================================
# WRITE (ADMIN / OPERADOR)
# ==========================================================

@router.post(
    "",
    response_model=CompraOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def create_compra(
    payload: CompraCreate,
    service: ComprasService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        data = payload.model_dump()
        result = service.create_compra(**data)
        auditor.log(
            modulo=AuditModulo.COMPRAS,
            accion=AuditAccion.COMPRA_CREATE,
            entidad="facturas_compras",
            entidad_id=result["factura_compra_id"],
            detalle=f"proveedor_id={payload.proveedor_id} total={result['importe_total_fcompras']}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


@router.post(
    "/{factura_compra_id}/anular",
    response_model=CompraOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def anular_compra(
    factura_compra_id: int,
    service: ComprasService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.anular_compra(factura_compra_id)
        auditor.log(
            modulo=AuditModulo.COMPRAS,
            accion=AuditAccion.COMPRA_ANULAR,
            entidad="facturas_compras",
            entidad_id=factura_compra_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


def _status_for(detail: str) -> int:
    if detail == ComprasService.NO_ENCONTRADA:
        return 404
    if detail == ComprasService.YA_ANULADA:
        return 409
    if detail in (
        ComprasService.PROVEEDOR_INVALIDO,
        ComprasService.PRODUCTO_INVALIDO,
        ComprasService.PRESENTACION_INVALIDA,
    ):
        return 422
    return 400
