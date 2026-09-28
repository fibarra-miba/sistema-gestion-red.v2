# app/repositories/instalaciones_repo.py

from __future__ import annotations

from datetime import datetime
from typing import Optional

from psycopg import Connection
from psycopg.rows import dict_row


# SELECT enriquecido: suma nombre del cliente y datos del domicilio para que la
# UI no muestre solo ids. Las JOIN son INNER (contrato/domicilio son FK NOT NULL).
_INSTALACION_SELECT_BASE = """
    SELECT
        i.*,
        c.nombre_cliente   AS cliente_nombre,
        c.apellido_cliente AS cliente_apellido,
        d.complejo, d.torre, d.piso, d.depto, d.calle, d.numero
    FROM instalaciones i
    JOIN contratos  ct ON ct.contrato_id  = i.contrato_id
    JOIN clientes   c  ON c.cliente_id    = ct.cliente_id
    JOIN domicilios d  ON d.domicilio_id  = i.domicilio_id
"""


class InstalacionesRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ==========================================================
    # RESUMEN (DASHBOARD)
    # ==========================================================

    def resumen(self) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                  COUNT(*) FILTER (WHERE ei.descripcion_einstalacion = 'PENDIENTE') AS pendientes,
                  COUNT(*) FILTER (WHERE ei.descripcion_einstalacion = 'FALLIDA') AS fallidas
                FROM instalaciones i
                JOIN estado_instalacion ei ON ei.estado_instalacion_id = i.estado_instalacion_id
                """
            )
            counts = cur.fetchone()

            cur.execute(
                """
                SELECT COUNT(*) AS programadas_hoy
                FROM programacion_instalaciones p
                JOIN estado_programacion ep ON ep.estado_programacion_id = p.estado_programacion_id
                WHERE ep.descripcion_eprogramacion = 'PROGRAMADA'
                  AND p.fecha_programacion_pinstalacion::date = CURRENT_DATE
                """
            )
            programadas_hoy = int(cur.fetchone()["programadas_hoy"])

            cur.execute(
                """
                SELECT
                  p.programacion_id,
                  p.contrato_id,
                  p.fecha_programacion_pinstalacion AS fecha_programacion,
                  p.tecnico_pinstalacion AS tecnico,
                  cl.nombre_cliente,
                  cl.apellido_cliente
                FROM programacion_instalaciones p
                JOIN estado_programacion ep ON ep.estado_programacion_id = p.estado_programacion_id
                JOIN contratos c ON c.contrato_id = p.contrato_id
                JOIN clientes cl ON cl.cliente_id = c.cliente_id
                WHERE ep.descripcion_eprogramacion = 'PROGRAMADA'
                  AND p.fecha_programacion_pinstalacion::date = CURRENT_DATE
                ORDER BY p.fecha_programacion_pinstalacion
                LIMIT 8
                """
            )
            agenda_hoy = cur.fetchall()

        return {
            "pendientes": int(counts["pendientes"]),
            "fallidas": int(counts["fallidas"]),
            "programadas_hoy": programadas_hoy,
            "agenda_hoy": agenda_hoy,
        }

    # ==========================================================
    # CATALOGOS / ESTADOS
    # ==========================================================

    def get_estado_programacion_id(self, descripcion: str) -> Optional[int]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT estado_programacion_id
                FROM estado_programacion
                WHERE descripcion_eprogramacion = %s
                LIMIT 1
                """,
                (descripcion,),
            )
            row = cur.fetchone()
            return int(row[0]) if row else None

    def get_estado_instalacion_id(self, descripcion: str) -> Optional[int]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT estado_instalacion_id
                FROM estado_instalacion
                WHERE descripcion_einstalacion = %s
                LIMIT 1
                """,
                (descripcion,),
            )
            row = cur.fetchone()
            return int(row[0]) if row else None

    def get_estado_programacion_descripcion(
        self, estado_programacion_id: int
    ) -> Optional[str]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT descripcion_eprogramacion
                FROM estado_programacion
                WHERE estado_programacion_id = %s
                LIMIT 1
                """,
                (estado_programacion_id,),
            )
            row = cur.fetchone()
            return str(row[0]) if row else None

    def get_estado_instalacion_descripcion(
        self, estado_instalacion_id: int
    ) -> Optional[str]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT descripcion_einstalacion
                FROM estado_instalacion
                WHERE estado_instalacion_id = %s
                LIMIT 1
                """,
                (estado_instalacion_id,),
            )
            row = cur.fetchone()
            return str(row[0]) if row else None

    # ==========================================================
    # PROGRAMACION
    # ==========================================================

    def create_programacion(
        self,
        contrato_id: int,
        domicilio_id: int,
        fecha_programacion_pinstalacion: datetime,
        estado_programacion_id: int,
        tecnico_pinstalacion: str | None,
        notas_pinstalacion: str | None,
    ) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO programacion_instalaciones (
                    domicilio_id,
                    contrato_id,
                    fecha_programacion_pinstalacion,
                    estado_programacion_id,
                    tecnico_pinstalacion,
                    notas_pinstalacion
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    domicilio_id,
                    contrato_id,
                    fecha_programacion_pinstalacion,
                    estado_programacion_id,
                    tecnico_pinstalacion,
                    notas_pinstalacion,
                ),
            )
            return cur.fetchone()

    def get_programacion_by_id(self, programacion_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT *
                FROM programacion_instalaciones
                WHERE programacion_id = %s
                """,
                (programacion_id,),
            )
            return cur.fetchone()

    def list_programaciones(
        self,
        contrato_id: int | None = None,
        domicilio_id: int | None = None,
        estado_programacion_id: int | None = None,
        tecnico_pinstalacion: str | None = None,
    ) -> list[dict]:
        where = []
        params: list = []

        if contrato_id is not None:
            where.append("contrato_id = %s")
            params.append(contrato_id)

        if domicilio_id is not None:
            where.append("domicilio_id = %s")
            params.append(domicilio_id)

        if estado_programacion_id is not None:
            where.append("estado_programacion_id = %s")
            params.append(estado_programacion_id)

        if tecnico_pinstalacion is not None:
            where.append("tecnico_pinstalacion ILIKE %s")
            params.append(f"%{tecnico_pinstalacion}%")

        query = """
            SELECT *
            FROM programacion_instalaciones
        """
        if where:
            query += " WHERE " + " AND ".join(where)

        query += " ORDER BY programacion_id ASC"

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def update_programacion(
        self,
        programacion_id: int,
        fecha_programacion_pinstalacion: datetime,
        tecnico_pinstalacion: str | None,
        notas_pinstalacion: str | None,
    ) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE programacion_instalaciones
                SET fecha_programacion_pinstalacion = %s,
                    tecnico_pinstalacion = %s,
                    notas_pinstalacion = %s
                WHERE programacion_id = %s
                """,
                (
                    fecha_programacion_pinstalacion,
                    tecnico_pinstalacion,
                    notas_pinstalacion,
                    programacion_id,
                ),
            )

    def insert_reprogramacion(
        self,
        programacion_id: int,
        fecha_reprogramada_anterior: datetime | None,
        fecha_reprogramada_nueva: datetime,
        tecnico_reprogramacion: str | None,
        motivo_reprogramacion: str | None,
        notas_reprogramacion: str | None,
    ) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO reprogramacion_instalaciones (
                    programacion_id,
                    fecha_reprogramada_anterior,
                    fecha_reprogramada_nueva,
                    tecnico_reprogramacion,
                    motivo_reprogramacion,
                    notas_reprogramacion
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    programacion_id,
                    fecha_reprogramada_anterior,
                    fecha_reprogramada_nueva,
                    tecnico_reprogramacion,
                    motivo_reprogramacion,
                    notas_reprogramacion,
                ),
            )
            return cur.fetchone()

    def list_reprogramaciones_by_programacion(self, programacion_id: int) -> list[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT *
                FROM reprogramacion_instalaciones
                WHERE programacion_id = %s
                ORDER BY reprogramacion_id ASC
                """,
                (programacion_id,),
            )
            return cur.fetchall()

    # ==========================================================
    # INSTALACIONES
    # ==========================================================

    def create_instalacion(
        self,
        programacion_id: int,
        contrato_id: int,
        domicilio_id: int,
        codigo_instalacion: str | None,
        fecha_instalacion: datetime,
        estado_instalacion_id: int,
        observacion_instalacion: str | None,
    ) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO instalaciones (
                    programacion_id,
                    contrato_id,
                    domicilio_id,
                    codigo_instalacion,
                    fecha_instalacion,
                    estado_instalacion_id,
                    observacion_instalacion
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    programacion_id,
                    contrato_id,
                    domicilio_id,
                    codigo_instalacion,
                    fecha_instalacion,
                    estado_instalacion_id,
                    observacion_instalacion,
                ),
            )
            return cur.fetchone()

    def get_instalacion_by_id(self, instalacion_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                _INSTALACION_SELECT_BASE + " WHERE i.instalacion_id = %s",
                (instalacion_id,),
            )
            return cur.fetchone()

    def get_instalacion_by_programacion(self, programacion_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT *
                FROM instalaciones
                WHERE programacion_id = %s
                """,
                (programacion_id,),
            )
            return cur.fetchone()

    def list_instalaciones(
        self,
        contrato_id: int | None = None,
        domicilio_id: int | None = None,
        estado_instalacion_id: int | None = None,
        programacion_id: int | None = None,
    ) -> list[dict]:
        where = []
        params: list = []

        if contrato_id is not None:
            where.append("i.contrato_id = %s")
            params.append(contrato_id)

        if domicilio_id is not None:
            where.append("i.domicilio_id = %s")
            params.append(domicilio_id)

        if estado_instalacion_id is not None:
            where.append("i.estado_instalacion_id = %s")
            params.append(estado_instalacion_id)

        if programacion_id is not None:
            where.append("i.programacion_id = %s")
            params.append(programacion_id)

        query = _INSTALACION_SELECT_BASE
        if where:
            query += " WHERE " + " AND ".join(where)

        query += " ORDER BY i.instalacion_id ASC"

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def update_instalacion_estado(
        self,
        instalacion_id: int,
        estado_instalacion_id: int,
        fecha_instalacion: datetime | None = None,
    ) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE instalaciones
                SET estado_instalacion_id = %s,
                    fecha_instalacion = COALESCE(%s, fecha_instalacion)
                WHERE instalacion_id = %s
                """,
                (estado_instalacion_id, fecha_instalacion, instalacion_id),
            )

    def update_instalacion(self, instalacion_id: int, fields: dict) -> Optional[dict]:
        if not fields:
            return self.get_instalacion_by_id(instalacion_id)

        set_clause = ", ".join(f"{key} = %s" for key in fields.keys())
        values = list(fields.values())
        values.append(instalacion_id)

        with self.conn.cursor() as cur:
            cur.execute(
                f"UPDATE instalaciones SET {set_clause} WHERE instalacion_id = %s",
                values,
            )
        return self.get_instalacion_by_id(instalacion_id)

    def update_programacion_estado(
        self,
        programacion_id: int,
        estado_programacion_id: int,
    ) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE programacion_instalaciones
                SET estado_programacion_id = %s
                WHERE programacion_id = %s
                """,
                (estado_programacion_id, programacion_id),
            )

    # ==========================================================
    # DETALLE INSTALACION
    # ==========================================================

    def create_detalle_instalacion(
        self,
        instalacion_id: int,
        producto_id: int,
        descripcion_dinstalacion: str | None,
        cantidad_dinstalacion: float,
        unidad_dinstalacion: str,
        observacion_dinstalacion: str | None,
    ) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO detalle_instalacion (
                    instalacion_id,
                    producto_id,
                    descripcion_dinstalacion,
                    cantidad_dinstalacion,
                    unidad_dinstalacion,
                    observacion_dinstalacion
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    instalacion_id,
                    producto_id,
                    descripcion_dinstalacion,
                    cantidad_dinstalacion,
                    unidad_dinstalacion,
                    observacion_dinstalacion,
                ),
            )
            return cur.fetchone()

    def list_detalles_instalacion(self, instalacion_id: int) -> list[dict]:
        # Enriquecido con el costo de la salida de stock imputada a cada línea
        # (gasto de materiales). NULL si la línea no descontó stock.
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    di.*,
                    ms.costo_unitario_mstock AS costo_unitario_dinstalacion,
                    (di.cantidad_dinstalacion * ms.costo_unitario_mstock) AS costo_total_dinstalacion
                FROM detalle_instalacion di
                LEFT JOIN movimiento_stock ms
                       ON ms.det_instalacion_id = di.det_instalacion_id
                      AND ms.tipo_mov_id = (
                          SELECT tipo_mov_id FROM tipo_movimiento_stock
                          WHERE codigo_tmstock = 'SALIDA_INSTALACION'
                      )
                WHERE di.instalacion_id = %s
                ORDER BY di.det_instalacion_id ASC
                """,
                (instalacion_id,),
            )
            return cur.fetchall()

    # ==========================================================
    # GARANTIA
    # ==========================================================

    def create_garantia(
        self,
        instalacion_id: int,
        contrato_id: int,
        producto_id: int,
        fecha_inicio_garantia: datetime,
        fecha_fin_garantia: datetime | None,
        estado_garantia_id: int,
        motivo_garantia: str | None,
        resolucion_garantia: str | None,
        monto_garantia: float | None = None,
    ) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO garantia (
                    instalacion_id,
                    contrato_id,
                    producto_id,
                    monto_garantia,
                    fecha_inicio_garantia,
                    fecha_fin_garantia,
                    estado_garantia_id,
                    motivo_garantia,
                    resolucion_garantia
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    instalacion_id,
                    contrato_id,
                    producto_id,
                    monto_garantia,
                    fecha_inicio_garantia,
                    fecha_fin_garantia,
                    estado_garantia_id,
                    motivo_garantia,
                    resolucion_garantia,
                ),
            )
            return cur.fetchone()

    # SELECT enriquecido con producto + estado + cliente (evita N+1 en el frontend).
    _SELECT_GARANTIA = """
        SELECT
            g.garantia_id,
            g.instalacion_id,
            g.contrato_id,
            g.producto_id,
            g.monto_garantia,
            g.fecha_inicio_garantia,
            g.fecha_fin_garantia,
            g.estado_garantia_id,
            g.motivo_garantia,
            g.resolucion_garantia,
            g.fecha_creacion_garantia,
            p.nombre_producto,
            p.marca_producto,
            p.modelo_producto,
            eg.descripcion_egarantia,
            cl.nombre_cliente AS cliente_nombre,
            cl.apellido_cliente AS cliente_apellido
        FROM garantia g
        JOIN productos p ON p.producto_id = g.producto_id
        JOIN estado_garantia eg ON eg.estado_garantia_id = g.estado_garantia_id
        JOIN contratos c ON c.contrato_id = g.contrato_id
        JOIN clientes cl ON cl.cliente_id = c.cliente_id
    """

    def get_garantia_by_id(self, garantia_id: int) -> Optional[dict]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(self._SELECT_GARANTIA + " WHERE g.garantia_id = %s", (garantia_id,))
            return cur.fetchone()

    def list_garantias(
        self,
        instalacion_id: int | None = None,
        contrato_id: int | None = None,
        estado_garantia_id: int | None = None,
        cliente_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        where = []
        params: list = []

        if instalacion_id is not None:
            where.append("g.instalacion_id = %s")
            params.append(instalacion_id)
        if contrato_id is not None:
            where.append("g.contrato_id = %s")
            params.append(contrato_id)
        if estado_garantia_id is not None:
            where.append("g.estado_garantia_id = %s")
            params.append(estado_garantia_id)
        if cliente_id is not None:
            where.append("c.cliente_id = %s")
            params.append(cliente_id)

        query = self._SELECT_GARANTIA
        if where:
            query += " WHERE " + " AND ".join(where)
        query += " ORDER BY g.garantia_id DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def update_garantia(self, garantia_id: int, fields: dict) -> Optional[dict]:
        if not fields:
            return self.get_garantia_by_id(garantia_id)

        set_clause = ", ".join(f"{key} = %s" for key in fields.keys())
        values = list(fields.values())
        values.append(garantia_id)

        with self.conn.cursor() as cur:
            cur.execute(
                f"UPDATE garantia SET {set_clause} WHERE garantia_id = %s",
                values,
            )
        return self.get_garantia_by_id(garantia_id)

    def get_estado_garantia_id(self, descripcion: str) -> Optional[int]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT estado_garantia_id FROM estado_garantia WHERE descripcion_egarantia = %s",
                (descripcion,),
            )
            row = cur.fetchone()
            return int(row[0]) if row else None

    def exists_estado_garantia(self, estado_garantia_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM estado_garantia WHERE estado_garantia_id = %s",
                (estado_garantia_id,),
            )
            return cur.fetchone() is not None

    def producto_en_detalles(self, instalacion_id: int, producto_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT 1 FROM detalle_instalacion
                WHERE instalacion_id = %s AND producto_id = %s
                LIMIT 1
                """,
                (instalacion_id, producto_id),
            )
            return cur.fetchone() is not None

    def get_producto_tipo_codigo(self, producto_id: int) -> Optional[str]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT tp.codigo_tproducto
                FROM productos p
                JOIN tipo_producto tp ON tp.tipo_producto_id = p.tipo_producto_id
                WHERE p.producto_id = %s
                """,
                (producto_id,),
            )
            row = cur.fetchone()
            return row[0] if row else None

    def exists_garantia_activa(
        self,
        instalacion_id: int,
        producto_id: int,
        estado_activa_id: int,
        exclude_garantia_id: int | None = None,
    ) -> bool:
        query = """
            SELECT 1 FROM garantia
            WHERE instalacion_id = %s AND producto_id = %s AND estado_garantia_id = %s
        """
        params: list = [instalacion_id, producto_id, estado_activa_id]

        if exclude_garantia_id is not None:
            query += " AND garantia_id != %s"
            params.append(exclude_garantia_id)

        query += " LIMIT 1"

        with self.conn.cursor() as cur:
            cur.execute(query, tuple(params))
            return cur.fetchone() is not None

    # Resumen del depósito reembolsable: lo comprometido (ACTIVAS), lo devuelto
    # y lo retenido. Resuelve estados por descripcion_egarantia, no por id.
    def resumen_garantias(self) -> dict:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    COALESCE(SUM(g.monto_garantia) FILTER (
                        WHERE eg.descripcion_egarantia = 'ACTIVA'
                    ), 0) AS comprometido,
                    COUNT(*) FILTER (
                        WHERE eg.descripcion_egarantia = 'ACTIVA'
                    ) AS cantidad_activas,
                    COALESCE(SUM(g.monto_garantia) FILTER (
                        WHERE eg.descripcion_egarantia = 'DEVUELTA'
                    ), 0) AS devuelto,
                    COALESCE(SUM(g.monto_garantia) FILTER (
                        WHERE eg.descripcion_egarantia = 'RETENIDA'
                    ), 0) AS retenido
                FROM garantia g
                JOIN estado_garantia eg ON eg.estado_garantia_id = g.estado_garantia_id
                """
            )
            row = cur.fetchone()

        return {
            "comprometido": float(row["comprometido"]),
            "cantidad_activas": int(row["cantidad_activas"]),
            "devuelto": float(row["devuelto"]),
            "retenido": float(row["retenido"]),
        }
