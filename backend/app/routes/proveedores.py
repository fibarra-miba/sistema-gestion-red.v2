# app/routes/proveedores.py

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_db
from app.repositories.proveedores_repo import ProveedoresRepository
from app.services.proveedores_service import ProveedoresService
from app.dependencies.auth import require_authenticated_user, require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion
from app.schemas.proveedor import (
    ProveedorCreate,
    ProveedorUpdate,
    ProveedorOut,
    ProveedorListResponse,
)


# Lectura: cualquier autenticado. Escritura: ADMIN / OPERADOR.
router = APIRouter(
    prefix="/proveedores",
    tags=["Proveedores"],
    dependencies=[Depends(require_authenticated_user)],
)


def get_service(conn: Connection = Depends(get_db)) -> ProveedoresService:
    return ProveedoresService(ProveedoresRepository(conn))


# ==========================================================
# READ
# ==========================================================

@router.get("", response_model=ProveedorListResponse)
def list_proveedores(
    search: Optional[str] = Query(default=None),
    estado_proveedor_id: Optional[int] = Query(default=None, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: ProveedoresService = Depends(get_service),
):
    return {
        "items": service.list_proveedores(
            search=search,
            estado_proveedor_id=estado_proveedor_id,
            limit=limit,
            offset=offset,
        )
    }


@router.get("/{proveedor_id}", response_model=ProveedorOut)
def get_proveedor(
    proveedor_id: int,
    service: ProveedoresService = Depends(get_service),
):
    try:
        return service.get_proveedor(proveedor_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================================
# CREATE / UPDATE (ADMIN / OPERADOR)
# ==========================================================

@router.post(
    "",
    response_model=ProveedorOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def create_proveedor(
    payload: ProveedorCreate,
    service: ProveedoresService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.create_proveedor(payload.model_dump())
        auditor.log(
            modulo=AuditModulo.PROVEEDORES,
            accion=AuditAccion.CREATE,
            entidad="proveedor",
            entidad_id=result["proveedor_id"],
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


@router.patch(
    "/{proveedor_id}",
    response_model=ProveedorOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def update_proveedor(
    proveedor_id: int,
    payload: ProveedorUpdate,
    service: ProveedoresService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        data = payload.model_dump(exclude_unset=True)
        result = service.update_proveedor(proveedor_id, data)
        auditor.log(
            modulo=AuditModulo.PROVEEDORES,
            accion=AuditAccion.UPDATE,
            entidad="proveedor",
            entidad_id=proveedor_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


def _status_for(detail: str) -> int:
    if detail == ProveedoresService.NO_ENCONTRADO:
        return 404
    if detail == ProveedoresService.ESTADO_INVALIDO:
        return 422
    return 400
