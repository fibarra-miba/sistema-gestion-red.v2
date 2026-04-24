# app/repositories/contratos_repo.py

from __future__ import annotations

from typing import Optional, List
from datetime import datetime, date

import psycopg
from psycopg.rows import dict_row


class ContractRepository:
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn

    # ==========================================================
    # CREATE
    # ==========================================================

    def create(
        self,
        cliente_id: int,
        domicilio_id: int,
        plan_id: int,
        precio_base_contrato,
        fecha_inicio: datetime,
        estado_contrato_id: int,
    ) -> dict:
        query = """
            INSERT INTO contratos (
                cliente_id,
                domicilio_id,
                plan_id,
                precio_base_contrato,
                fecha_inicio_contrato,
                estado_contrato_id
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                query,
                (
                    cliente_id,
                    domicilio_id,
                    plan_id,
                    precio_base_contrato,
                    fecha_inicio,
                    estado_contrato_id,
                ),
            )
            return cur.fetchone()

    # ==========================================================
    # READ
    # ==========================================================

    def get_by_id(self, contrato_id: int) -> Optional[dict]:
        query = """
            SELECT *
            FROM contratos
            WHERE contrato_id = %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (contrato_id,))
            return cur.fetchone()

    def get_by_cliente(self, cliente_id: int) -> List[dict]:
        query = """
            SELECT *
            FROM contratos
            WHERE cliente_id = %s
            ORDER BY fecha_inicio_contrato DESC
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (cliente_id,))
            return cur.fetchall()

    def get_commercial_by_id(self, contrato_id: int) -> Optional[dict]:
        query = """
            SELECT
                c.contrato_id,
                c.cliente_id,
                cl.nombre_cliente AS cliente_nombre,
                cl.apellido_cliente AS cliente_apellido,
                c.domicilio_id,
                TRIM(
                    CONCAT_WS(
                        ', ',
                        NULLIF(
                            TRIM(
                                CONCAT_WS(
                                    ' ',
                                    d.calle,
                                    CASE
                                        WHEN d.numero IS NOT NULL THEN d.numero::text
                                        ELSE NULL
                                    END
                                )
                            ),
                            ''
                        ),
                        NULLIF(
                            TRIM(
                                CONCAT_WS(
                                    ' ',
                                    d.complejo,
                                    CASE
                                        WHEN d.piso IS NOT NULL THEN CONCAT('Piso ', d.piso::text)
                                        ELSE NULL
                                    END,
                                    d.depto
                                )
                            ),
                            ''
                        ),
                        NULLIF(d.referencias, '')
                    )
                ) AS domicilio_resumen,
                c.plan_id,
                p.nombre_plan AS plan_nombre,
                c.precio_base_contrato,
                c.fecha_inicio_contrato,
                c.fecha_fin_contrato,
                c.estado_contrato_id,
                ec.descripcion_econtrato AS estado_contrato_descripcion,
                c.aplica_promocion,
                c.promocion_id
            FROM contratos c
            INNER JOIN clientes cl
                ON cl.cliente_id = c.cliente_id
            INNER JOIN domicilios d
                ON d.domicilio_id = c.domicilio_id
            INNER JOIN planes p
                ON p.plan_id = c.plan_id
            INNER JOIN estado_contrato ec
                ON ec.estado_contrato_id = c.estado_contrato_id
            WHERE c.contrato_id = %s
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (contrato_id,))
            return cur.fetchone()

    def list_commercial(
        self,
        cliente_id: Optional[int] = None,
        estado_contrato_id: Optional[int] = None,
        plan_id: Optional[int] = None,
        domicilio_id: Optional[int] = None,
    ) -> List[dict]:
        query = """
            SELECT
                c.contrato_id,
                c.cliente_id,
                cl.nombre_cliente AS cliente_nombre,
                cl.apellido_cliente AS cliente_apellido,
                c.domicilio_id,
                TRIM(
                    CONCAT_WS(
                        ', ',
                        NULLIF(
                            TRIM(
                                CONCAT_WS(
                                    ' ',
                                    d.calle,
                                    CASE
                                        WHEN d.numero IS NOT NULL THEN d.numero::text
                                        ELSE NULL
                                    END
                                )
                            ),
                            ''
                        ),
                        NULLIF(
                            TRIM(
                                CONCAT_WS(
                                    ' ',
                                    d.complejo,
                                    CASE
                                        WHEN d.piso IS NOT NULL THEN CONCAT('Piso ', d.piso::text)
                                        ELSE NULL
                                    END,
                                    d.depto
                                )
                            ),
                            ''
                        ),
                        NULLIF(d.referencias, '')
                    )
                ) AS domicilio_resumen,
                c.plan_id,
                p.nombre_plan AS plan_nombre,
                c.precio_base_contrato,
                c.fecha_inicio_contrato,
                c.fecha_fin_contrato,
                c.estado_contrato_id,
                ec.descripcion_econtrato AS estado_contrato_descripcion,
                c.aplica_promocion,
                c.promocion_id
            FROM contratos c
            INNER JOIN clientes cl
                ON cl.cliente_id = c.cliente_id
            INNER JOIN domicilios d
                ON d.domicilio_id = c.domicilio_id
            INNER JOIN planes p
                ON p.plan_id = c.plan_id
            INNER JOIN estado_contrato ec
                ON ec.estado_contrato_id = c.estado_contrato_id
            WHERE (%s::BIGINT IS NULL OR c.cliente_id = %s::BIGINT)
                AND (%s::BIGINT IS NULL OR c.estado_contrato_id = %s::BIGINT)
                AND (%s::BIGINT IS NULL OR c.plan_id = %s::BIGINT)
                AND (%s::BIGINT IS NULL OR c.domicilio_id = %s::BIGINT)
            ORDER BY c.fecha_inicio_contrato DESC, c.contrato_id DESC
        """
        params = (
            cliente_id, cliente_id,
            estado_contrato_id, estado_contrato_id,
            plan_id, plan_id,
            domicilio_id, domicilio_id,
        )
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()

    # ==========================================================
    # VALIDACIONES DOMINIO: no solapamiento ACTIVO por domicilio
    # ==========================================================

    def exists_other_active_overlapping_by_domicilio(
        self,
        domicilio_id: int,
        fecha_inicio: datetime,
        fecha_fin: Optional[datetime],
        exclude_contrato_id: int,
    ) -> bool:
        """
        True si existe OTRO contrato ACTIVO para el mismo domicilio cuyo período se solape
        con [fecha_inicio, fecha_fin) (fecha_fin None => infinity).
        """
        query = """
            SELECT 1
              FROM contratos c
             WHERE c.domicilio_id = %s
               AND c.estado_contrato_id = 3
               AND c.contrato_id <> %s
               AND tstzrange(
                     c.fecha_inicio_contrato,
                     COALESCE(c.fecha_fin_contrato, 'infinity'::timestamptz),
                     '[)'
                   )
                   &&
                   tstzrange(
                     %s,
                     COALESCE(%s, 'infinity'::timestamptz),
                     '[)'
                   )
             LIMIT 1
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (domicilio_id, exclude_contrato_id, fecha_inicio, fecha_fin))
            return cur.fetchone() is not None

    # ==========================================================
    # UPDATE
    # ==========================================================

    def update_estado(
        self,
        contrato_id: int,
        estado_contrato_id: int,
        fecha_fin: Optional[datetime] = None,
    ) -> None:
        query = """
            UPDATE contratos
               SET estado_contrato_id = %s,
                   fecha_fin_contrato = %s
             WHERE contrato_id = %s
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (estado_contrato_id, fecha_fin, contrato_id))

    def update_plan(self, contrato_id: int, plan_id: int) -> None:
        query = """
            UPDATE contratos
               SET plan_id = %s
             WHERE contrato_id = %s
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (plan_id, contrato_id))

    # ==========================================================
    # DOMINIO - PAGOS
    # ==========================================================

    def get_contrato(self, contrato_id: int) -> Optional[dict]:
        """
        Devuelve un dict con los campos que PagosService espera.
        """
        c = self.get_by_id(contrato_id)
        if not c:
            return None

        estado_txt = "ACTIVO" if c["estado_contrato_id"] == 3 else "NO_ACTIVO"

        return {
            "contrato_id": c["contrato_id"],
            "cliente_id": c["cliente_id"],
            "domicilio_id": c["domicilio_id"],
            "plan_id": c["plan_id"],
            "precio_base_contrato": c["precio_base_contrato"],
            "fecha_inicio": c["fecha_inicio_contrato"],
            "estado": estado_txt,
            "aplica_promocion": bool(c.get("aplica_promocion", False)),
            "promocion_id": c.get("promocion_id"),
        }

    def validar_no_periodo_anterior_inicio(
        self, fecha_inicio: datetime, periodo_anio: int, periodo_mes: int
    ) -> bool:
        ini: date = fecha_inicio.date()
        return (periodo_anio, periodo_mes) >= (ini.year, ini.month)

    # ==========================================================
    # FACTURACIÓN / LOTE
    # COBRABLE = ACTIVO ∧ VIGENTE
    # vigente = fecha_inicio <= now AND (fecha_fin IS NULL OR now < fecha_fin)
    # ==========================================================

    def list_contratos_cobrables(self, now: datetime) -> List[dict]:
        query = """
            SELECT
                contrato_id,
                cliente_id,
                domicilio_id,
                plan_id,
                precio_base_contrato,
                fecha_inicio_contrato,
                fecha_fin_contrato,
                estado_contrato_id,
                aplica_promocion,
                promocion_id
            FROM contratos
            WHERE estado_contrato_id = 3
              AND fecha_inicio_contrato <= %s
              AND (fecha_fin_contrato IS NULL OR %s < fecha_fin_contrato)
            ORDER BY contrato_id ASC
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (now, now))
            rows = cur.fetchall()

        out: List[dict] = []
        for r in rows:
            out.append(
                {
                    "contrato_id": r["contrato_id"],
                    "cliente_id": r["cliente_id"],
                    "domicilio_id": r["domicilio_id"],
                    "plan_id": r["plan_id"],
                    "precio_base_contrato": r["precio_base_contrato"],
                    "fecha_inicio": r["fecha_inicio_contrato"],
                    "estado": "ACTIVO",
                    "aplica_promocion": bool(r.get("aplica_promocion", False)),
                    "promocion_id": r.get("promocion_id"),
                }
            )
        return out

    def get_by_id_for_update(self, contrato_id: int) -> Optional[dict]:
        query = """
            SELECT *
            FROM contratos
            WHERE contrato_id = %s
            FOR UPDATE
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (contrato_id,))
            return cur.fetchone()

    def update_estado_only(
        self,
        contrato_id: int,
        estado_contrato_id: int,
    ) -> None:
        query = """
            UPDATE contratos
               SET estado_contrato_id = %s
             WHERE contrato_id = %s
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (estado_contrato_id, contrato_id))
