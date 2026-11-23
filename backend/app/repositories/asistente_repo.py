"""Fachada de solo lectura para el asistente de Telegram (docs/asistente.md).

Una consulta por herramienta del agente y solo los campos que sirven para
responder: lo que el agente lee en cada vuelta se paga en tokens. Las escrituras
no pasan por acá: van por las rutas normales de la API (validación y auditoría).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

import psycopg
from psycopg.rows import dict_row

# Estados de contrato que cuentan como "vigentes" para el cliente.
ESTADOS_CONTRATO_VIGENTES = ("PENDIENTE_INSTALACION", "ACTIVO", "SUSPENDIDO")

# Fechas al agente en hora local y formato corto (menos tokens, sin conversión de huso).
TZ_NEGOCIO_PG = "America/Argentina/Buenos_Aires"

# Domicilio legible en una línea: "Calle 123, piso 2 depto B, torre 3, complejo X".
_DOMICILIO_SQL = """
    concat_ws(', ',
        NULLIF(concat_ws(' ', d.calle, d.numero::text), ''),
        NULLIF(concat_ws(' ',
            CASE WHEN d.piso IS NOT NULL THEN 'piso ' || d.piso END,
            CASE WHEN d.depto IS NOT NULL THEN 'depto ' || d.depto END), ''),
        CASE WHEN d.torre IS NOT NULL THEN 'torre ' || d.torre END,
        CASE WHEN d.complejo IS NOT NULL THEN 'complejo ' || d.complejo END
    )
"""

_DOMICILIO_VIGENTE_LATERAL = """
    LEFT JOIN LATERAL (
        SELECT d.*
        FROM domicilios d
        WHERE d.cliente_id = c.cliente_id
          AND d.fecha_hasta_dom IS NULL
        ORDER BY d.fecha_desde_dom DESC
        LIMIT 1
    ) d ON TRUE
"""


class AsistenteRepository:
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn

    # ------------------------------------------------------------------
    # Vinculación Telegram ↔ usuario
    # ------------------------------------------------------------------
    def get_usuario_por_telegram(self, telegram_user_id: int) -> Optional[dict[str, Any]]:
        query = """
            SELECT
                u.usuario_id,
                u.username_usuario,
                u.nombre_usuario,
                u.apellido_usuario,
                u.activo_usuario,
                u.requiere_cambio_password_usuario,
                r.codigo_rol
            FROM usuarios_telegram ut
            JOIN usuarios u ON u.usuario_id = ut.usuario_id
            JOIN roles r ON r.rol_id = u.rol_id
            WHERE ut.telegram_user_id = %s
              AND ut.activo_vinculacion = TRUE
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (telegram_user_id,))
            return cur.fetchone()

    def vincular(self, usuario_id: int, telegram_user_id: int) -> None:
        """Alta o reemplazo de la vinculación del usuario (una cuenta por usuario)."""
        query = """
            INSERT INTO usuarios_telegram (usuario_id, telegram_user_id, activo_vinculacion)
            VALUES (%s, %s, TRUE)
            ON CONFLICT (usuario_id) DO UPDATE
               SET telegram_user_id = EXCLUDED.telegram_user_id,
                   activo_vinculacion = TRUE,
                   fecha_vinculacion = now()
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (usuario_id, telegram_user_id))

    def desvincular(self, usuario_id: int) -> bool:
        query = """
            UPDATE usuarios_telegram SET activo_vinculacion = FALSE
            WHERE usuario_id = %s AND activo_vinculacion = TRUE
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (usuario_id,))
            return cur.rowcount > 0

    def listar_vinculaciones(self) -> list[dict[str, Any]]:
        query = """
            SELECT u.username_usuario, ut.telegram_user_id, ut.activo_vinculacion,
                   ut.fecha_vinculacion
            FROM usuarios_telegram ut
            JOIN usuarios u ON u.usuario_id = ut.usuario_id
            ORDER BY u.username_usuario
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query)
            return cur.fetchall()

    # ------------------------------------------------------------------
    # Clientes
    # ------------------------------------------------------------------
    def buscar_clientes(self, texto: str, limite: int) -> tuple[list[dict[str, Any]], int]:
        """Busca por nombre, apellido, DNI o teléfono; cada palabra debe aparecer.

        Devuelve (hasta `limite` clientes, total de coincidencias).
        """
        palabras = [p for p in texto.split() if p][:5]
        if not palabras:
            return [], 0

        condiciones = " AND ".join(
            "concat_ws(' ', c.nombre_cliente, c.apellido_cliente, c.dni_cliente, "
            "c.telefono_cliente) ILIKE %s"
            for _ in palabras
        )
        params = [f"%{p}%" for p in palabras]

        query = f"""
            SELECT
                c.cliente_id AS id,
                c.nombre_cliente || ' ' || c.apellido_cliente AS nombre,
                c.dni_cliente AS dni,
                c.telefono_cliente AS tel,
                ec.descripcion_ecliente AS estado,
                NULLIF({_DOMICILIO_SQL}, '') AS domicilio,
                (
                    SELECT count(*)
                    FROM contratos k
                    JOIN estado_contrato ek ON ek.estado_contrato_id = k.estado_contrato_id
                    WHERE k.cliente_id = c.cliente_id
                      AND ek.descripcion_econtrato = ANY(%s)
                ) AS contratos_vigentes,
                count(*) OVER () AS total
            FROM clientes c
            JOIN estado_cliente ec ON ec.estado_cliente_id = c.estado_cliente_id
            {_DOMICILIO_VIGENTE_LATERAL}
            WHERE {condiciones}
            ORDER BY c.apellido_cliente, c.nombre_cliente, c.cliente_id
            LIMIT %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, [list(ESTADOS_CONTRATO_VIGENTES), *params, limite])
            rows = cur.fetchall()
        total = rows[0]["total"] if rows else 0
        for r in rows:
            r.pop("total")
        return rows, total

    def ficha_cliente(self, cliente_id: int) -> Optional[dict[str, Any]]:
        cliente_q = f"""
            SELECT
                c.cliente_id AS id,
                c.nombre_cliente || ' ' || c.apellido_cliente AS nombre,
                c.dni_cliente AS dni,
                c.telefono_cliente AS tel,
                c.email_cliente AS email,
                ec.descripcion_ecliente AS estado,
                c.fecha_alta_cliente::date AS alta,
                c.observacion_cliente AS obs,
                NULLIF({_DOMICILIO_SQL}, '') AS domicilio,
                d.referencias AS referencias,
                COALESCE(cu.saldo_cuenta, 0)::float AS saldo
            FROM clientes c
            JOIN estado_cliente ec ON ec.estado_cliente_id = c.estado_cliente_id
            {_DOMICILIO_VIGENTE_LATERAL}
            LEFT JOIN cuenta cu ON cu.cliente_id = c.cliente_id
            WHERE c.cliente_id = %s
        """
        contratos_q = """
            SELECT
                k.contrato_id AS id,
                p.nombre_plan AS plan,
                p.velocidad_mbps_plan AS mbps,
                ek.descripcion_econtrato AS estado,
                k.precio_base_contrato::float AS precio,
                k.fecha_inicio_contrato::date AS desde,
                pr.nombre_promo AS promo,
                (
                    SELECT count(*)
                    FROM pagos pg
                    JOIN estado_pago ep ON ep.estado_pago_id = pg.estado_pago_id
                    WHERE pg.contrato_id = k.contrato_id
                      AND ep.descripcion_epago IN ('PENDIENTE', 'PARCIAL')
                ) AS pagos_pendientes
            FROM contratos k
            JOIN planes p ON p.plan_id = k.plan_id
            JOIN estado_contrato ek ON ek.estado_contrato_id = k.estado_contrato_id
            LEFT JOIN promociones pr
                   ON pr.promocion_id = k.promocion_id AND k.aplica_promocion
            WHERE k.cliente_id = %s
            ORDER BY (ek.descripcion_econtrato IN ('CANCELADO', 'BAJA')), k.contrato_id DESC
            LIMIT 10
        """
        garantias_q = """
            SELECT
                g.garantia_id AS id,
                g.monto_garantia::float AS monto,
                (COALESCE(g.monto_garantia, 0)
                 - COALESCE((SELECT sum(cg.monto_cobro_garantia)
                             FROM cobros_garantia cg
                             WHERE cg.garantia_id = g.garantia_id), 0))::float AS pendiente
            FROM garantia g
            JOIN contratos k ON k.contrato_id = g.contrato_id
            JOIN estado_garantia eg ON eg.estado_garantia_id = g.estado_garantia_id
            WHERE k.cliente_id = %s
              AND eg.descripcion_egarantia = 'ACTIVA'
        """
        instalacion_q = """
            SELECT
                to_char(pi.fecha_programacion_pinstalacion AT TIME ZONE %s,
                        'YYYY-MM-DD HH24:MI') AS fecha,
                pi.tecnico_pinstalacion AS tecnico,
                pi.contrato_id
            FROM programacion_instalaciones pi
            JOIN contratos k ON k.contrato_id = pi.contrato_id
            JOIN estado_programacion ep ON ep.estado_programacion_id = pi.estado_programacion_id
            WHERE k.cliente_id = %s
              AND ep.descripcion_eprogramacion = 'PROGRAMADA'
            ORDER BY pi.fecha_programacion_pinstalacion
            LIMIT 1
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(cliente_q, (cliente_id,))
            ficha = cur.fetchone()
            if not ficha:
                return None
            cur.execute(contratos_q, (cliente_id,))
            ficha["contratos"] = cur.fetchall()
            cur.execute(garantias_q, (cliente_id,))
            ficha["garantias_con_saldo"] = [g for g in cur.fetchall() if g["pendiente"] > 0]
            cur.execute(instalacion_q, (TZ_NEGOCIO_PG, cliente_id))
            ficha["proxima_instalacion"] = cur.fetchone()
        return ficha

    # ------------------------------------------------------------------
    # Instalaciones, resumen, planes
    # ------------------------------------------------------------------
    def agenda(self, desde: datetime, hasta: datetime, limite: int) -> list[dict[str, Any]]:
        query = f"""
            SELECT
                to_char(pi.fecha_programacion_pinstalacion AT TIME ZONE %s,
                        'YYYY-MM-DD HH24:MI') AS fecha,
                c.cliente_id,
                c.nombre_cliente || ' ' || c.apellido_cliente AS cliente,
                c.telefono_cliente AS tel,
                NULLIF({_DOMICILIO_SQL}, '') AS domicilio,
                pi.tecnico_pinstalacion AS tecnico,
                pi.contrato_id,
                left(pi.notas_pinstalacion, 120) AS notas
            FROM programacion_instalaciones pi
            JOIN estado_programacion ep ON ep.estado_programacion_id = pi.estado_programacion_id
            JOIN contratos k ON k.contrato_id = pi.contrato_id
            JOIN clientes c ON c.cliente_id = k.cliente_id
            JOIN domicilios d ON d.domicilio_id = pi.domicilio_id
            WHERE ep.descripcion_eprogramacion = 'PROGRAMADA'
              AND pi.fecha_programacion_pinstalacion >= %s
              AND pi.fecha_programacion_pinstalacion < %s
            ORDER BY pi.fecha_programacion_pinstalacion
            LIMIT %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (TZ_NEGOCIO_PG, desde, hasta, limite))
            return cur.fetchall()

    def resumen(self, desde: datetime, hasta: datetime) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT count(*) FILTER (WHERE ec.descripcion_ecliente = 'ACTIVO') AS clientes_activos
                FROM clientes c
                JOIN estado_cliente ec ON ec.estado_cliente_id = c.estado_cliente_id
                """
            )
            out = dict(cur.fetchone())

            cur.execute(
                """
                SELECT ek.descripcion_econtrato AS estado, count(k.contrato_id) AS n
                FROM estado_contrato ek
                LEFT JOIN contratos k ON k.estado_contrato_id = ek.estado_contrato_id
                GROUP BY ek.descripcion_econtrato
                HAVING count(k.contrato_id) > 0
                ORDER BY ek.descripcion_econtrato
                """
            )
            out["contratos"] = {r["estado"]: r["n"] for r in cur.fetchall()}

            cur.execute(
                """
                SELECT count(*) AS deudores,
                       COALESCE(sum(saldo_cuenta), 0)::float AS deuda_total
                FROM cuenta
                WHERE saldo_cuenta > 0
                """
            )
            out.update(cur.fetchone())

            cur.execute(
                """
                SELECT count(*) AS instalaciones_proximos_7_dias
                FROM programacion_instalaciones pi
                JOIN estado_programacion ep
                  ON ep.estado_programacion_id = pi.estado_programacion_id
                WHERE ep.descripcion_eprogramacion = 'PROGRAMADA'
                  AND pi.fecha_programacion_pinstalacion >= %s
                  AND pi.fecha_programacion_pinstalacion < %s
                """,
                (desde, hasta),
            )
            out.update(cur.fetchone())
        return out

    def planes_vigentes(self) -> list[dict[str, Any]]:
        query = """
            SELECT
                p.plan_id AS id,
                p.nombre_plan AS plan,
                p.velocidad_mbps_plan AS mbps,
                pp.precio_mensual_pplanes::float AS precio
            FROM planes p
            JOIN estado_plan ep ON ep.estado_plan_id = p.estado_plan_id
            LEFT JOIN LATERAL (
                SELECT x.precio_mensual_pplanes
                FROM precios_planes x
                WHERE x.plan_id = p.plan_id
                  AND x.fecha_desde_pplanes <= now()
                  AND (x.fecha_hasta_pplanes IS NULL OR x.fecha_hasta_pplanes >= now())
                ORDER BY x.fecha_desde_pplanes DESC
                LIMIT 1
            ) pp ON TRUE
            WHERE ep.descripcion_eplan = 'ACTIVO'
            ORDER BY p.velocidad_mbps_plan
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query)
            return cur.fetchall()
