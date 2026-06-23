from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.security import (
    SESSION_DURATION_HOURS,
    hash_password,
    hash_session_token,
    validate_password_policy,
    verify_password,
)
from app.repositories.auth_repo import AuthRepository


ROLE_CAPABILITIES: dict[str, dict[str, bool]] = {
    "ADMIN": {
        "can_manage_users": True,
        "can_manage_planes": True,
        "can_manage_clientes": True,
        "can_manage_domicilios": True,
        "can_manage_contratos": True,
        "can_manage_instalaciones": True,
        "can_manage_pagos": True,
        "can_manage_productos": True,
        "can_manage_promociones": True,
    },
    "OPERADOR": {
        "can_manage_users": False,
        "can_manage_planes": False,
        "can_manage_clientes": True,
        "can_manage_domicilios": True,
        "can_manage_contratos": True,
        "can_manage_instalaciones": True,
        "can_manage_pagos": False,
        "can_manage_productos": True,
        "can_manage_promociones": True,
    },
    "TECNICO": {
        "can_manage_users": False,
        "can_manage_planes": False,
        "can_manage_clientes": False,
        "can_manage_domicilios": False,
        "can_manage_contratos": False,
        "can_manage_instalaciones": True,
        "can_manage_pagos": False,
        "can_manage_productos": False,
        "can_manage_promociones": False,
    },
    "COBRANZAS": {
        "can_manage_users": False,
        "can_manage_planes": False,
        "can_manage_clientes": False,
        "can_manage_domicilios": False,
        "can_manage_contratos": False,
        "can_manage_instalaciones": False,
        "can_manage_pagos": True,
        "can_manage_productos": False,
        "can_manage_promociones": False,
    },
}


class AuthService:
    INVALID_CREDENTIALS = "Credenciales inválidas."

    def __init__(self, repo: AuthRepository):
        self.repo = repo

    def login(
        self,
        identifier: str,
        password: str,
        session_token: str,
        ip_origen: str | None,
        user_agent: str | None,
    ) -> dict[str, Any]:
        user = self.repo.get_user_by_identifier(identifier)

        if not user:
            self.repo.insert_audit_event(
                usuario_id=None,
                modulo_auditoria="AUTH",
                accion_auditoria="LOGIN_FAILURE",
                entidad_auditoria="usuarios",
                entidad_id_auditoria=None,
                detalle_auditoria=f"IDENTIFIER_NOT_FOUND:{identifier}",
                ip_origen_auditoria=ip_origen,
                user_agent_auditoria=user_agent,
            )
            raise ValueError(self.INVALID_CREDENTIALS)

        if not user["activo_usuario"]:
            self.repo.insert_audit_event(
                usuario_id=user["usuario_id"],
                modulo_auditoria="AUTH",
                accion_auditoria="LOGIN_FAILURE",
                entidad_auditoria="usuarios",
                entidad_id_auditoria=str(user["usuario_id"]),
                detalle_auditoria="USER_INACTIVE",
                ip_origen_auditoria=ip_origen,
                user_agent_auditoria=user_agent,
            )
            raise ValueError(self.INVALID_CREDENTIALS)

        if not verify_password(password, user["password_hash_usuario"]):
            self.repo.insert_audit_event(
                usuario_id=user["usuario_id"],
                modulo_auditoria="AUTH",
                accion_auditoria="LOGIN_FAILURE",
                entidad_auditoria="usuarios",
                entidad_id_auditoria=str(user["usuario_id"]),
                detalle_auditoria="INVALID_PASSWORD",
                ip_origen_auditoria=ip_origen,
                user_agent_auditoria=user_agent,
            )
            raise ValueError(self.INVALID_CREDENTIALS)

        expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_DURATION_HOURS)
        session = self.repo.create_session(
            usuario_id=user["usuario_id"],
            token_hash_sesion=hash_session_token(session_token),
            fecha_expiracion_sesion=expires_at,
            ip_origen_sesion=ip_origen,
            user_agent_sesion=user_agent,
        )
        self.repo.update_last_login(user["usuario_id"])
        self.repo.insert_audit_event(
            usuario_id=user["usuario_id"],
            modulo_auditoria="AUTH",
            accion_auditoria="LOGIN_SUCCESS",
            entidad_auditoria="usuarios",
            entidad_id_auditoria=str(user["usuario_id"]),
            detalle_auditoria=None,
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )

        return {
            "session": session,
            "user": self.build_me_payload(
                {
                    **user,
                    "ultimo_login_usuario": datetime.now(timezone.utc),
                }
            ),
        }

    def get_current_user_from_session_token(self, session_token: str) -> dict[str, Any]:
        session = self.repo.get_active_session_by_hash(hash_session_token(session_token))
        if not session:
            raise ValueError("SESSION_NOT_FOUND")

        if not session["activo_usuario"]:
            raise ValueError("USER_INACTIVE")

        return self.build_me_payload(session)

    def logout(
        self,
        sesion_id: int,
        usuario_id: int,
        ip_origen: str | None,
        user_agent: str | None,
    ) -> None:
        self.repo.revoke_session(sesion_id, "LOGOUT")
        self.repo.insert_audit_event(
            usuario_id=usuario_id,
            modulo_auditoria="AUTH",
            accion_auditoria="LOGOUT",
            entidad_auditoria="sesiones_usuarios",
            entidad_id_auditoria=str(sesion_id),
            detalle_auditoria=None,
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )

    def logout_all(
        self,
        usuario_id: int,
        sesion_actual_id: int | None,
        ip_origen: str | None,
        user_agent: str | None,
    ) -> None:
        self.repo.revoke_all_user_sessions(usuario_id, "LOGOUT_ALL")
        self.repo.insert_audit_event(
            usuario_id=usuario_id,
            modulo_auditoria="AUTH",
            accion_auditoria="LOGOUT_ALL",
            entidad_auditoria="usuarios",
            entidad_id_auditoria=str(usuario_id),
            detalle_auditoria=f"SESION_ACTUAL:{sesion_actual_id}" if sesion_actual_id else None,
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )

    def change_password(
        self,
        usuario_id: int,
        current_password: str,
        new_password: str,
        current_user: dict[str, Any],
        revoke_all_sessions: bool,
        ip_origen: str | None,
        user_agent: str | None,
        sesion_actual_id: int | None,
    ) -> None:
        full_user = self.repo.get_user_by_identifier(current_user["username_usuario"])
        if not full_user:
            raise ValueError("USER_NOT_FOUND")

        if not verify_password(current_password, full_user["password_hash_usuario"]):
            raise ValueError("CURRENT_PASSWORD_INVALID")

        validate_password_policy(new_password)

        if verify_password(new_password, full_user["password_hash_usuario"]):
            raise ValueError("NEW_PASSWORD_MUST_BE_DIFFERENT")

        new_hash = hash_password(new_password)
        self.repo.change_password(
            usuario_id=usuario_id,
            password_hash_usuario=new_hash,
            requiere_cambio_password_usuario=False,
        )

        if revoke_all_sessions:
            self.repo.revoke_all_user_sessions(usuario_id, "PASSWORD_CHANGED")
            if sesion_actual_id is not None:
                # la sesión actual también se invalida; el front vuelve a loguear
                pass

        self.repo.insert_audit_event(
            usuario_id=usuario_id,
            modulo_auditoria="AUTH",
            accion_auditoria="CHANGE_PASSWORD",
            entidad_auditoria="usuarios",
            entidad_id_auditoria=str(usuario_id),
            detalle_auditoria=f"REVOKE_ALL={revoke_all_sessions}",
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )

    @staticmethod
    def build_me_payload(user: dict[str, Any]) -> dict[str, Any]:
        codigo_rol = user["codigo_rol"]
        capabilities = ROLE_CAPABILITIES.get(codigo_rol, {})

        return {
            "usuario_id": user["usuario_id"],
            "username_usuario": user["username_usuario"],
            "email_usuario": user["email_usuario"],
            "nombre_usuario": user["nombre_usuario"],
            "apellido_usuario": user["apellido_usuario"],
            "activo_usuario": user["activo_usuario"],
            "requiere_cambio_password_usuario": user["requiere_cambio_password_usuario"],
            "ultimo_login_usuario": user.get("ultimo_login_usuario"),
            "rol": {
                "rol_id": user["rol_id"],
                "codigo_rol": user["codigo_rol"],
                "nombre_rol": user["nombre_rol"],
            },
            "capabilities": capabilities,
        }
