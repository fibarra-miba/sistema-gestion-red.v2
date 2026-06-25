# app/routes/auditoria.py

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from psycopg import Connection

from app.db import get_db
from app.dependencies.auth import require_roles
from app.repositories.auditoria_repo import AuditRepository
from app.schemas.auditoria import AuditEventListResponse, AuditTiposOut
from app.services.auditoria import ACCIONES, MODULOS

# Visor de auditoría: lectura sensible, restringida a ADMIN.
router = APIRouter(
    prefix="/auditoria",
    tags=["Auditoría"],
    dependencies=[Depends(require_roles("ADMIN"))],
)


@router.get("/tipos", response_model=AuditTiposOut)
def get_tipos():
    # Listas canónicas para poblar los filtros del visor.
    return {"modulos": MODULOS, "acciones": ACCIONES}


@router.get("", response_model=AuditEventListResponse)
def list_auditoria(
    usuario_id: int | None = Query(default=None, ge=1),
    modulo: str | None = Query(default=None),
    accion: str | None = Query(default=None),
    entidad: str | None = Query(default=None),
    entidad_id: str | None = Query(default=None),
    desde: datetime | None = Query(default=None),
    hasta: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    conn: Connection = Depends(get_db),
):
    repo = AuditRepository(conn)
    filtros = dict(
        usuario_id=usuario_id,
        modulo=modulo,
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        desde=desde,
        hasta=hasta,
    )
    items = repo.list_events(**filtros, limit=limit, offset=offset)
    total = repo.count_events(**filtros)
    return {"items": items, "total": total}
