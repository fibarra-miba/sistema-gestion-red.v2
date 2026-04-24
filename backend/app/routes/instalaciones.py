# app/routes/instalaciones.py

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db import get_db
from app.repositories.contratos_repo import ContractRepository
from app.repositories.instalaciones_repo import InstalacionesRepository
from app.schemas.instalacion import (
    ProgramacionInstalacionCreate,
    ProgramacionInstalacionResponse,
    ProgramacionInstalacionListResponse,
    ReprogramarInstalacionIn,
    ReprogramacionInstalacionResponse,
    ReprogramacionInstalacionListResponse,
    ReintentarInstalacionIn,
    EjecutarProgramacionIn,
    InstalacionCreate,
    InstalacionResponse,
    InstalacionListResponse,
    InstalacionAccionOut,
    DetalleInstalacionCreate,
    DetalleInstalacionResponse,
    DetalleInstalacionListResponse,
    GarantiaCreate,
    GarantiaResponse,
)
from app.services.instalaciones_service import InstalacionesService
from app.dependencies.auth import require_roles


## router = APIRouter(prefix="/instalaciones", tags=["Instalaciones"])
router = APIRouter(
    prefix="/instalaciones",
    tags=["Instalaciones"],
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR", "TECNICO"))],
)


def get_service(conn=Depends(get_db)) -> InstalacionesService:
    contratos_repo = ContractRepository(conn)
    instalaciones_repo = InstalacionesRepository(conn)
    return InstalacionesService(contratos_repo, instalaciones_repo)


# ==========================================================
# PROGRAMACION
# ==========================================================

@router.post("/programaciones-instalacion", response_model=ProgramacionInstalacionResponse)
def crear_programacion(
    payload: ProgramacionInstalacionCreate,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.crear_programacion(**payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/programaciones-instalacion/{programacion_id}", response_model=ProgramacionInstalacionResponse)
def get_programacion(
    programacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.get_programacion(programacion_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/programaciones-instalacion", response_model=ProgramacionInstalacionListResponse)
def list_programaciones(
    contrato_id: Optional[int] = Query(None),
    domicilio_id: Optional[int] = Query(None),
    estado_programacion_id: Optional[int] = Query(None),
    tecnico_pinstalacion: Optional[str] = Query(None),
    service: InstalacionesService = Depends(get_service),
):
    items = service.list_programaciones(
        contrato_id=contrato_id,
        domicilio_id=domicilio_id,
        estado_programacion_id=estado_programacion_id,
        tecnico_pinstalacion=tecnico_pinstalacion,
    )
    return {"items": items}


@router.post(
    "/programaciones-instalacion/{programacion_id}/reprogramar",
    response_model=ReprogramacionInstalacionResponse,
)
def reprogramar(
    programacion_id: int,
    payload: ReprogramarInstalacionIn,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.reprogramar(programacion_id, **payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/programaciones-instalacion/{programacion_id}/reprogramaciones",
    response_model=ReprogramacionInstalacionListResponse,
)
def list_reprogramaciones(
    programacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        items = service.list_reprogramaciones(programacion_id)
        return {"items": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/programaciones-instalacion/{programacion_id}/ejecutar",
    response_model=InstalacionResponse,
)
def ejecutar_programacion(
    programacion_id: int,
    payload: EjecutarProgramacionIn,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.ejecutar_programacion(
            programacion_id=programacion_id,
            codigo_instalacion=payload.codigo_instalacion,
            observacion_instalacion=payload.observacion_instalacion,
            fecha_instalacion=payload.fecha_instalacion,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================================
# INSTALACIONES
# ==========================================================

@router.post("", response_model=InstalacionResponse)
def crear_instalacion(
    payload: InstalacionCreate,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.crear_instalacion(**payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{instalacion_id}", response_model=InstalacionResponse)
def get_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.get_instalacion(instalacion_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("", response_model=InstalacionListResponse)
def list_instalaciones(
    contrato_id: Optional[int] = Query(None),
    domicilio_id: Optional[int] = Query(None),
    estado_instalacion_id: Optional[int] = Query(None),
    programacion_id: Optional[int] = Query(None),
    service: InstalacionesService = Depends(get_service),
):
    items = service.list_instalaciones(
        contrato_id=contrato_id,
        domicilio_id=domicilio_id,
        estado_instalacion_id=estado_instalacion_id,
        programacion_id=programacion_id,
    )
    return {"items": items}


@router.post("/{instalacion_id}/completar", response_model=InstalacionAccionOut)
def completar_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.completar_instalacion(instalacion_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{instalacion_id}/cancelar", response_model=InstalacionAccionOut)
def cancelar_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.cancelar_instalacion(instalacion_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{instalacion_id}/fallar", response_model=InstalacionAccionOut)
def fallar_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.fallar_instalacion(instalacion_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{instalacion_id}/dar-baja", response_model=InstalacionAccionOut)
def dar_baja_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.dar_baja_instalacion(instalacion_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{instalacion_id}/reintentar",
    response_model=ProgramacionInstalacionResponse,
)
def reintentar_instalacion(
    instalacion_id: int,
    payload: ReintentarInstalacionIn,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.reintentar_instalacion(
            instalacion_id=instalacion_id,
            **payload.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================================
# DETALLE INSTALACION
# ==========================================================

@router.post("/{instalacion_id}/detalles", response_model=DetalleInstalacionResponse)
def crear_detalle(
    instalacion_id: int,
    payload: DetalleInstalacionCreate,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.crear_detalle_instalacion(
            instalacion_id=instalacion_id,
            **payload.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{instalacion_id}/detalles", response_model=DetalleInstalacionListResponse)
def list_detalles(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
):
    items = service.list_detalles_instalacion(instalacion_id)
    return {"items": items}


# ==========================================================
# GARANTIA (MINIMO)
# ==========================================================

@router.post("/garantias", response_model=GarantiaResponse)
def crear_garantia(
    payload: GarantiaCreate,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.crear_garantia(**payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/garantias/{garantia_id}", response_model=GarantiaResponse)
def get_garantia(
    garantia_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.get_garantia(garantia_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
