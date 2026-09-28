# app/routes/instalaciones.py

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db import get_db
from app.repositories.contratos_repo import ContractRepository
from app.repositories.instalaciones_repo import InstalacionesRepository
from app.repositories.stock_repo import StockRepository
from app.services.stock_service import StockService
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
    InstalacionUpdate,
    InstalacionResponse,
    InstalacionListResponse,
    InstalacionAccionOut,
    DetalleInstalacionCreate,
    DetalleInstalacionResponse,
    DetalleInstalacionListResponse,
    GarantiaCreate,
    GarantiaUpdate,
    GarantiaOut,
    GarantiaListResponse,
    GarantiasResumenOut,
    InstalacionesResumenOut,
)
from app.services.instalaciones_service import InstalacionesService
from app.dependencies.auth import require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion


## router = APIRouter(prefix="/instalaciones", tags=["Instalaciones"])
router = APIRouter(
    prefix="/instalaciones",
    tags=["Instalaciones"],
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR", "TECNICO"))],
)


def get_service(conn=Depends(get_db)) -> InstalacionesService:
    contratos_repo = ContractRepository(conn)
    instalaciones_repo = InstalacionesRepository(conn)
    stock_service = StockService(StockRepository(conn))
    return InstalacionesService(contratos_repo, instalaciones_repo, stock_service)


# ==========================================================
# RESUMEN (DASHBOARD)
# ==========================================================

@router.get("/resumen", response_model=InstalacionesResumenOut)
def get_instalaciones_resumen(
    service: InstalacionesService = Depends(get_service),
):
    return service.resumen()


# ==========================================================
# PROGRAMACION
# ==========================================================

@router.post("/programaciones-instalacion", response_model=ProgramacionInstalacionResponse)
def crear_programacion(
    payload: ProgramacionInstalacionCreate,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.crear_programacion(**payload.model_dump())
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.PROG_CREATE,
            entidad="programaciones_instalacion",
            entidad_id=result["programacion_id"],
        )
        return result
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
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.reprogramar(programacion_id, **payload.model_dump())
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.REPROGRAM,
            entidad="programaciones_instalacion",
            entidad_id=programacion_id,
            detalle=f"reprogramacion_id={result['reprogramacion_id']}",
        )
        return result
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
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.ejecutar_programacion(
            programacion_id=programacion_id,
            codigo_instalacion=payload.codigo_instalacion,
            observacion_instalacion=payload.observacion_instalacion,
            fecha_instalacion=payload.fecha_instalacion,
        )
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.EXECUTE,
            entidad="instalaciones",
            entidad_id=result["instalacion_id"],
            detalle=f"programacion_id={programacion_id}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================================
# INSTALACIONES
# ==========================================================

@router.post("", response_model=InstalacionResponse)
def crear_instalacion(
    payload: InstalacionCreate,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.crear_instalacion(**payload.model_dump())
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.CREATE,
            entidad="instalaciones",
            entidad_id=result["instalacion_id"],
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Declarada antes de /{instalacion_id} para que la ruta paramétrica no capture
# el path estático "garantias". (Sección Garantía más abajo para POST/GET/PATCH.)
@router.get("/garantias", response_model=GarantiaListResponse)
def list_garantias(
    instalacion_id: Optional[int] = Query(default=None, ge=1),
    contrato_id: Optional[int] = Query(default=None, ge=1),
    estado_garantia_id: Optional[int] = Query(default=None, ge=1),
    cliente_id: Optional[int] = Query(default=None, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: InstalacionesService = Depends(get_service),
):
    return {
        "items": service.list_garantias(
            instalacion_id=instalacion_id,
            contrato_id=contrato_id,
            estado_garantia_id=estado_garantia_id,
            cliente_id=cliente_id,
            limit=limit,
            offset=offset,
        )
    }


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


@router.patch(
    "/{instalacion_id}",
    response_model=InstalacionResponse,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def update_instalacion(
    instalacion_id: int,
    payload: InstalacionUpdate,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        data = payload.model_dump(exclude_unset=True)
        result = service.update_instalacion(instalacion_id, data)
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.UPDATE,
            entidad="instalaciones",
            entidad_id=instalacion_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_instalacion_status(str(e)), detail=str(e))


def _instalacion_status(detail: str) -> int:
    if detail == InstalacionesService.INSTALACION_NO_ENCONTRADA:
        return 404
    return 422


@router.post("/{instalacion_id}/completar", response_model=InstalacionAccionOut)
def completar_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.completar_instalacion(instalacion_id)
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.COMPLETE,
            entidad="instalaciones",
            entidad_id=instalacion_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{instalacion_id}/cancelar", response_model=InstalacionAccionOut)
def cancelar_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.cancelar_instalacion(instalacion_id)
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.CANCEL,
            entidad="instalaciones",
            entidad_id=instalacion_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{instalacion_id}/fallar", response_model=InstalacionAccionOut)
def fallar_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.fallar_instalacion(instalacion_id)
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.FAIL,
            entidad="instalaciones",
            entidad_id=instalacion_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{instalacion_id}/dar-baja", response_model=InstalacionAccionOut)
def dar_baja_instalacion(
    instalacion_id: int,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.dar_baja_instalacion(instalacion_id)
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.BAJA,
            entidad="instalaciones",
            entidad_id=instalacion_id,
        )
        return result
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
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.reintentar_instalacion(
            instalacion_id=instalacion_id,
            **payload.model_dump(),
        )
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.RETRY,
            entidad="instalaciones",
            entidad_id=instalacion_id,
            detalle=f"programacion_id={result['programacion_id']}",
        )
        return result
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
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.crear_detalle_instalacion(
            instalacion_id=instalacion_id,
            **payload.model_dump(),
        )
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.DETALLE_CREATE,
            entidad="detalle_instalacion",
            entidad_id=result["det_instalacion_id"],
            detalle=f"instalacion_id={instalacion_id}",
        )
        return result
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
# GARANTIA
# ==========================================================

# Ver garantías: cualquier rol del router (incl. TÉCNICO).
# Crear / anular: solo ADMIN / OPERADOR (es un acto administrativo).
# (El listado GET /garantias se declara antes de GET /{instalacion_id} para
#  evitar que la ruta paramétrica capture "garantias".)

@router.post(
    "/garantias",
    response_model=GarantiaOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def crear_garantia(
    payload: GarantiaCreate,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.crear_garantia(**payload.model_dump())
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.GARANTIA_CREATE,
            entidad="garantias",
            entidad_id=result["garantia_id"],
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_garantia_status(str(e)), detail=str(e))


# Declarada antes de /garantias/{garantia_id}: si fuera después, FastAPI
# intentaría parsear "resumen" como el int del path param y devolvería 422.
@router.get(
    "/garantias/resumen",
    response_model=GarantiasResumenOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def get_garantias_resumen(
    service: InstalacionesService = Depends(get_service),
):
    return service.resumen_garantias()


@router.get("/garantias/{garantia_id}", response_model=GarantiaOut)
def get_garantia(
    garantia_id: int,
    service: InstalacionesService = Depends(get_service),
):
    try:
        return service.get_garantia(garantia_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch(
    "/garantias/{garantia_id}",
    response_model=GarantiaOut,
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)
def update_garantia(
    garantia_id: int,
    payload: GarantiaUpdate,
    service: InstalacionesService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        data = payload.model_dump(exclude_unset=True)
        result = service.update_garantia(garantia_id, data)
        auditor.log(
            modulo=AuditModulo.INSTALACIONES,
            accion=AuditAccion.GARANTIA_UPDATE,
            entidad="garantias",
            entidad_id=garantia_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=_garantia_status(str(e)), detail=str(e))


def _garantia_status(detail: str) -> int:
    if detail == InstalacionesService.GARANTIA_NO_ENCONTRADA:
        return 404
    if detail == InstalacionesService.GARANTIA_ACTIVA_DUPLICADA:
        return 409
    if detail in (
        InstalacionesService.GARANTIA_PRODUCTO_NO_INSTALADO,
        InstalacionesService.GARANTIA_PRODUCTO_NO_EQUIPO,
        InstalacionesService.GARANTIA_ESTADO_INVALIDO,
        InstalacionesService.GARANTIA_RESOLUCION_REQUERIDA,
        InstalacionesService.GARANTIA_RESOLUCION_RETENCION_REQUERIDA,
        InstalacionesService.GARANTIA_FECHAS_INVALIDAS,
    ):
        return 422
    return 400
