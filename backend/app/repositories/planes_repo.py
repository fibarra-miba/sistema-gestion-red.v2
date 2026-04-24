from __future__ import annotations

from typing import Optional, List
from psycopg import Connection
from psycopg.rows import dict_row


class PlanesRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ==========================================================
    # CREATE
    # ==========================================================

    def create(
        self,
        nombre_plan: str,
        velocidad_mbps_plan: int,
        descripcion_plan: Optional[str],
        estado_plan_id: int,
    ) -> dict:
        query = """
            INSERT INTO planes (
                nombre_plan,
                velocidad_mbps_plan,
                descripcion_plan,
                estado_plan_id
            )
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                query,
                (
                    nombre_plan,
                    velocidad_mbps_plan,
                    descripcion_plan,
                    estado_plan_id,
                ),
            )
            return cur.fetchone()

    # ==========================================================
    # READ
    # ==========================================================

    def get_by_id(self, plan_id: int) -> Optional[dict]:
        query = """
            SELECT *
            FROM planes
            WHERE plan_id = %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (plan_id,))
            return cur.fetchone()

    def get_commercial_by_id(self, plan_id: int) -> Optional[dict]:
        query = """
            SELECT
                p.plan_id,
                p.nombre_plan,
                p.velocidad_mbps_plan,
                p.descripcion_plan,
                p.estado_plan_id,
                pp.precio_mensual_pplanes AS precio_vigente,
                pp.fecha_desde_pplanes AS fecha_desde_precio_vigente,
                pp.fecha_hasta_pplanes AS fecha_hasta_precio_vigente
            FROM planes p
            LEFT JOIN LATERAL (
                SELECT
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                FROM precios_planes
                WHERE plan_id = p.plan_id
                  AND fecha_desde_pplanes <= NOW()
                  AND (fecha_hasta_pplanes IS NULL OR NOW() <= fecha_hasta_pplanes)
                ORDER BY fecha_desde_pplanes DESC, precios_planes_id DESC
                LIMIT 1
            ) pp ON TRUE
            WHERE p.plan_id = %s
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (plan_id,))
            return cur.fetchone()

    def list_commercial(self) -> List[dict]:
        query = """
            SELECT
                p.plan_id,
                p.nombre_plan,
                p.velocidad_mbps_plan,
                p.descripcion_plan,
                p.estado_plan_id,
                pp.precio_mensual_pplanes AS precio_vigente,
                pp.fecha_desde_pplanes AS fecha_desde_precio_vigente,
                pp.fecha_hasta_pplanes AS fecha_hasta_precio_vigente
            FROM planes p
            LEFT JOIN LATERAL (
                SELECT
                    precio_mensual_pplanes,
                    fecha_desde_pplanes,
                    fecha_hasta_pplanes
                FROM precios_planes
                WHERE plan_id = p.plan_id
                  AND fecha_desde_pplanes <= NOW()
                  AND (fecha_hasta_pplanes IS NULL OR NOW() <= fecha_hasta_pplanes)
                ORDER BY fecha_desde_pplanes DESC, precios_planes_id DESC
                LIMIT 1
            ) pp ON TRUE
            ORDER BY p.plan_id ASC
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query)
            return cur.fetchall()

    # ==========================================================
    # UPDATE
    # ==========================================================

    def update(self, plan_id: int, fields: dict) -> Optional[dict]:
        if not fields:
            return self.get_by_id(plan_id)

        set_clause = ", ".join(f"{key} = %s" for key in fields.keys())
        values = list(fields.values())
        values.append(plan_id)

        query = f"""
            UPDATE planes
            SET {set_clause}
            WHERE plan_id = %s
            RETURNING *
        """

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, values)
            return cur.fetchone()

    # ==========================================================
    # DELETE (lógico)
    # ==========================================================

    def delete(self, plan_id: int) -> None:
        query = """
            UPDATE planes
            SET estado_plan_id = 2
            WHERE plan_id = %s
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (plan_id,))
