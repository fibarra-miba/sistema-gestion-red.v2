from __future__ import annotations

from fastapi import Depends, Request
from psycopg import Connection

from app.db import get_db
from app.dependencies.auth import get_current_session
from app.repositories.auditoria_repo import AuditRepository
from app.services.auditoria import AuditActor, Auditor


def client_ip(request: Request) -> str | None:
    if not request.client:
        return None
    return request.client.host


def user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def get_auditor(
    request: Request,
    session: dict = Depends(get_current_session),
    conn: Connection = Depends(get_db),
) -> Auditor:
    """Auditor por request, ligado al actor (sesión + Request) y a la conexión.

    Comparte la conexión de get_db con la operación de negocio: el evento
    commitea junto con ella.
    """
    actor = AuditActor(
        usuario_id=session["usuario_id"],
        ip_origen=client_ip(request),
        user_agent=user_agent(request),
    )
    return Auditor(AuditRepository(conn), actor)
