# app/routes/contratos.py

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from app.db import get_db
from app.repositories.contratos_repo import ContractRepository
from app.repositories.instalaciones_repo import InstalacionesRepository
from app.services.contratos_service import ContractService
from app.dependencies.auth import require_roles
from app.schemas.contrato import (
    ContractCreate,
    ContractResponse,
    ContractCommercialResponse,
    ContractCommercialListResponse,
    ContractChangePlan,
    ContractConfirmTechnicalCondition,
)


## router = APIRouter(prefix="/contratos", tags=["Contratos"])
router = APIRouter(
    prefix="/contratos",
    tags=["Contratos"],
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)


def get_service(conn: Connection = Depends(get_db)) -> ContractService:
    repo = ContractRepository(conn)
    return ContractService(repo)


@router.post("", response_model=ContractResponse)
def create_contract(
    payload: ContractCreate,
    service: ContractService = Depends(get_service),
):
    try:
        contract = service.create_contract(
            cliente_id=payload.cliente_id,
            domicilio_id=payload.domicilio_id,
            plan_id=payload.plan_id,
        )
        return contract
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{contract_id}", response_model=ContractCommercialResponse)
def get_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
):
    try:
        return service.get_contract_commercial(contract_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("", response_model=ContractCommercialListResponse)
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


@router.post("/{contract_id}/activate")
def activate_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
):
    try:
        service.activate(contract_id)
        return {"message": "Contrato activado."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{contract_id}/suspend")
def suspend_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
):
    try:
        service.suspend(contract_id)
        return {"message": "Contrato suspendido."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{contract_id}/resume")
def resume_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
):
    try:
        service.resume(contract_id)
        return {"message": "Contrato reanudado."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{contract_id}/cancel")
def cancel_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
):
    try:
        service.cancel(contract_id)
        return {"message": "Contrato cancelado."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{contract_id}/terminate")
def terminate_contract(
    contract_id: int,
    service: ContractService = Depends(get_service),
):
    try:
        service.terminate(contract_id)
        return {"message": "Contrato dado de baja."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{contract_id}/change-plan", response_model=ContractResponse)
def change_plan(
    contract_id: int,
    payload: ContractChangePlan,
    service: ContractService = Depends(get_service),
):
    try:
        new_contract = service.change_plan(contract_id, payload.new_plan_id)
        return new_contract
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{contrato_id}/confirmar-condicion-tecnica")
def confirmar_condicion_tecnica(
    contrato_id: int,
    payload: ContractConfirmTechnicalCondition,
    conn=Depends(get_db),
):
    try:
        repo = ContractRepository(conn)
        instalaciones_repo = InstalacionesRepository(conn)
        service = ContractService(repo, instalaciones_repo)

        return service.confirmar_condicion_tecnica(
            contrato_id=contrato_id,
            **payload.model_dump(),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
