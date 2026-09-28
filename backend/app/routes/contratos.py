# app/routes/contratos.py

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_db
from app.repositories.contratos_repo import ContractRepository
from app.repositories.instalaciones_repo import InstalacionesRepository
from app.services.contratos_service import ContractService
from app.dependencies.auth import require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion
from app.schemas.contrato import (
    ContractCreate,
    ContractResponse,
    ContractCommercialResponse,
    ContractCommercialListResponse,
    ContractChangePlan,
    ContractProgramarInstalacion,
    ContractAssignPromo,
    ContratosResumenOut,
)


## router = APIRouter(prefix="/contratos", tags=["Contratos"])

# Lectura: además de ADMIN/OPERADOR, COBRANZAS necesita listar/ver contratos
# para operar pagos (selector de contrato). Escritura y transiciones de estado:
# siguen restringidas a ADMIN/OPERADOR.
READ_ROLES = ("ADMIN", "OPERADOR", "COBRANZAS")
WRITE_ROLES = ("ADMIN", "OPERADOR")

router = APIRouter(
    prefix="/contratos",
    tags=["Contratos"],
)


def get_service(conn: Connection = Depends(get_db)) -> ContractService:
    repo = ContractRepository(conn)
    instalaciones_repo = InstalacionesRepository(conn)
    return ContractService(repo, instalaciones_repo)


@router.post(
    "",
    response_model=ContractResponse,
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def create_contract(
    payload: ContractCreate,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        contract = service.create_contract(
            cliente_id=payload.cliente_id,
            domicilio_id=payload.domicilio_id,
            plan_id=payload.plan_id,
            promocion_id=payload.promocion_id,
        )
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.CREATE,
            entidad="contratos",
            entidad_id=contract["contrato_id"],
            detalle=f"cliente_id={payload.cliente_id} plan_id={payload.plan_id}",
        )
        return contract
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/resumen",
    response_model=ContratosResumenOut,
    dependencies=[Depends(require_roles(*READ_ROLES))],
)
def get_contratos_resumen(
    service: ContractService = Depends(get_service),
):
    return service.resumen()


@router.get(
    "/{contract_id}",
    response_model=ContractCommercialResponse,
    dependencies=[Depends(require_roles(*READ_ROLES))],
)
def get_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
):
    try:
        return service.get_contract_commercial(contract_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "",
    response_model=ContractCommercialListResponse,
    dependencies=[Depends(require_roles(*READ_ROLES))],
)
def list_contracts(
    cliente_id: int | None = Query(default=None),
    estado_contrato_id: int | None = Query(default=None),
    plan_id: int | None = Query(default=None),
    domicilio_id: int | None = Query(default=None),
    service: ContractService = Depends(get_service),
):
    contracts = service.list_contracts(
        cliente_id=cliente_id,
        estado_contrato_id=estado_contrato_id,
        plan_id=plan_id,
        domicilio_id=domicilio_id,
    )
    return {"items": contracts}


@router.post(
    "/{contract_id}/activate",
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def activate_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        service.activate(contract_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.ACTIVATE,
            entidad="contratos",
            entidad_id=contract_id,
        )
        return {"message": "Contrato activado."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contract_id}/suspend",
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def suspend_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        service.suspend(contract_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.SUSPEND,
            entidad="contratos",
            entidad_id=contract_id,
        )
        return {"message": "Contrato suspendido."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contract_id}/resume",
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def resume_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        service.resume(contract_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.RESUME,
            entidad="contratos",
            entidad_id=contract_id,
        )
        return {"message": "Contrato reanudado."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contract_id}/cancel",
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def cancel_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        service.cancel(contract_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.CANCEL,
            entidad="contratos",
            entidad_id=contract_id,
        )
        return {"message": "Contrato cancelado."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contract_id}/terminate",
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def terminate_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        service.terminate(contract_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.TERMINATE,
            entidad="contratos",
            entidad_id=contract_id,
        )
        return {"message": "Contrato dado de baja."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contract_id}/change-plan",
    response_model=ContractResponse,
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def change_plan(
    contract_id: int,
    payload: ContractChangePlan,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        new_contract = service.change_plan(contract_id, payload.new_plan_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.CHANGE_PLAN,
            entidad="contratos",
            entidad_id=contract_id,
            detalle=f"new_plan_id={payload.new_plan_id} new_contrato_id={new_contract['contrato_id']}",
        )
        return new_contract
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contract_id}/asignar-promocion",
    response_model=ContractResponse,
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def asignar_promocion(
    contract_id: int,
    payload: ContractAssignPromo,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.asignar_promocion(contract_id, payload.promocion_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.ASSIGN_PROMO,
            entidad="contratos",
            entidad_id=contract_id,
            detalle=f"promocion_id={payload.promocion_id}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contract_id}/quitar-promocion",
    response_model=ContractResponse,
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def quitar_promocion(
    contract_id: int,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.quitar_promocion(contract_id)
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.REMOVE_PROMO,
            entidad="contratos",
            entidad_id=contract_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{contrato_id}/programar-instalacion",
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def programar_instalacion(
    contrato_id: int,
    payload: ContractProgramarInstalacion,
    service: ContractService = Depends(get_service),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = service.programar_instalacion(
            contrato_id=contrato_id,
            **payload.model_dump(),
        )
        auditor.log(
            modulo=AuditModulo.CONTRATOS,
            accion=AuditAccion.PROG_CREATE,
            entidad="contratos",
            entidad_id=contrato_id,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
