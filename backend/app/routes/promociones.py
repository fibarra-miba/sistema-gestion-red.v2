# app/routes/promociones.py

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_db
from app.repositories.promociones_repo import PromocionesRepo
from app.services.promociones_service import PromocionesService
from app.dependencies.auth import require_roles
from app.schemas.promocion import (
    PromocionCreate,
    PromocionUpdate,
    PromocionOut,
    PromocionListResponse,
)


# Promociones = configuración comercial. Lectura y escritura: ADMIN / OPERADOR.
router = APIRouter(
    prefix="/promociones",
    tags=["Promociones"],
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)


def get_service(conn: Connection = Depends(get_db)) -> PromocionesService:
    return PromocionesService(PromocionesRepo(conn))


def _status_for(detail: str) -> int:
    if detail == PromocionesService.NO_ENCONTRADA:
        return 404
    if detail in (
        PromocionesService.TIPO_INVALIDO,
        PromocionesService.INCONSISTENTE,
        PromocionesService.FECHAS,
    ):
        return 422
    return 400


# ==========================================================
# READ
# ==========================================================

@router.get("", response_model=PromocionListResponse)
def list_promociones(
    activo: Optional[bool] = Query(default=None),
    tipo_promo_id: Optional[int] = Query(default=None, ge=1),
    vigentes: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: PromocionesService = Depends(get_service),
):
    return {
        "items": service.list_promociones(
            activo=activo,
            tipo_promo_id=tipo_promo_id,
            vigentes=vigentes,
            limit=limit,
            offset=offset,
        )
    }


@router.get("/{promocion_id}", response_model=PromocionOut)
def get_promocion(
    promocion_id: int,
    service: PromocionesService = Depends(get_service),
):
    try:
        return service.get_promocion(promocion_id)
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


# ==========================================================
# CREATE / UPDATE
# ==========================================================

@router.post("", response_model=PromocionOut)
def create_promocion(
    payload: PromocionCreate,
    service: PromocionesService = Depends(get_service),
):
    try:
        return service.create_promocion(payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))


@router.patch("/{promocion_id}", response_model=PromocionOut)
def update_promocion(
    promocion_id: int,
    payload: PromocionUpdate,
    service: PromocionesService = Depends(get_service),
):
    try:
        return service.update_promocion(promocion_id, payload.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=_status_for(str(e)), detail=str(e))
