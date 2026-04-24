# project/red-servicio-internet/backend/app/repositories/promociones_repo.py

from __future__ import annotations

from datetime import date
from psycopg import Connection


class PromocionesRepo:
    def __init__(self, conn: Connection):
        self.conn = conn

    def get_promocion(self, promocion_id: int) -> dict | None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT p.promocion_id, p.activo_promo, p.fecha_vigencia_desde_promo, p.fecha_vigencia_hasta_promo,
                       tp.descripcion_tpromo, p.porcentaje_descuento, p.monto_descuento
                FROM promociones p
                JOIN tipo_promocion tp ON tp.tipo_promo_id = p.tipo_promo_id
                WHERE p.promocion_id = %s
                """,
                (promocion_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "promocion_id": int(row[0]),
                "activo": bool(row[1]),
                "desde": row[2],
                "hasta": row[3],
                "tipo_desc": row[4],  # "PORCENTAJE" | "DESCUENTO_FIJO" (seed)
                "porcentaje": row[5],
                "monto": row[6],
            }

    def promo_vigente(self, promo: dict, fecha_emision: date) -> bool:
        if not promo["activo"]:
            return False
        desde = promo["desde"].date()
        hasta = promo["hasta"].date() if promo["hasta"] else None
        if fecha_emision < desde:
            return False
        if hasta and fecha_emision > hasta:
            return False
        return True