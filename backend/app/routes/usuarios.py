from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from psycopg import Connection
from psycopg.errors import UniqueViolation

from app.db import get_db
from app.dependencies.auth import require_roles
from app.repositories.usuarios_repo import UsuariosRepository
from app.schemas.auth import MessageResponse
from app.schemas.usuario import RolOut, UsuarioCreate, UsuarioOut, UsuarioUpdate
from app.services.usuarios_service import UsuariosService

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(require_roles("ADMIN"))],
)


def _client_ip(request: Request) -> str | None:
    if not request.client:
        return None
    return request.client.host


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def _service(conn: Connection) -> UsuariosService:
    return UsuariosService(UsuariosRepository(conn))


@router.get("", response_model=list[UsuarioOut])
def list_usuarios(conn: Connection = Depends(get_db)):
    return _service(conn).list_usuarios()


@router.get("/roles", response_model=list[RolOut])
def list_roles(conn: Connection = Depends(get_db)):
    return _service(conn).list_roles()


@router.get("/{usuario_id}", response_model=UsuarioOut)
def get_usuario(usuario_id: int, conn: Connection = Depends(get_db)):
    try:
        return _service(conn).get_usuario(usuario_id)
    except ValueError as e:
        if str(e) == "USUARIO_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        raise


@router.post("", response_model=UsuarioOut, status_code=201)
def create_usuario(
    payload: UsuarioCreate,
    request: Request,
    actor: dict = Depends(require_roles("ADMIN")),
    conn: Connection = Depends(get_db),
):
    try:
        return _service(conn).create_usuario(
            payload.model_dump(),
            actor=actor,
            ip_origen=_client_ip(request),
            user_agent=_user_agent(request),
        )
    except ValueError as e:
        if str(e) == "ROL_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Rol no encontrado.")
        raise HTTPException(status_code=400, detail=str(e))
    except UniqueViolation:
        raise HTTPException(status_code=409, detail="Username o email ya existente.")


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def update_usuario(
    usuario_id: int,
    payload: UsuarioUpdate,
    request: Request,
    actor: dict = Depends(require_roles("ADMIN")),
    conn: Connection = Depends(get_db),
):
    try:
        return _service(conn).update_usuario(
            usuario_id=usuario_id,
            payload=payload.model_dump(exclude_unset=True),
            actor=actor,
            ip_origen=_client_ip(request),
            user_agent=_user_agent(request),
        )
    except ValueError as e:
        detail = str(e)
        if detail == "USUARIO_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        if detail == "ROL_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Rol no encontrado.")
        raise HTTPException(status_code=400, detail=detail)
    except UniqueViolation:
        raise HTTPException(status_code=409, detail="Username o email ya existente.")


@router.post("/{usuario_id}/reset-password", response_model=MessageResponse)
def reset_password(
    usuario_id: int,
    request: Request,
    actor: dict = Depends(require_roles("ADMIN")),
    conn: Connection = Depends(get_db),
):
    try:
        _service(conn).reset_password(
            usuario_id=usuario_id,
            actor=actor,
            ip_origen=_client_ip(request),
            user_agent=_user_agent(request),
        )
        return {"message": "Contraseña reseteada a Inicio.01 y cambio obligatorio activado."}
    except ValueError as e:
        if str(e) == "USUARIO_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        raise
