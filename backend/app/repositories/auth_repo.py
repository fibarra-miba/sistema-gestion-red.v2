from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

import psycopg
from psycopg.rows import dict_row


class AuthRepository:
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn

    def get_user_by_identifier(self, identifier: str) -> Optional[dict[str, Any]]:
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
            WHERE LOWER(u.username_usuario) = LOWER(%s)
               OR LOWER(u.email_usuario) = LOWER(%s)
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (identifier, identifier))
            return cur.fetchone()

    def create_session(
        self,
        usuario_id: int,
        token_hash_sesion: str,
        fecha_expiracion_sesion: datetime,
        ip_origen_sesion: str | None,
        user_agent_sesion: str | None,
    ) -> dict[str, Any]:
        query = """
            INSERT INTO sesiones_usuarios (
                usuario_id,
                token_hash_sesion,
                fecha_expiracion_sesion,
                ip_origen_sesion,
                user_agent_sesion
            )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING
                sesion_id,
                usuario_id,
                token_hash_sesion,
                fecha_expiracion_sesion,
                fecha_revocacion_sesion,
                motivo_revocacion_sesion,
                ip_origen_sesion,
                user_agent_sesion,
                created_at,
                updated_at
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                query,
                (
                    usuario_id,
                    token_hash_sesion,
                    fecha_expiracion_sesion,
                    ip_origen_sesion,
                    user_agent_sesion,
                ),
            )
            return cur.fetchone()

    def get_active_session_by_hash(self, token_hash_sesion: str) -> Optional[dict[str, Any]]:
        query = """
            SELECT
                s.sesion_id,
                s.usuario_id,
                s.token_hash_sesion,
                s.fecha_expiracion_sesion,
                s.fecha_revocacion_sesion,
                s.motivo_revocacion_sesion,
                s.ip_origen_sesion,
                s.user_agent_sesion,
                s.created_at,
                s.updated_at,
                u.rol_id,
                r.codigo_rol,
                r.nombre_rol,
                u.username_usuario,
                u.email_usuario,
                u.nombre_usuario,
                u.apellido_usuario,
                u.activo_usuario,
                u.requiere_cambio_password_usuario,
                u.ultimo_login_usuario
            FROM sesiones_usuarios s
            INNER JOIN usuarios u
                ON u.usuario_id = s.usuario_id
            INNER JOIN roles r
                ON r.rol_id = u.rol_id
            WHERE s.token_hash_sesion = %s
              AND s.fecha_revocacion_sesion IS NULL
              AND s.fecha_expiracion_sesion > NOW()
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (token_hash_sesion,))
            return cur.fetchone()

    def revoke_session(self, sesion_id: int, motivo: str) -> None:
        query = """
            UPDATE sesiones_usuarios
            SET
                fecha_revocacion_sesion = NOW(),
                motivo_revocacion_sesion = %s,
                updated_at = NOW()
            WHERE sesion_id = %s
              AND fecha_revocacion_sesion IS NULL
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (motivo, sesion_id))

    def revoke_all_user_sessions(self, usuario_id: int, motivo: str) -> None:
        query = """
            UPDATE sesiones_usuarios
            SET
                fecha_revocacion_sesion = NOW(),
                motivo_revocacion_sesion = %s,
                updated_at = NOW()
            WHERE usuario_id = %s
              AND fecha_revocacion_sesion IS NULL
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (motivo, usuario_id))

    def update_last_login(self, usuario_id: int) -> None:
        query = """
            UPDATE usuarios
            SET
                ultimo_login_usuario = NOW(),
                updated_at = NOW()
            WHERE usuario_id = %s
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (usuario_id,))

    def change_password(
        self,
        usuario_id: int,
        password_hash_usuario: str,
        requiere_cambio_password_usuario: bool,
    ) -> None:
        query = """
            UPDATE usuarios
            SET
                password_hash_usuario = %s,
                requiere_cambio_password_usuario = %s,
                updated_at = NOW()
            WHERE usuario_id = %s
        """
        with self.conn.cursor() as cur:
            cur.execute(
                query,
                (
                    password_hash_usuario,
                    requiere_cambio_password_usuario,
                    usuario_id,
                ),
            )

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
