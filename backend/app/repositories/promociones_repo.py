# project/red-servicio-internet/backend/app/repositories/promociones_repo.py

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from psycopg import Connection
from psycopg.rows import dict_row


# Columnas de promociones enriquecidas con la descripción del tipo (join).
_SELECT_FULL = """
    SELECT p.promocion_id,
           p.nombre_promo,
           p.descripcion_promo,
           p.tipo_promo_id,
           tp.descripcion_tpromo,
           p.porcentaje_descuento,
           p.monto_descuento,
           p.fecha_vigencia_desde_promo,
           p.fecha_vigencia_hasta_promo,
           p.activo_promo
      FROM promociones p
      JOIN tipo_promocion tp ON tp.tipo_promo_id = p.tipo_promo_id
"""


class PromocionesRepo:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ==========================================================
    # ABM (usado por el módulo de promociones)
    # ==========================================================

    def get_full(self, promocion_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(_SELECT_FULL + " WHERE p.promocion_id = %s", (promocion_id,))
            return cur.fetchone()

    def list(
        self,
        activo: Optional[bool] = None,
        tipo_promo_id: Optional[int] = None,
        vigentes: bool = False,
        fecha_referencia: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        ahora = fecha_referencia or datetime.now()
        query = _SELECT_FULL + """
            WHERE (%s::BOOLEAN IS NULL OR p.activo_promo = %s::BOOLEAN)
              AND (%s::BIGINT IS NULL OR p.tipo_promo_id = %s::BIGINT)
              AND (
                    NOT %s::BOOLEAN
                 OR (
                      p.activo_promo
                      AND p.fecha_vigencia_desde_promo <= %s
                      AND (p.fecha_vigencia_hasta_promo IS NULL
                           OR p.fecha_vigencia_hasta_promo >= %s)
                    )
                  )
            ORDER BY p.activo_promo DESC, p.fecha_vigencia_desde_promo DESC, p.promocion_id DESC
            LIMIT %s OFFSET %s
        """
        params = (
            activo, activo,
            tipo_promo_id, tipo_promo_id,
            vigentes, ahora, ahora,
            limit, offset,
        )
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()

    def create(self, data: dict) -> dict:
        query = """
            INSERT INTO promociones (
                nombre_promo,
                descripcion_promo,
                tipo_promo_id,
                porcentaje_descuento,
                monto_descuento,
                fecha_vigencia_desde_promo,
                fecha_vigencia_hasta_promo,
                activo_promo
            )
            VALUES (%(nombre_promo)s, %(descripcion_promo)s, %(tipo_promo_id)s,
                    %(porcentaje_descuento)s, %(monto_descuento)s,
                    %(fecha_vigencia_desde_promo)s, %(fecha_vigencia_hasta_promo)s,
                    %(activo_promo)s)
            RETURNING promocion_id
        """
        with self.conn.cursor() as cur:
            cur.execute(query, data)
            return {"promocion_id": int(cur.fetchone()[0])}

    def update(self, promocion_id: int, data: dict) -> None:
        if not data:
            return
        cols = ", ".join(f"{k} = %({k})s" for k in data)
        params = {**data, "promocion_id": promocion_id}
        with self.conn.cursor() as cur:
            cur.execute(
                f"UPDATE promociones SET {cols} WHERE promocion_id = %(promocion_id)s",
                params,
            )

    def exists_tipo_promo(self, tipo_promo_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM tipo_promocion WHERE tipo_promo_id = %s",
                (tipo_promo_id,),
            )
            return cur.fetchone() is not None

    # ==========================================================
    # LECTURA PARA PRICING (no modificar: lo usa PricingService)
    # ==========================================================

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