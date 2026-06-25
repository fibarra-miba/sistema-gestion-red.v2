# app/routes/clientes.py

from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import List, Optional
import logging
import psycopg
from psycopg.errors import (
    UniqueViolation,
    ForeignKeyViolation,
    NotNullViolation,
    CheckViolation,
)
from app.db import get_db
from app.schemas.cliente import ClienteOut, ClienteCreate, ClienteUpdate, ClientesResumenOut
from app.services.clientes_service import ClienteService
from app.schemas.cliente_onboarding import ClienteOnboardingCreate
from app.dependencies.auth import require_roles
from app.dependencies.audit import get_auditor
from app.services.auditoria import Auditor, AuditModulo, AuditAccion

logger = logging.getLogger("uvicorn.error")

# Lectura: además de ADMIN/OPERADOR, COBRANZAS necesita listar/ver clientes
# para operar la cuenta corriente y los pagos (selectores cruzados).
# Escritura (alta/edición): sigue restringida a ADMIN/OPERADOR.
READ_ROLES = ("ADMIN", "OPERADOR", "COBRANZAS")
WRITE_ROLES = ("ADMIN", "OPERADOR")

## router = APIRouter(prefix="/clientes", tags=["clientes"])
router = APIRouter(
    prefix="/clientes",
    tags=["clientes"],
)


@router.get(
    "",
    response_model=List[ClienteOut],
    dependencies=[Depends(require_roles(*READ_ROLES))],
)
def get_clientes(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: Optional[str] = Query(default=None),
    conn: psycopg.Connection = Depends(get_db),
):
    try:
        return ClienteService.listar(conn, limit, offset, search)
    except Exception:
        logger.exception("Error fetching clientes")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/resumen",
    response_model=ClientesResumenOut,
    dependencies=[Depends(require_roles(*READ_ROLES))],
)
def get_clientes_resumen(
    conn: psycopg.Connection = Depends(get_db),
):
    try:
        return ClienteService.resumen(conn)
    except Exception:
        logger.exception("Error fetching clientes resumen")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/{cliente_id}",
    response_model=ClienteOut,
    dependencies=[Depends(require_roles(*READ_ROLES))],
)
def get_cliente(
    cliente_id: int = Path(..., ge=1),
    conn: psycopg.Connection = Depends(get_db),
):
    try:
        return ClienteService.obtener(conn, cliente_id)
    except ValueError as e:
        if str(e) == "CLIENTE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Cliente not found")
        raise
    except Exception:
        logger.exception("Error fetching cliente")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "",
    response_model=ClienteOut,
    status_code=201,
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def create_cliente(
    cliente: ClienteCreate,
    conn: psycopg.Connection = Depends(get_db),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = ClienteService.crear_cliente(conn, cliente.model_dump())
        auditor.log(
            modulo=AuditModulo.CLIENTES,
            accion=AuditAccion.CREATE,
            entidad="clientes",
            entidad_id=result["cliente_id"],
        )
        return result
    except UniqueViolation:
        raise HTTPException(status_code=409, detail="Cliente with this DNI already exists")
    except (ForeignKeyViolation, NotNullViolation, CheckViolation) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Datos inválidos: {e.diag.message_primary}",
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        logger.exception("Error creating cliente")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/onboarding",
    response_model=ClienteOut,
    status_code=201,
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def onboarding_cliente(
    data: ClienteOnboardingCreate,
    conn: psycopg.Connection = Depends(get_db),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = ClienteService.onboarding(
            conn,
            data.model_dump()
        )
        auditor.log(
            modulo=AuditModulo.CLIENTES,
            accion=AuditAccion.ONBOARDING,
            entidad="clientes",
            entidad_id=result["cliente_id"],
        )
        return result
    except UniqueViolation:
        raise HTTPException(status_code=409, detail="Cliente duplicado")
    except (ForeignKeyViolation, NotNullViolation, CheckViolation) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Datos inválidos: {e.diag.message_primary}",
        )
    except Exception:
        logger.exception("Error onboarding cliente")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put(
    "/{cliente_id}",
    response_model=ClienteOut,
    dependencies=[Depends(require_roles(*WRITE_ROLES))],
)
def update_cliente(
    cliente_id: int = Path(..., ge=1),
    cliente: ClienteUpdate = ...,
    conn: psycopg.Connection = Depends(get_db),
    auditor: Auditor = Depends(get_auditor),
):
    try:
        result = ClienteService.actualizar_cliente(
            conn,
            cliente_id,
            cliente.model_dump()
        )
        auditor.log(
            modulo=AuditModulo.CLIENTES,
            accion=AuditAccion.UPDATE,
            entidad="clientes",
            entidad_id=cliente_id,
        )
        return result
    except ValueError as e:
        if str(e) == "CLIENTE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Cliente not found")
        raise
    except UniqueViolation:
        raise HTTPException(status_code=409, detail="Cliente duplicado (DNI)")
    except (ForeignKeyViolation, NotNullViolation, CheckViolation) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Datos inválidos: {e.diag.message_primary}",
        )
    except Exception:
        logger.exception("Error updating cliente")
        raise HTTPException(status_code=500, detail="Internal server error")
