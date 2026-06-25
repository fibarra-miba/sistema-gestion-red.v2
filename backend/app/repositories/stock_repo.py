from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from psycopg import Connection
from psycopg.rows import dict_row


# Saldo y valor por producto. El signo lo aporta tipo_movimiento_stock.
# Cada movimiento_stock referencia exactamente un movimiento_stock_item (1:1 en
# nuestras escrituras), por eso el LEFT JOIN no infla cantidades.
_SALDO_EXPR = (
    "COALESCE(SUM(CASE tms.signo_tmstock WHEN '+' THEN msi.factor_b_stock "
    "ELSE -msi.factor_b_stock END), 0)"
)
_VALOR_EXPR = (
    "COALESCE(SUM(CASE tms.signo_tmstock WHEN '+' "
    "THEN msi.factor_b_stock * ms.costo_unitario_mstock "
    "ELSE -msi.factor_b_stock * ms.costo_unitario_mstock END), 0)"
)


class StockRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ==========================================================
    # LOCK / CATÁLOGO
    # ==========================================================

    def lock_producto(self, producto_id: int) -> None:
        """Serializa los movimientos de un producto dentro de la transacción."""
        with self.conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_xact_lock(%s)", (producto_id,))

    def get_tipo_mov(self, codigo: str) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                "SELECT tipo_mov_id, codigo_tmstock, signo_tmstock "
                "FROM tipo_movimiento_stock WHERE codigo_tmstock = %s",
                (codigo,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"tipo_movimiento_stock no existe: {codigo}")
            return row

    def get_producto(self, producto_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                "SELECT producto_id, nombre_producto, unidad_stock_producto "
                "FROM productos WHERE producto_id = %s",
                (producto_id,),
            )
            return cur.fetchone()

    # ==========================================================
    # SALDO
    # ==========================================================

    def get_saldo(self, producto_id: int) -> dict:
        query = f"""
            SELECT
                {_SALDO_EXPR} AS cantidad,
                {_VALOR_EXPR} AS valor
            FROM movimiento_stock_item msi
            JOIN movimiento_stock ms ON ms.mov_stock_item_id = msi.mov_stock_item_id
            JOIN tipo_movimiento_stock tms ON tms.tipo_mov_id = ms.tipo_mov_id
            WHERE msi.producto_id = %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (producto_id,))
            row = cur.fetchone()
            return {
                "cantidad": float(row["cantidad"]) if row else 0.0,
                "valor": float(row["valor"]) if row else 0.0,
            }

    def existencias(
        self,
        search: Optional[str] = None,
        tipo_producto_id: Optional[int] = None,
        solo_con_stock: bool = False,
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

        if tipo_producto_id is not None:
            where.append("p.tipo_producto_id = %s")
            params.append(tipo_producto_id)

        query = f"""
            SELECT
                p.producto_id,
                p.nombre_producto,
                p.marca_producto,
                p.modelo_producto,
                p.unidad_stock_producto,
                p.tipo_producto_id,
                tp.codigo_tproducto,
                {_SALDO_EXPR} AS cantidad,
                {_VALOR_EXPR} AS valor
            FROM productos p
            JOIN tipo_producto tp ON tp.tipo_producto_id = p.tipo_producto_id
            LEFT JOIN movimiento_stock_item msi ON msi.producto_id = p.producto_id
            LEFT JOIN movimiento_stock ms ON ms.mov_stock_item_id = msi.mov_stock_item_id
            LEFT JOIN tipo_movimiento_stock tms ON tms.tipo_mov_id = ms.tipo_mov_id
        """
        if where:
            query += " WHERE " + " AND ".join(where)
        query += " GROUP BY p.producto_id, tp.codigo_tproducto"
        if solo_con_stock:
            query += f" HAVING {_SALDO_EXPR} > 0"
        query += " ORDER BY p.producto_id ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def kardex(self, producto_id: int, limit: int = 100, offset: int = 0) -> List[dict]:
        query = """
            SELECT
                ms.mov_stock_id,
                msi.producto_id,
                msi.factor_b_stock,
                msi.observacion_dmstock,
                ms.tipo_mov_id,
                tms.codigo_tmstock,
                tms.descripcion_tmstock,
                tms.signo_tmstock,
                ms.fecha_mstock,
                ms.costo_unitario_mstock,
                ms.det_instalacion_id,
                ms.det_factura_compra_id
            FROM movimiento_stock ms
            JOIN movimiento_stock_item msi ON msi.mov_stock_item_id = ms.mov_stock_item_id
            JOIN tipo_movimiento_stock tms ON tms.tipo_mov_id = ms.tipo_mov_id
            WHERE msi.producto_id = %s
            ORDER BY ms.fecha_mstock DESC, ms.mov_stock_id DESC
            LIMIT %s OFFSET %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (producto_id, limit, offset))
            return cur.fetchall()

    # ==========================================================
    # WRITE (item + movimiento, 1:1)
    # ==========================================================

    def insert_movimiento(
        self,
        producto_id: int,
        cantidad_base: float,
        tipo_mov_id: int,
        costo_unitario: float,
        fecha: Optional[datetime] = None,
        observacion: Optional[str] = None,
        det_instalacion_id: Optional[int] = None,
        det_factura_compra_id: Optional[int] = None,
    ) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO movimiento_stock_item (producto_id, factor_b_stock, observacion_dmstock)
                VALUES (%s, %s, %s)
                RETURNING mov_stock_item_id
                """,
                (producto_id, cantidad_base, observacion),
            )
            item_id = int(cur.fetchone()["mov_stock_item_id"])

            cur.execute(
                """
                INSERT INTO movimiento_stock (
                    mov_stock_item_id, tipo_mov_id, fecha_mstock,
                    costo_unitario_mstock, det_instalacion_id, det_factura_compra_id
                )
                VALUES (%s, %s, COALESCE(%s, now()), %s, %s, %s)
                RETURNING mov_stock_id
                """,
                (
                    item_id,
                    tipo_mov_id,
                    fecha,
                    costo_unitario,
                    det_instalacion_id,
                    det_factura_compra_id,
                ),
            )
            mov_id = int(cur.fetchone()["mov_stock_id"])

        return self.get_movimiento(mov_id)

    def get_movimiento(self, mov_stock_id: int) -> Optional[dict]:
        query = """
            SELECT
                ms.mov_stock_id,
                msi.producto_id,
                msi.factor_b_stock,
                msi.observacion_dmstock,
                ms.tipo_mov_id,
                tms.codigo_tmstock,
                tms.descripcion_tmstock,
                tms.signo_tmstock,
                ms.fecha_mstock,
                ms.costo_unitario_mstock,
                ms.det_instalacion_id,
                ms.det_factura_compra_id
            FROM movimiento_stock ms
            JOIN movimiento_stock_item msi ON msi.mov_stock_item_id = ms.mov_stock_item_id
            JOIN tipo_movimiento_stock tms ON tms.tipo_mov_id = ms.tipo_mov_id
            WHERE ms.mov_stock_id = %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (mov_stock_id,))
            return cur.fetchone()
