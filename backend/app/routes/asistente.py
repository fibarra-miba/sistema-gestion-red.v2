# app/routes/asistente.py
"""Fachada para el asistente de Telegram (docs/asistente.md).

`POST /asistente/sesion` es solo para la red interna (n8n → api): exige el
secreto compartido y rechaza lo que entra por Traefik. Las consultas usan la
sesión del usuario vinculado, con los mismos roles que sus equivalentes de la API.
Respuestas compactas a propósito: cada campo de más se paga en tokens.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from psycopg import Connection
from pydantic import BaseModel, Field

from app.db import get_db
from app.dependencies.audit import client_ip, user_agent
from app.dependencies.auth import require_authenticated_user, require_roles
from app.repositories.asistente_repo import AsistenteRepository
from app.repositories.auth_repo import AuthRepository
from app.services.asistente_service import AsistenteError, AsistenteService

router = APIRouter(prefix="/asistente", tags=["Asistente"])

# Mismos roles que las lecturas equivalentes de la API.
CLIENTES_ROLES = ("ADMIN", "OPERADOR", "COBRANZAS")
AGENDA_ROLES = ("ADMIN", "OPERADOR", "TECNICO")


class SesionIn(BaseModel):
    telegram_user_id: int = Field(..., gt=0)


def _service(conn: Connection) -> AsistenteService:
    return AsistenteService(AsistenteRepository(conn), AuthRepository(conn))


def _ejecutar(fn, *args) -> Any:
    try:
        return fn(*args)
    except AsistenteError as e:
        raise HTTPException(status_code=e.status, detail=e.detail)


@router.post("/sesion")
def crear_sesion(
    data: SesionIn,
    request: Request,
    x_asistente_secreto: str | None = Header(default=None),
    conn: Connection = Depends(get_db, scope="function"),
):
    return _ejecutar(
        _service(conn).emitir_sesion,
        data.telegram_user_id,
        x_asistente_secreto,
        "x-forwarded-for" in request.headers,
        client_ip(request),
        user_agent(request),
    )


@router.get("/clientes", dependencies=[Depends(require_roles(*CLIENTES_ROLES))])
def buscar_clientes(
    q: str = Query(..., max_length=100),
    conn: Connection = Depends(get_db, scope="function"),
):
    return _ejecutar(_service(conn).buscar_clientes, q)


@router.get("/clientes/{cliente_id}", dependencies=[Depends(require_roles(*CLIENTES_ROLES))])
def ficha_cliente(cliente_id: int, conn: Connection = Depends(get_db, scope="function")):
    return _ejecutar(_service(conn).ficha_cliente, cliente_id)


@router.get("/agenda", dependencies=[Depends(require_roles(*AGENDA_ROLES))])
def agenda(
    desde: date | None = None,
    hasta: date | None = None,
    conn: Connection = Depends(get_db, scope="function"),
):
    return _ejecutar(_service(conn).agenda, desde, hasta)


@router.get("/resumen", dependencies=[Depends(require_roles(*CLIENTES_ROLES))])
def resumen(conn: Connection = Depends(get_db, scope="function")):
    return _ejecutar(_service(conn).resumen)


@router.get("/planes", dependencies=[Depends(require_authenticated_user)])
def planes(conn: Connection = Depends(get_db, scope="function")):
    return _ejecutar(_service(conn).planes)
