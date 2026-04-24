from __future__ import annotations

from typing import Any

from app.core.security import RESET_PASSWORD_DEFAULT, hash_password, validate_password_policy
from app.repositories.usuarios_repo import UsuariosRepository


class UsuariosService:
    def __init__(self, repo: UsuariosRepository):
        self.repo = repo

    def list_usuarios(self) -> list[dict[str, Any]]:
        return self.repo.list_usuarios()

    def get_usuario(self, usuario_id: int) -> dict[str, Any]:
        user = self.repo.get_usuario_by_id(usuario_id)
        if not user:
            raise ValueError("USUARIO_NOT_FOUND")
        return user

    def list_roles(self) -> list[dict[str, Any]]:
        return self.repo.list_roles()

    def create_usuario(
        self,
        payload: dict[str, Any],
        actor: dict[str, Any],
        ip_origen: str | None,
        user_agent: str | None,
    ) -> dict[str, Any]:
        role = self.repo.get_rol_by_codigo(payload["codigo_rol"])
        if not role:
            raise ValueError("ROL_NOT_FOUND")

        validate_password_policy(payload["password"])

        user = self.repo.create_usuario(
            {
                "rol_id": role["rol_id"],
                "username_usuario": payload["username_usuario"],
                "email_usuario": payload["email_usuario"],
                "password_hash_usuario": hash_password(payload["password"]),
                "nombre_usuario": payload["nombre_usuario"],
                "apellido_usuario": payload["apellido_usuario"],
                "activo_usuario": payload.get("activo_usuario", True),
                "requiere_cambio_password_usuario": payload.get(
                    "requiere_cambio_password_usuario", False
                ),
            }
        )

        self.repo.insert_audit_event(
            usuario_id=actor["usuario_id"],
            modulo_auditoria="USUARIOS",
            accion_auditoria="USER_CREATE",
            entidad_auditoria="usuarios",
            entidad_id_auditoria=str(user["usuario_id"]),
            detalle_auditoria=f"ROL={role['codigo_rol']}",
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )
        return user

    def update_usuario(
        self,
        usuario_id: int,
        payload: dict[str, Any],
        actor: dict[str, Any],
        ip_origen: str | None,
        user_agent: str | None,
    ) -> dict[str, Any]:
        existing = self.repo.get_usuario_by_id(usuario_id)
        if not existing:
            raise ValueError("USUARIO_NOT_FOUND")

        data: dict[str, Any] = {}
        detail_parts: list[str] = []

        if "codigo_rol" in payload and payload["codigo_rol"] is not None:
            role = self.repo.get_rol_by_codigo(payload["codigo_rol"])
            if not role:
                raise ValueError("ROL_NOT_FOUND")
            data["rol_id"] = role["rol_id"]
            detail_parts.append(f"ROL={role['codigo_rol']}")

        if "username_usuario" in payload and payload["username_usuario"] is not None:
            data["username_usuario"] = payload["username_usuario"]

        if "email_usuario" in payload and payload["email_usuario"] is not None:
            data["email_usuario"] = payload["email_usuario"]

        if "nombre_usuario" in payload and payload["nombre_usuario"] is not None:
            data["nombre_usuario"] = payload["nombre_usuario"]

        if "apellido_usuario" in payload and payload["apellido_usuario"] is not None:
            data["apellido_usuario"] = payload["apellido_usuario"]

        if "activo_usuario" in payload and payload["activo_usuario"] is not None:
            data["activo_usuario"] = payload["activo_usuario"]
            detail_parts.append(f"ACTIVO={payload['activo_usuario']}")

        if "requiere_cambio_password_usuario" in payload and payload["requiere_cambio_password_usuario"] is not None:
            data["requiere_cambio_password_usuario"] = payload["requiere_cambio_password_usuario"]
            detail_parts.append(
                f"REQ_CHANGE={payload['requiere_cambio_password_usuario']}"
            )

        if not data:
            return existing

        updated = self.repo.update_usuario(usuario_id, data)

        self.repo.insert_audit_event(
            usuario_id=actor["usuario_id"],
            modulo_auditoria="USUARIOS",
            accion_auditoria="USER_UPDATE",
            entidad_auditoria="usuarios",
            entidad_id_auditoria=str(usuario_id),
            detalle_auditoria=" | ".join(detail_parts) if detail_parts else None,
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )

        return updated

    def reset_password(
        self,
        usuario_id: int,
        actor: dict[str, Any],
        ip_origen: str | None,
        user_agent: str | None,
    ) -> dict[str, Any]:
        existing = self.repo.get_usuario_by_id(usuario_id)
        if not existing:
            raise ValueError("USUARIO_NOT_FOUND")

        self.repo.update_usuario(
            usuario_id,
            {
                "password_hash_usuario": hash_password(RESET_PASSWORD_DEFAULT),
                "requiere_cambio_password_usuario": True,
            },
        )

        updated = self.repo.get_usuario_by_id(usuario_id)

        self.repo.insert_audit_event(
            usuario_id=actor["usuario_id"],
            modulo_auditoria="USUARIOS",
            accion_auditoria="RESET_PASSWORD_ADMIN",
            entidad_auditoria="usuarios",
            entidad_id_auditoria=str(usuario_id),
            detalle_auditoria="PASSWORD_RESET_TO_STANDARD",
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )

        return updated
