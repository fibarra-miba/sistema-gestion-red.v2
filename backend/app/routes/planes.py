# app/routes/planes.py

from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from app.db import get_db
from app.repositories.planes_repo import PlanesRepository
from app.repositories.precios_repo import PreciosRepo
from app.services.planes_service import PlanesService
from app.services.precios_service import PreciosPlanesService
from app.dependencies.auth import require_authenticated_user, require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion
from app.schemas.plan import (
    PlanCreate,
    PlanUpdate,
    PlanCommercialResponse,
    PlanListResponse,
    PlanPriceCreate,
    PlanPriceUpdate,
    PlanPriceResponse,
    PlanPriceListResponse,
)

## router = APIRouter(prefix="/planes", tags=["Planes"])
router = APIRouter(
    prefix="/planes",
    tags=["Planes"],
    dependencies=[Depends(require_authenticated_user)],
)


def get_planes_service(conn: Connection = Depends(get_db)) -> PlanesService:
    repo = PlanesRepository(conn)
    return PlanesService(repo)


def get_precios_service(conn: Connection = Depends(get_db)) -> PreciosPlanesService:
    planes_repo = PlanesRepository(conn)
    precios_repo = PreciosRepo(conn)
    return PreciosPlanesService(precios_repo, planes_repo)


# ==========================================================
# CREATE PLAN
# ==========================================================

@router.post("", response_model=PlanCommercialResponse, dependencies=[Depends(require_roles("ADMIN"))])
def create_plan(
    payload: PlanCreate,
    service: PlanesService = Depends(get_planes_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.create_plan(**payload.model_dump())
        auditor.log(
            modulo=AuditModulo.PLANES,
            accion=AuditAccion.CREATE,
            entidad="planes",
            entidad_id=result["plan_id"],
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================================
# READ PLANES
# ==========================================================

@router.get("/{plan_id}", response_model=PlanCommercialResponse)
def get_plan(
    plan_id: int,
    service: PlanesService = Depends(get_planes_service),
):
    try:
        return service.get_plan(plan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("", response_model=PlanListResponse)
def list_planes(service: PlanesService = Depends(get_planes_service)):
    return {"items": service.list_planes()}


# ==========================================================
# UPDATE PLAN
# ==========================================================

@router.patch("/{plan_id}", response_model=PlanCommercialResponse, dependencies=[Depends(require_roles("ADMIN"))])
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    service: PlanesService = Depends(get_planes_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        data = payload.model_dump(exclude_unset=True)
        result = service.update_plan(plan_id, data)
        auditor.log(
            modulo=AuditModulo.PLANES,
            accion=AuditAccion.UPDATE,
            entidad="planes",
            entidad_id=plan_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================================
# DELETE PLAN (LÓGICO)
# ==========================================================

@router.delete("/{plan_id}", dependencies=[Depends(require_roles("ADMIN"))])
def delete_plan(
    plan_id: int,
    service: PlanesService = Depends(get_planes_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        service.delete_plan(plan_id)
        auditor.log(
            modulo=AuditModulo.PLANES,
            accion=AuditAccion.DELETE,
            entidad="planes",
            entidad_id=plan_id,
        )
        return {"message": "Plan desactivado correctamente."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================================
# PRECIOS DEL PLAN
# ==========================================================

@router.get("/{plan_id}/precios", response_model=PlanPriceListResponse)
def list_plan_prices(
    plan_id: int,
    service: PreciosPlanesService = Depends(get_precios_service),
):
    try:
        return {"items": service.list_prices_by_plan(plan_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{plan_id}/precios", response_model=PlanPriceResponse, dependencies=[Depends(require_roles("ADMIN"))])
def create_plan_price(
    plan_id: int,
    payload: PlanPriceCreate,
    service: PreciosPlanesService = Depends(get_precios_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.create_price(
            plan_id=plan_id,
            **payload.model_dump(),
        )
        auditor.log(
            modulo=AuditModulo.PRECIOS,
            accion=AuditAccion.CREATE,
            entidad="precios_planes",
            entidad_id=result["precios_planes_id"],
            detalle=f"plan_id={plan_id}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{plan_id}/precios/{precios_planes_id}", response_model=PlanPriceResponse, dependencies=[Depends(require_roles("ADMIN"))])
def update_plan_price(
    plan_id: int,
    precios_planes_id: int,
    payload: PlanPriceUpdate,
    service: PreciosPlanesService = Depends(get_precios_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.update_price(
            plan_id=plan_id,
            precios_planes_id=precios_planes_id,
            data=payload.model_dump(exclude_unset=True),
        )
        auditor.log(
            modulo=AuditModulo.PRECIOS,
            accion=AuditAccion.UPDATE,
            entidad="precios_planes",
            entidad_id=precios_planes_id,
            detalle=f"plan_id={plan_id}",
        )
        return result
    except ValueError as e:
        detail = str(e)

        if detail in ("Plan no encontrado.", "Precio no encontrado."):
            raise HTTPException(status_code=404, detail=detail)

        raise HTTPException(status_code=400, detail=detail)
