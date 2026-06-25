# app/routes/productos.py

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_db
from app.repositories.productos_repo import ProductosRepository
from app.services.productos_service import ProductosService
from app.dependencies.auth import require_authenticated_user, require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion
from app.schemas.producto import (
    ProductoCreate,
    ProductoUpdate,
    ProductoOut,
    ProductoListResponse,
    PresentacionCreate,
    PresentacionOut,
    PresentacionListResponse,
)


# Lectura: cualquier usuario autenticado (el TÉCNICO necesita elegir productos
# al cargar detalles de instalación). Escritura: ADMIN / OPERADOR.
router = APIRouter(
    prefix="/productos",
    tags=["Productos"],
    dependencies=[Depends(require_authenticated_user)],
)


def get_service(conn: Connection = Depends(get_db)) -> ProductosService:
    return ProductosService(ProductosRepository(conn))


# ==========================================================
# READ
# ==========================================================

@router.get("", response_model=ProductoListResponse)
def list_productos(
    search: Optional[str] = Query(default=None),
    solo_activos: bool = Query(default=False),
    tipo_producto_id: Optional[int] = Query(default=None, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: ProductosService = Depends(get_service),
):
    return {
        "items": service.list_productos(
            search=search,
            solo_activos=solo_activos,
            tipo_producto_id=tipo_producto_id,
            limit=limit,
            offset=offset,
        )
    }


@router.get("/{producto_id}", response_model=ProductoOut)
def get_producto(
    producto_id: int,
    service: ProductosService = Depends(get_service),
):
    try:
        return service.get_producto(producto_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================================
# CREATE / UPDATE (ADMIN / OPERADOR)
# ==========================================================

@router.post(
    "",
    response_model=ProductoOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def create_producto(
    payload: ProductoCreate,
    service: ProductosService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.create_producto(**payload.model_dump())
        auditor.log(
            modulo=AuditModulo.PRODUCTOS,
            accion=AuditAccion.CREATE,
            entidad="productos",
            entidad_id=result["producto_id"],
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


@router.patch(
    "/{producto_id}",
    response_model=ProductoOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def update_producto(
    producto_id: int,
    payload: ProductoUpdate,
    service: ProductosService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        data = payload.model_dump(exclude_unset=True)
        result = service.update_producto(producto_id, data)
        auditor.log(
            modulo=AuditModulo.PRODUCTOS,
            accion=AuditAccion.UPDATE,
            entidad="productos",
            entidad_id=producto_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


# ==========================================================
# PRESENTACIONES (unidad de compra → factor a stock)
# ==========================================================

@router.get("/{producto_id}/presentaciones", response_model=PresentacionListResponse)
def list_presentaciones(
    producto_id: int,
    service: ProductosService = Depends(get_service),
):
    try:
        return {"items": service.list_presentaciones(producto_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/{producto_id}/presentaciones",
    response_model=PresentacionOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def create_presentacion(
    producto_id: int,
    payload: PresentacionCreate,
    service: ProductosService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.create_presentacion(producto_id, **payload.model_dump())
        auditor.log(
            modulo=AuditModulo.PRODUCTOS,
            accion=AuditAccion.CREATE,
            entidad="producto_presentacion",
            entidad_id=result["presentacion_id"],
            detalle=f"producto_id={producto_id}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


def _status_for(detail: str) -> int:
    if detail == ProductosService.NO_ENCONTRADO:
        return 404
    if detail == ProductosService.DUPLICADO:
        return 409
    if detail == ProductosService.TIPO_INVALIDO:
        return 422
    return 400
