from __future__ import annotations

from typing import Callable

from fastapi import Cookie, Depends, HTTPException
from psycopg import Connection

from app.core.security import SESSION_COOKIE_NAME, hash_session_token
from app.db import get_db
from app.repositories.auth_repo import AuthRepository


def get_current_session(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    conn: Connection = Depends(get_db),
) -> dict:
    if not session_token:
        raise HTTPException(status_code=401, detail="No autenticado.")

    repo = AuthRepository(conn)
    session = repo.get_active_session_by_hash(hash_session_token(session_token))

    if not session:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada.")

    if not session["activo_usuario"]:
        raise HTTPException(status_code=401, detail="Usuario inactivo.")

    return session


def get_current_user(session: dict = Depends(get_current_session)) -> dict:
    return session


def require_authenticated_user(session: dict = Depends(get_current_session)) -> dict:
    if session["requiere_cambio_password_usuario"]:
        raise HTTPException(
            status_code=403,
            detail="Debe cambiar su contraseña antes de continuar.",
        )
    return session


def require_roles(*allowed_roles: str) -> Callable:
    def dependency(session: dict = Depends(get_current_session)) -> dict:
        if session["requiere_cambio_password_usuario"]:
            raise HTTPException(
                status_code=403,
                detail="Debe cambiar su contraseña antes de continuar.",
            )

        if session["codigo_rol"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="No autorizado.")
        return session

    return dependency
