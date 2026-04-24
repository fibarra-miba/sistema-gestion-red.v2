# app/repositories/precios_repo.py

from __future__ import annotations

from datetime import date
from psycopg import Connection
from psycopg.rows import dict_row


class PreciosRepo:
    def __init__(self, conn: Connection):
        self.conn = conn

    def get_precio_base_vigente(self, plan_id: int, fecha_emision: date) -> dict | None:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    precios_planes_id,
                    plan_id,
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                FROM precios_planes
                WHERE plan_id = %s
                  AND fecha_desde_pplanes::date <= %s
                  AND (fecha_hasta_pplanes IS NULL OR fecha_hasta_pplanes::date >= %s)
                ORDER BY fecha_desde_pplanes DESC, precios_planes_id DESC
                LIMIT 1
                """,
                (plan_id, fecha_emision, fecha_emision),
            )
            row = cur.fetchone()

        if not row:
            return None

        return {
            "precios_planes_id": int(row["precios_planes_id"]),
            "plan_id": int(row["plan_id"]),
            "precio": row["precio_mensual_pplanes"],
            "precio_mensual_pplanes": row["precio_mensual_pplanes"],
            "fecha_desde_pplanes": row["fecha_desde_pplanes"],
            "fecha_hasta_pplanes": row["fecha_hasta_pplanes"],
        }

    def get_by_id(self, precios_planes_id: int) -> dict | None:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    precios_planes_id,
                    plan_id,
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                FROM precios_planes
                WHERE precios_planes_id = %s
                """,
                (precios_planes_id,),
            )
            row = cur.fetchone()

        if not row:
            return None

        return dict(row)

    def list_by_plan(self, plan_id: int) -> list[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    precios_planes_id,
                    plan_id,
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                FROM precios_planes
                WHERE plan_id = %s
                ORDER BY fecha_desde_pplanes DESC, precios_planes_id DESC
                """,
                (plan_id,),
            )
            rows = cur.fetchall()

        return [dict(r) for r in rows]

    def create(
        self,
        plan_id: int,
        precio_mensual_pplanes,
        fecha_desde_pplanes,
        fecha_hasta_pplanes=None,
    ) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO precios_planes (
                    plan_id,
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                )
                VALUES (%s, %s, %s, %s)
                RETURNING
                    precios_planes_id,
                    plan_id,
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                """,
                (
                    plan_id,
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes,
                ),
            )
            row = cur.fetchone()

        return dict(row)

    def update(self, precios_planes_id: int, fields: dict) -> dict | None:
        if not fields:
            return self.get_by_id(precios_planes_id)

        set_clause = ", ".join(f"{key} = %s" for key in fields.keys())
        values = list(fields.values())
        values.append(precios_planes_id)

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f"""
                UPDATE precios_planes
                SET {set_clause}
                WHERE precios_planes_id = %s
                RETURNING
                    precios_planes_id,
                    plan_id,
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                """,
                values,
            )
            row = cur.fetchone()

        return dict(row) if row else None
