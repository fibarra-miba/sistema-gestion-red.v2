from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from psycopg import Connection

from app.core.security import (
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE,
    SESSION_DURATION_HOURS,
    generate_session_token,
)
from app.db import get_db
from app.dependencies.auth import get_current_session
from app.repositories.auth_repo import AuthRepository
from app.schemas.auth import (
    AuthMeResponse,
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


def _client_ip(request: Request) -> str | None:
    if not request.client:
        return None
    return request.client.host


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.post("/login", response_model=AuthMeResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    conn: Connection = Depends(get_db),
):
    service = AuthService(AuthRepository(conn))
    session_token = generate_session_token()

    try:
        result = service.login(
            identifier=payload.identifier,
            password=payload.password,
            session_token=session_token,
            ip_origen=_client_ip(request),
            user_agent=_user_agent(request),
        )
    except ValueError as e:
        conn.commit()
        raise HTTPException(status_code=401, detail=str(e))

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite=SESSION_COOKIE_SAMESITE,
        max_age=SESSION_DURATION_HOURS * 3600,
        path="/",
    )

    return result["user"]


@router.get("/me", response_model=AuthMeResponse)
def me(session: dict = Depends(get_current_session)):
    return {
        "usuario_id": session["usuario_id"],
        "username_usuario": session["username_usuario"],
        "email_usuario": session["email_usuario"],
        "nombre_usuario": session["nombre_usuario"],
        "apellido_usuario": session["apellido_usuario"],
        "activo_usuario": session["activo_usuario"],
        "requiere_cambio_password_usuario": session["requiere_cambio_password_usuario"],
        "ultimo_login_usuario": session.get("ultimo_login_usuario"),
        "rol": {
            "rol_id": session["rol_id"],
            "codigo_rol": session["codigo_rol"],
            "nombre_rol": session["nombre_rol"],
        },
        "capabilities": {
            "can_manage_users": session["codigo_rol"] == "ADMIN",
            "can_manage_planes": session["codigo_rol"] == "ADMIN",
            "can_manage_clientes": session["codigo_rol"] in ("ADMIN", "OPERADOR"),
            "can_manage_domicilios": session["codigo_rol"] in ("ADMIN", "OPERADOR"),
            "can_manage_contratos": session["codigo_rol"] in ("ADMIN", "OPERADOR"),
            "can_manage_instalaciones": session["codigo_rol"] in ("ADMIN", "OPERADOR", "TECNICO"),
            "can_manage_pagos": session["codigo_rol"] in ("ADMIN", "COBRANZAS"),
        },
    }


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    session: dict = Depends(get_current_session),
    conn: Connection = Depends(get_db),
):
    service = AuthService(AuthRepository(conn))
    service.logout(
        sesion_id=session["sesion_id"],
        usuario_id=session["usuario_id"],
        ip_origen=_client_ip(request),
        user_agent=_user_agent(request),
    )

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE,
    )
    return {"message": "Sesión cerrada correctamente."}


@router.post("/logout-all", response_model=MessageResponse)
def logout_all(
    request: Request,
    response: Response,
    session: dict = Depends(get_current_session),
    conn: Connection = Depends(get_db),
):
    service = AuthService(AuthRepository(conn))
    service.logout_all(
        usuario_id=session["usuario_id"],
        sesion_actual_id=session["sesion_id"],
        ip_origen=_client_ip(request),
        user_agent=_user_agent(request),
    )

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE,
    )
    return {"message": "Se cerraron todas las sesiones."}


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    session: dict = Depends(get_current_session),
    conn: Connection = Depends(get_db),
):
    service = AuthService(AuthRepository(conn))

    try:
        service.change_password(
            usuario_id=session["usuario_id"],
            current_password=payload.current_password,
            new_password=payload.new_password,
            current_user=session,
            revoke_all_sessions=payload.revoke_all_sessions,
            ip_origen=_client_ip(request),
            user_agent=_user_agent(request),
            sesion_actual_id=session["sesion_id"],
        )
    except ValueError as e:
        detail = str(e)
        if detail == "CURRENT_PASSWORD_INVALID":
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
        if detail == "NEW_PASSWORD_MUST_BE_DIFFERENT":
            raise HTTPException(status_code=400, detail="La nueva contraseña debe ser distinta a la actual.")
        raise HTTPException(status_code=400, detail=detail)

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE,
    )
    return {"message": "Contraseña actualizada. Debe iniciar sesión nuevamente."}
