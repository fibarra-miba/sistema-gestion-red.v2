from __future__ import annotations

from typing import List, Optional

from psycopg import Connection
from psycopg.rows import dict_row


_SELECT_PROVEEDOR = """
    SELECT
        p.proveedor_id,
        p.nombre_prov,
        p.direccion_prov,
        p.descripcion_prov,
        p.link_maps_prov,
        p.telefono_prov,
        p.email_prov,
        p.web_prov,
        p.observacion_prov,
        p.estado_proveedor_id,
        ep.descripcion_eprov
    FROM proveedor p
    JOIN estado_proveedor ep ON ep.estado_proveedor_id = p.estado_proveedor_id
"""


class ProveedoresRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ==========================================================
    # READ
    # ==========================================================

    def get_by_id(self, proveedor_id: int) -> Optional[dict]:
        query = _SELECT_PROVEEDOR + " WHERE p.proveedor_id = %s"
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (proveedor_id,))
            return cur.fetchone()

    def list(
        self,
        search: Optional[str] = None,
        estado_proveedor_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        where = []
        params: list = []

        if search:
            where.append(
                "(p.nombre_prov ILIKE %s OR p.email_prov ILIKE %s OR p.telefono_prov ILIKE %s)"
            )
            like = f"%{search}%"
            params.extend([like, like, like])

        if estado_proveedor_id is not None:
            where.append("p.estado_proveedor_id = %s")
            params.append(estado_proveedor_id)

        query = _SELECT_PROVEEDOR
        if where:
            query += " WHERE " + " AND ".join(where)
        query += " ORDER BY p.proveedor_id ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def exists_estado(self, estado_proveedor_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM estado_proveedor WHERE estado_proveedor_id = %s",
                (estado_proveedor_id,),
            )
            return cur.fetchone() is not None

    # ==========================================================
    # WRITE
    # ==========================================================

    def create(self, data: dict) -> dict:
        cols = list(data.keys())
        placeholders = ", ".join(["%s"] * len(cols))
        col_clause = ", ".join(cols)
        query = f"""
            INSERT INTO proveedor ({col_clause})
            VALUES ({placeholders})
            RETURNING proveedor_id
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(data.values()))
            return cur.fetchone()

    def update(self, proveedor_id: int, fields: dict) -> Optional[dict]:
        if not fields:
            return self.get_by_id(proveedor_id)

        set_clause = ", ".join(f"{key} = %s" for key in fields.keys())
        values = list(fields.values())
        values.append(proveedor_id)

        query = f"""
            UPDATE proveedor
            SET {set_clause}
            WHERE proveedor_id = %s
            RETURNING proveedor_id
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, values)
            return cur.fetchone()
