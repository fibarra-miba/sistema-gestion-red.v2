# app/repositories/catalogos_repo.py

from __future__ import annotations

from psycopg import Connection


class CatalogosRepo:
    def __init__(self, conn: Connection):
        self.conn = conn

    def list_medios_pagos(self) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT medio_pago_id, descripcion_mpagos FROM medios_pagos ORDER BY medio_pago_id"
            )
            return [{"id": r[0], "descripcion": r[1]} for r in cur.fetchall()]

    def list_tipos_promo(self) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT tipo_promo_id, descripcion_tpromo FROM tipo_promocion ORDER BY tipo_promo_id"
            )
            return [
                {
                    "id": r[0],
                    "descripcion": r[1],
                    "descripcion_tpromo": r[1],
                }
                for r in cur.fetchall()
            ]

    def list_tipos_pago(self) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT tipo_pago_id, descripcion_tpago FROM tipo_pago ORDER BY tipo_pago_id"
            )
            return [{"id": r[0], "descripcion": r[1]} for r in cur.fetchall()]

    def list_estados_pago(self) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT estado_pago_id, descripcion_epago FROM estado_pago ORDER BY estado_pago_id"
            )
            return [
                {
                    "id": r[0],
                    "descripcion": r[1],
                    "descripcion_epago": r[1],
                }
                for r in cur.fetchall()
            ]

    def get_estado_pago_id(self, descripcion: str) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT estado_pago_id FROM estado_pago WHERE descripcion_epago = %s",
                (descripcion,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"estado_pago no existe: {descripcion}")
            return int(row[0])

    def get_estado_factura_venta_id(self, descripcion: str) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT estado_fact_venta_id FROM estado_facturas_ventas WHERE descripcion_efventa = %s",
                (descripcion,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"estado_facturas_ventas no existe: {descripcion}")
            return int(row[0])

    def get_tipo_mov_det_cuenta(self, codigo: str) -> dict:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT tipo_mov_det_cuenta_id, codigo_tipo_mov_det_cuenta, signo_tipo_mov_det_cuenta
                FROM tipo_movimiento_detalle_cuenta
                WHERE codigo_tipo_mov_det_cuenta = %s AND activo_tipo_mov_det_cuenta = TRUE
                """,
                (codigo,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"tipo_movimiento_detalle_cuenta no existe/activo: {codigo}")
            return {"id": int(row[0]), "codigo": row[1], "signo": row[2]}

    def exists_medio_pago(self, medio_pago_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM medios_pagos WHERE medio_pago_id = %s",
                (medio_pago_id,),
            )
            return cur.fetchone() is not None

    def exists_tipo_pago(self, tipo_pago_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM tipo_pago WHERE tipo_pago_id = %s",
                (tipo_pago_id,),
            )
            return cur.fetchone() is not None
