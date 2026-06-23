from __future__ import annotations

from typing import Optional, List

from psycopg import Connection
from psycopg.rows import dict_row


# Columnas enriquecidas con el tipo de producto. Reutilizado por list/get.
_SELECT_PRODUCTO = """
    SELECT
        p.producto_id,
        p.nombre_producto,
        p.descripcion_producto,
        p.marca_producto,
        p.modelo_producto,
        p.activo_producto,
        p.tipo_producto_id,
        tp.codigo_tproducto,
        tp.descripcion_tproducto
    FROM productos p
    JOIN tipo_producto tp ON tp.tipo_producto_id = p.tipo_producto_id
"""


class ProductosRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ==========================================================
    # READ
    # ==========================================================

    def get_by_id(self, producto_id: int) -> Optional[dict]:
        query = _SELECT_PRODUCTO + " WHERE p.producto_id = %s"
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (producto_id,))
            return cur.fetchone()

    def list(
        self,
        search: Optional[str] = None,
        solo_activos: bool = False,
        tipo_producto_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        where = []
        params: list = []

        if search:
            where.append(
                "(p.nombre_producto ILIKE %s OR p.marca_producto ILIKE %s "
                "OR p.modelo_producto ILIKE %s)"
            )
            like = f"%{search}%"
            params.extend([like, like, like])

        if solo_activos:
            where.append("p.activo_producto = TRUE")

        if tipo_producto_id is not None:
            where.append("p.tipo_producto_id = %s")
            params.append(tipo_producto_id)

        query = _SELECT_PRODUCTO
        if where:
            query += " WHERE " + " AND ".join(where)
        query += " ORDER BY p.producto_id ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def exists_tipo_producto(self, tipo_producto_id: int, solo_activo: bool = True) -> bool:
        query = "SELECT 1 FROM tipo_producto WHERE tipo_producto_id = %s"
        if solo_activo:
            query += " AND activo_tproducto = TRUE"
        with self.conn.cursor() as cur:
            cur.execute(query, (tipo_producto_id,))
            return cur.fetchone() is not None

    # ==========================================================
    # CREATE
    # ==========================================================

    def create(
        self,
        nombre_producto: str,
        descripcion_producto: Optional[str],
        marca_producto: str,
        modelo_producto: str,
        tipo_producto_id: int,
    ) -> dict:
        query = """
            INSERT INTO productos (
                nombre_producto,
                descripcion_producto,
                marca_producto,
                modelo_producto,
                tipo_producto_id
            )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING producto_id
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                query,
                (
                    nombre_producto,
                    descripcion_producto,
                    marca_producto,
                    modelo_producto,
                    tipo_producto_id,
                ),
            )
            return cur.fetchone()

    # ==========================================================
    # UPDATE (incluye activar/desactivar vía activo_producto)
    # ==========================================================

    def update(self, producto_id: int, fields: dict) -> Optional[dict]:
        if not fields:
            return self.get_by_id(producto_id)

        set_clause = ", ".join(f"{key} = %s" for key in fields.keys())
        values = list(fields.values())
        values.append(producto_id)

        query = f"""
            UPDATE productos
            SET {set_clause}
            WHERE producto_id = %s
            RETURNING producto_id
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, values)
            return cur.fetchone()
