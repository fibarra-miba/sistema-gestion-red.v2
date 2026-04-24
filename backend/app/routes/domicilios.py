from typing import List

import logging
import psycopg
from fastapi import APIRouter, Depends, HTTPException, Path
from psycopg.errors import ForeignKeyViolation, NotNullViolation, CheckViolation

from app.db import get_db
from app.schemas.domicilio import DomicilioCreate, DomicilioOut, DomicilioVigenteOut
from app.services.domicilios_service import DomicilioService
from app.dependencies.auth import require_roles

logger = logging.getLogger("uvicorn.error")
## router = APIRouter(prefix="/clientes", tags=["domicilios"])
router = APIRouter(
    prefix="/clientes",
    tags=["domicilios"],
    dependencies=[Depends(require_roles("ADMIN", "OPERADOR"))],
)


@router.get("/{cliente_id}/domicilios", response_model=List[DomicilioOut])
def list_domicilios_cliente(
    cliente_id: int = Path(..., ge=1),
    conn: psycopg.Connection = Depends(get_db),
):
    try:
        return DomicilioService.listar_historial(conn, cliente_id)
    except ValueError as e:
        if str(e) == "CLIENTE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Cliente not found")
        raise
    except Exception:
        logger.exception("Error listing domicilios")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{cliente_id}/domicilio-vigente", response_model=DomicilioVigenteOut)
def get_domicilio_vigente(
    cliente_id: int = Path(..., ge=1),
    conn: psycopg.Connection = Depends(get_db),
):
    try:
        return DomicilioService.obtener_domicilio_vigente(conn, cliente_id)
    except ValueError as e:
        if str(e) == "CLIENTE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Cliente not found")
        if str(e) == "DOMICILIO_VIGENTE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Domicilio vigente not found")
        raise
    except Exception:
        logger.exception("Error fetching domicilio vigente")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{cliente_id}/domicilios", response_model=DomicilioOut, status_code=201)
def create_domicilio_cliente(
    domicilio: DomicilioCreate,
    cliente_id: int = Path(..., ge=1),
    conn: psycopg.Connection = Depends(get_db),
):
    try:
        return DomicilioService.crear_nuevo_domicilio(
            conn,
            cliente_id,
            domicilio.model_dump()
        )
    except ValueError as e:
        if str(e) == "CLIENTE_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Cliente not found")
        if str(e) == "DOMICILIO_DATE_RANGE_INVALID":
            raise HTTPException(
                status_code=422,
                detail="fecha_hasta_dom no puede ser menor que fecha_desde_dom"
            )
        raise HTTPException(status_code=422, detail=str(e))
    except (ForeignKeyViolation, NotNullViolation, CheckViolation) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Datos inválidos: {e.diag.message_primary}",
        )
    except Exception:
        logger.exception("Error creating domicilio")
        raise HTTPException(status_code=500, detail="Internal server error")
