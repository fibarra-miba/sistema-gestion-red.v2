from __future__ import annotations

from datetime import datetime
from typing import Any

import psycopg
from psycopg.rows import dict_row


class AuditRepository:
    """Writer único de auditoría + lectura para el visor.

    El INSERT vive aquí (antes estaba duplicado en auth_repo y usuarios_repo).
    Corre sobre la misma conexión que la operación de negocio: el evento
    commitea junto con ella (auditoría atómica con la transacción de la request).
    """

    def __init__(self, conn: psycopg.Connection):
        self.conn = conn

    def insert_event(
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

    def _build_filters(
        self,
        usuario_id: int | None,
        modulo: str | None,
        accion: str | None,
        entidad: str | None,
        entidad_id: str | None,
        desde: datetime | None,
        hasta: datetime | None,
    ) -> tuple[str, list[Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        if usuario_id is not None:
            clauses.append("a.usuario_id = %s")
            params.append(usuario_id)
        if modulo:
            clauses.append("a.modulo_auditoria = %s")
            params.append(modulo)
        if accion:
            clauses.append("a.accion_auditoria = %s")
            params.append(accion)
        if entidad:
            clauses.append("a.entidad_auditoria = %s")
            params.append(entidad)
        if entidad_id:
            clauses.append("a.entidad_id_auditoria = %s")
            params.append(entidad_id)
        if desde is not None:
            clauses.append("a.created_at >= %s")
            params.append(desde)
        if hasta is not None:
            clauses.append("a.created_at <= %s")
            params.append(hasta)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        return where, params

    def list_events(
        self,
        usuario_id: int | None = None,
        modulo: str | None = None,
        accion: str | None = None,
        entidad: str | None = None,
        entidad_id: str | None = None,
        desde: datetime | None = None,
        hasta: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        where, params = self._build_filters(
            usuario_id, modulo, accion, entidad, entidad_id, desde, hasta
        )
        query = f"""
            SELECT
                a.auditoria_id,
                a.usuario_id,
                u.username_usuario,
                u.nombre_usuario,
                u.apellido_usuario,
                a.modulo_auditoria,
                a.accion_auditoria,
                a.entidad_auditoria,
                a.entidad_id_auditoria,
                a.detalle_auditoria,
                a.ip_origen_auditoria,
                a.user_agent_auditoria,
                a.created_at
            FROM auditoria_eventos a
            LEFT JOIN usuarios u ON u.usuario_id = a.usuario_id
            {where}
            ORDER BY a.created_at DESC, a.auditoria_id DESC
            LIMIT %s OFFSET %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (*params, limit, offset))
            return cur.fetchall()

    def count_events(
        self,
        usuario_id: int | None = None,
        modulo: str | None = None,
        accion: str | None = None,
        entidad: str | None = None,
        entidad_id: str | None = None,
        desde: datetime | None = None,
        hasta: datetime | None = None,
    ) -> int:
        where, params = self._build_filters(
            usuario_id, modulo, accion, entidad, entidad_id, desde, hasta
        )
        query = f"SELECT COUNT(*) AS total FROM auditoria_eventos a {where}"
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            return int(row["total"]) if row else 0
