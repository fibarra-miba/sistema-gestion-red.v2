from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from psycopg import Connection
from psycopg.rows import dict_row


_SELECT_FACTURA = """
    SELECT
        fc.factura_compra_id,
        fc.proveedor_id,
        pr.nombre_prov,
        fc.codigo_fcompras,
        fc.descripcion_fcompras,
        fc.fecha_fcompras,
        fc.importe_total_fcompras,
        fc.estado_factura_compra_id,
        efc.descripcion_efcompra
    FROM facturas_compras fc
    JOIN proveedor pr ON pr.proveedor_id = fc.proveedor_id
    JOIN estado_facturas_compras efc ON efc.estado_factura_compra_id = fc.estado_factura_compra_id
"""

_SELECT_DETALLE = """
    SELECT
        d.det_factura_compra_id,
        d.factura_compra_id,
        d.producto_id,
        p.nombre_producto,
        d.presentacion_id,
        pp.nombre_presentacion,
        d.cantidad_presentacion,
        d.factor_aplicado,
        d.cantidad_base,
        d.costo_unitario_base,
        d.subtotal
    FROM detalle_facturas_compras d
    JOIN productos p ON p.producto_id = d.producto_id
    LEFT JOIN producto_presentacion pp ON pp.presentacion_id = d.presentacion_id
"""


class ComprasRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ==========================================================
    # VALIDACIONES
    # ==========================================================

    def exists_proveedor(self, proveedor_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM proveedor WHERE proveedor_id = %s", (proveedor_id,)
            )
            return cur.fetchone() is not None

    def exists_producto(self, producto_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM productos WHERE producto_id = %s", (producto_id,)
            )
            return cur.fetchone() is not None

    def get_presentacion(self, presentacion_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                "SELECT presentacion_id, producto_id, factor_a_stock "
                "FROM producto_presentacion WHERE presentacion_id = %s",
                (presentacion_id,),
            )
            return cur.fetchone()

    def get_estado_id(self, descripcion: str) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT estado_factura_compra_id FROM estado_facturas_compras "
                "WHERE descripcion_efcompra = %s",
                (descripcion,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"estado_facturas_compras no existe: {descripcion}")
            return int(row[0])

    # ==========================================================
    # READ
    # ==========================================================

    def get_factura(self, factura_compra_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                _SELECT_FACTURA + " WHERE fc.factura_compra_id = %s",
                (factura_compra_id,),
            )
            return cur.fetchone()

    def list_facturas(
        self,
        proveedor_id: Optional[int] = None,
        estado_factura_compra_id: Optional[int] = None,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        where = []
        params: list = []
        if proveedor_id is not None:
            where.append("fc.proveedor_id = %s")
            params.append(proveedor_id)
        if estado_factura_compra_id is not None:
            where.append("fc.estado_factura_compra_id = %s")
            params.append(estado_factura_compra_id)
        if desde is not None:
            where.append("fc.fecha_fcompras >= %s")
            params.append(desde)
        if hasta is not None:
            where.append("fc.fecha_fcompras <= %s")
            params.append(hasta)

        query = _SELECT_FACTURA
        if where:
            query += " WHERE " + " AND ".join(where)
        query += " ORDER BY fc.factura_compra_id DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def list_detalles(self, factura_compra_id: int) -> List[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                _SELECT_DETALLE
                + " WHERE d.factura_compra_id = %s ORDER BY d.det_factura_compra_id ASC",
                (factura_compra_id,),
            )
            return cur.fetchall()

    # ==========================================================
    # WRITE
    # ==========================================================

    def create_factura(
        self,
        proveedor_id: int,
        codigo_fcompras: Optional[str],
        descripcion_fcompras: Optional[str],
        fecha_fcompras: Optional[datetime],
        importe_total_fcompras: float,
        estado_factura_compra_id: int,
    ) -> int:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO facturas_compras (
                    proveedor_id, codigo_fcompras, descripcion_fcompras,
                    fecha_fcompras, importe_total_fcompras, estado_factura_compra_id
                )
                VALUES (%s, %s, %s, COALESCE(%s, now()), %s, %s)
                RETURNING factura_compra_id
                """,
                (
                    proveedor_id,
                    codigo_fcompras,
                    descripcion_fcompras,
                    fecha_fcompras,
                    importe_total_fcompras,
                    estado_factura_compra_id,
                ),
            )
            return int(cur.fetchone()["factura_compra_id"])

    def create_detalle(
        self,
        factura_compra_id: int,
        producto_id: int,
        presentacion_id: Optional[int],
        cantidad_presentacion: float,
        factor_aplicado: float,
        cantidad_base: float,
        costo_unitario_base: float,
        subtotal: float,
    ) -> int:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO detalle_facturas_compras (
                    factura_compra_id, producto_id, presentacion_id,
                    cantidad_presentacion, factor_aplicado, cantidad_base,
                    costo_unitario_base, subtotal
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING det_factura_compra_id
                """,
                (
                    factura_compra_id,
                    producto_id,
                    presentacion_id,
                    cantidad_presentacion,
                    factor_aplicado,
                    cantidad_base,
                    costo_unitario_base,
                    subtotal,
                ),
            )
            return int(cur.fetchone()["det_factura_compra_id"])

    def set_estado(self, factura_compra_id: int, estado_factura_compra_id: int) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE facturas_compras SET estado_factura_compra_id = %s "
                "WHERE factura_compra_id = %s",
                (estado_factura_compra_id, factura_compra_id),
            )
