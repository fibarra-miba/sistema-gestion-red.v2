# app/repositories/cuentas_repo.py

from __future__ import annotations

from typing import Optional, List
from decimal import Decimal
from datetime import datetime

import psycopg
from psycopg.rows import dict_row


class CuentaRepo:
    """
    Repo de cuenta corriente.
    Mantiene compatibilidad: nombres cortos (CuentaRepo) y métodos usados por services/routes.
    """

    def __init__(self, conn: psycopg.Connection):
        self.conn = conn

    # =========================
    # CREATE
    # =========================
    def create(self, cliente_id: int, estado_cuenta_id: int) -> dict:
        query = """
            INSERT INTO cuenta (cliente_id, estado_cuenta_id, saldo_cuenta)
            VALUES (%s, %s, 0)
            RETURNING *
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (cliente_id, estado_cuenta_id))
            return cur.fetchone()

    # Aliases usados por CuentaCorrienteService (legacy)
    def create_cuenta(self, cliente_id: int, estado_cuenta_id: int) -> dict:
        return self.create(cliente_id, estado_cuenta_id)

    # =========================
    # READ
    # =========================
    def get_by_cliente(self, cliente_id: int) -> Optional[dict]:
        query = "SELECT * FROM cuenta WHERE cliente_id = %s"
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (cliente_id,))
            return cur.fetchone()

    def get_cuenta_by_cliente(self, cliente_id: int) -> Optional[dict]:
        return self.get_by_cliente(cliente_id)

    # =========================
    # UPDATE SALDO
    # =========================
    def update_saldo(self, cuenta_id: int, nuevo_saldo: Decimal) -> None:
        query = "UPDATE cuenta SET saldo_cuenta = %s WHERE cuenta_id = %s"
        with self.conn.cursor() as cur:
            cur.execute(query, (nuevo_saldo, cuenta_id))

    # =========================
    # DETALLE CUENTA
    # =========================
    def insert_detalle(
        self,
        cuenta_id: int,
        tipo_mov_det_cuenta_id: int,
        importe: Decimal,
        factura_venta_id: Optional[int] = None,
        pago_id: Optional[int] = None,
        observacion: Optional[str] = None,
    ) -> dict:
        query = """
            INSERT INTO detalle_cuenta (
                cuenta_id, tipo_mov_det_cuenta_id, factura_venta_id, pago_id,
                importe_cuenta, observacion_cuenta
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                query,
                (cuenta_id, tipo_mov_det_cuenta_id, factura_venta_id, pago_id, importe, observacion),
            )
            return cur.fetchone()

    def insert_detalle_cuenta(
        self,
        cuenta_id: int,
        tipo_mov_det_cuenta_id: int,
        importe: Decimal,
        factura_venta_id: Optional[int],
        pago_id: Optional[int],
        observacion: Optional[str],
    ) -> dict:
        return self.insert_detalle(
            cuenta_id=cuenta_id,
            tipo_mov_det_cuenta_id=tipo_mov_det_cuenta_id,
            importe=importe,
            factura_venta_id=factura_venta_id,
            pago_id=pago_id,
            observacion=observacion,
        )

    def list_movimientos(self, cuenta_id: int, limit: int = 50, offset: int = 0) -> List[dict]:
        query = """
            SELECT *
            FROM detalle_cuenta
            WHERE cuenta_id = %s
            ORDER BY fecha_movimiento_cuenta DESC, det_cuenta_id DESC
            LIMIT %s OFFSET %s
        """
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (cuenta_id, limit, offset))
            return cur.fetchall()

    # =========================
    # CONSULTA PARA ENDPOINT /clientes/{id}/cuenta/movimientos
    # =========================
    def get_cuenta_movimientos(
        self,
        cliente_id: int,
        desde: str | None,
        hasta: str | None,
        tipo: str | None,
        limit: int,
        offset: int,
    ) -> dict:
        """
        Devuelve:
          { "cuenta_id": ..., "saldo_cuenta": ..., "movimientos": [...] }

        Filters:
          - desde/hasta: se interpretan como date/datetime parseables por Postgres
          - tipo: codigo_tipo_mov_det_cuenta (FACTURA|PAGO|AJUSTE_D|AJUSTE_H)
        """
        cta = self.get_by_cliente(cliente_id)
        if not cta:
            return {"cuenta_id": None, "saldo_cuenta": Decimal("0.00"), "movimientos": []}

        where = ["dc.cuenta_id = %(cuenta_id)s"]
        params = {"cuenta_id": cta["cuenta_id"], "limit": limit, "offset": offset}

        if desde:
            where.append("dc.fecha_movimiento_cuenta >= %(desde)s")
            params["desde"] = desde
        if hasta:
            where.append("dc.fecha_movimiento_cuenta <= %(hasta)s")
            params["hasta"] = hasta
        if tipo:
            where.append("tm.codigo_tipo_mov_det_cuenta = %(tipo)s")
            params["tipo"] = tipo

        query = f"""
            SELECT
              dc.det_cuenta_id,
              dc.fecha_movimiento_cuenta,
              tm.codigo_tipo_mov_det_cuenta,
              tm.signo_tipo_mov_det_cuenta,
              dc.importe_cuenta,
              dc.factura_venta_id,
              dc.pago_id,
              dc.observacion_cuenta
            FROM detalle_cuenta dc
            JOIN tipo_movimiento_detalle_cuenta tm
              ON tm.tipo_mov_det_cuenta_id = dc.tipo_mov_det_cuenta_id
            WHERE {' AND '.join(where)}
            ORDER BY dc.fecha_movimiento_cuenta DESC, dc.det_cuenta_id DESC
            LIMIT %(limit)s OFFSET %(offset)s
        """
        with self.conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

        movimientos = [
            {
                "det_cuenta_id": int(r[0]),
                "fecha": r[1],
                "tipo": r[2],
                "signo": r[3],
                "importe": r[4],
                "factura_venta_id": r[5],
                "pago_id": r[6],
                "observacion": r[7],
            }
            for r in rows
        ]

        return {
            "cuenta_id": cta["cuenta_id"],
            "saldo_cuenta": cta["saldo_cuenta"],
            "movimientos": movimientos,
        }


# Backward-compat alias (si en otra parte del repo se importa CuentaRepository)
CuentaRepository = CuentaRepo