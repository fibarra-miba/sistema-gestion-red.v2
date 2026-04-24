from __future__ import annotations

from typing import Any, Optional

import psycopg
from psycopg.rows import dict_row


class UsuariosRepository:
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn

    def list_usuarios(self) -> list[dict[str, Any]]:
        query = """
            SELECT
                u.usuario_id,
                u.rol_id,
                r.codigo_rol,
                r.nombre_rol,
                u.username_usuario,
                u.email_usuario,
                u.nombre_usuario,
                u.apellido_usuario,
                u.activo_usuario,
                u.requiere_cambio_password_usuario,
                u.ultimo_login_usuario,
                u.created_at,
                u.updated_at
            FROM usuarios u
            INNER JOIN roles r
                ON r.rol_id = u.rol_id
            ORDER BY u.usuario_id
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query)
            return cur.fetchall()

    def get_usuario_by_id(self, usuario_id: int) -> Optional[dict[str, Any]]:
        query = """
            SELECT
                u.usuario_id,
                u.rol_id,
                r.codigo_rol,
                r.nombre_rol,
                u.username_usuario,
                u.email_usuario,
                u.nombre_usuario,
                u.apellido_usuario,
                u.activo_usuario,
                u.requiere_cambio_password_usuario,
                u.ultimo_login_usuario,
                u.created_at,
                u.updated_at
            FROM usuarios u
            INNER JOIN roles r
                ON r.rol_id = u.rol_id
            WHERE u.usuario_id = %s
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (usuario_id,))
            return cur.fetchone()

    def get_usuario_full_by_id(self, usuario_id: int) -> Optional[dict[str, Any]]:
        query = """
            SELECT
                u.usuario_id,
                u.rol_id,
                r.codigo_rol,
                r.nombre_rol,
                u.username_usuario,
                u.email_usuario,
                u.password_hash_usuario,
                u.nombre_usuario,
                u.apellido_usuario,
                u.activo_usuario,
                u.requiere_cambio_password_usuario,
                u.ultimo_login_usuario,
                u.created_at,
                u.updated_at
            FROM usuarios u
            INNER JOIN roles r
                ON r.rol_id = u.rol_id
            WHERE u.usuario_id = %s
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (usuario_id,))
            return cur.fetchone()

    def create_usuario(self, data: dict[str, Any]) -> dict[str, Any]:
        query = """
            INSERT INTO usuarios (
                rol_id,
                username_usuario,
                email_usuario,
                password_hash_usuario,
                nombre_usuario,
                apellido_usuario,
                activo_usuario,
                requiere_cambio_password_usuario
            )
            VALUES (
                %(rol_id)s,
                %(username_usuario)s,
                %(email_usuario)s,
                %(password_hash_usuario)s,
                %(nombre_usuario)s,
                %(apellido_usuario)s,
                %(activo_usuario)s,
                %(requiere_cambio_password_usuario)s
            )
            RETURNING usuario_id
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, data)
            row = cur.fetchone()
            return self.get_usuario_by_id(int(row["usuario_id"]))

    def update_usuario(self, usuario_id: int, data: dict[str, Any]) -> dict[str, Any]:
        fields = []
        params: list[Any] = []

        for key, value in data.items():
            fields.append(f"{key} = %s")
            params.append(value)

        params.append(usuario_id)

        query = f"""
            UPDATE usuarios
            SET
                {", ".join(fields)},
                updated_at = NOW()
            WHERE usuario_id = %s
        """

        with self.conn.cursor() as cur:
            cur.execute(query, tuple(params))

        return self.get_usuario_by_id(usuario_id)

    def get_rol_by_codigo(self, codigo_rol: str) -> Optional[dict[str, Any]]:
        query = """
            SELECT rol_id, codigo_rol, nombre_rol, descripcion_rol
            FROM roles
            WHERE codigo_rol = %s
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (codigo_rol,))
            return cur.fetchone()

    def list_roles(self) -> list[dict[str, Any]]:
        query = """
            SELECT rol_id, codigo_rol, nombre_rol, descripcion_rol
            FROM roles
            ORDER BY rol_id
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query)
            return cur.fetchall()

    def insert_audit_event(
        self,
        usuario_id: int | None,
        modulo_auditoria: str,
        accion_auditoria: str,
        entidad_auditoria: str | None,
        entidad_id_auditoria: str | None,
        detalle_auditoria: str | None,
        ip_origen_auditoria: str | None,
        user_agent_auditoria: str | None,
    ) -> None:
        query = """
            INSERT INTO auditoria_eventos (
                usuario_id,
                modulo_auditoria,
                accion_auditoria,
                entidad_auditoria,
                entidad_id_auditoria,
                detalle_auditoria,
                ip_origen_auditoria,
                user_agent_auditoria
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        with self.conn.cursor() as cur:
            cur.execute(
                query,
                (
                    usuario_id,
                    modulo_auditoria,
                    accion_auditoria,
                    entidad_auditoria,
                    entidad_id_auditoria,
                    detalle_auditoria,
                    ip_origen_auditoria,
                    user_agent_auditoria,
                ),
            )
