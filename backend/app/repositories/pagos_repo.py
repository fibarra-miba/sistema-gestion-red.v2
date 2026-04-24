# app/repositories/pagos_repo.py

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from psycopg import Connection


class PagosRepo:
    def __init__(self, conn: Connection):
        self.conn = conn

    # ---------------------------
    # FACTURA + PAGO CABECERA
    # ---------------------------
    def insert_factura_venta(
        self,
        cliente_id: int,
        estado_factura_venta_id: int,
        concepto: str,
        fecha_emision: datetime,
        fecha_vencimiento: datetime | None,
        importe_base,
        bonificacion,
        total,
    ) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO facturas_ventas (
                  cliente_id, concepto_fventas, estado_factura_venta_id,
                  fecha_emision_fventas, fecha_vencimiento_fventas,
                  importe_fventas, bonificacion_fventas, importe_total_fventas
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING factura_venta_id
                """,
                (
                    cliente_id,
                    concepto,
                    estado_factura_venta_id,
                    fecha_emision,
                    fecha_vencimiento,
                    importe_base,
                    bonificacion,
                    total,
                ),
            )
            return int(cur.fetchone()[0])

    def insert_pago(
        self,
        contrato_id: int,
        factura_venta_id: int,
        periodo_anio_pago: int,
        periodo_mes_pago: int,
        estado_pago_id: int,
    ) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pagos (
                  contrato_id, factura_ventas_id, periodo_anio_pago, periodo_mes_pago, estado_pago_id
                ) VALUES (%s,%s,%s,%s,%s)
                RETURNING pago_id
                """,
                (contrato_id, factura_venta_id, periodo_anio_pago, periodo_mes_pago, estado_pago_id),
            )
            return int(cur.fetchone()[0])

    def pago_periodo_existe(self, contrato_id: int, periodo_anio_pago: int, periodo_mes_pago: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT 1
                FROM pagos
                WHERE contrato_id=%s
                  AND periodo_anio_pago=%s
                  AND periodo_mes_pago=%s
                """,
                (contrato_id, periodo_anio_pago, periodo_mes_pago),
            )
            return cur.fetchone() is not None

    def get_pago(self, pago_id: int) -> dict | None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT p.pago_id, p.contrato_id, p.factura_ventas_id, p.periodo_anio_pago, p.periodo_mes_pago,
                       ep.descripcion_epago,
                       fv.cliente_id, fv.fecha_emision_fventas, fv.fecha_vencimiento_fventas,
                       fv.importe_fventas, fv.bonificacion_fventas, fv.importe_total_fventas
                FROM pagos p
                JOIN estado_pago ep ON ep.estado_pago_id = p.estado_pago_id
                JOIN facturas_ventas fv ON fv.factura_venta_id = p.factura_ventas_id
                WHERE p.pago_id = %s
                """,
                (pago_id,),
            )
            r = cur.fetchone()
            if not r:
                return None
            return {
                "pago_id": int(r[0]),
                "contrato_id": int(r[1]),
                "factura_venta_id": int(r[2]),
                "periodo_anio_pago": int(r[3]),
                "periodo_mes_pago": int(r[4]),
                "estado": r[5],
                "cliente_id": int(r[6]),
                "fecha_emision": r[7],
                "fecha_vencimiento": r[8],
                "importe_base": r[9],
                "bonificacion": r[10],
                "total": r[11],
            }

    def update_estado_pago(self, pago_id: int, estado_pago_id: int) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE pagos SET estado_pago_id=%s WHERE pago_id=%s",
                (estado_pago_id, pago_id),
            )

    # ---------------------------
    # MOVIMIENTOS DE PAGO + COMPROBANTES
    # ---------------------------
    def insert_pago_movimiento(
        self,
        pago_id: int,
        fecha_pago: datetime,
        monto,
        medio_pago_id: int,
        tipo_pago_id: int,
    ) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pagos_movimientos (
                  pago_id, fecha_pago, monto_pago, medio_pago_id, tipo_pago_id
                ) VALUES (%s,%s,%s,%s,%s)
                RETURNING pago_mov_id
                """,
                (pago_id, fecha_pago, monto, medio_pago_id, tipo_pago_id),
            )
            return int(cur.fetchone()[0])

    def insert_comprobante(self, pago_mov_id: int, url: str, mime: str | None, hash_: str | None) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pagos_comprobantes (pago_mov_id, comprobante_url, comprobante_mime, comprobante_hash)
                VALUES (%s,%s,%s,%s)
                RETURNING pago_comprobante_id
                """,
                (pago_mov_id, url, mime, hash_),
            )
            return int(cur.fetchone()[0])

    def sum_movimientos_pago(self, pago_id: int):
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT COALESCE(SUM(monto_pago),0) FROM pagos_movimientos WHERE pago_id=%s",
                (pago_id,),
            )
            return cur.fetchone()[0]

    def count_movimientos_pago(self, pago_id: int) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM pagos_movimientos WHERE pago_id=%s",
                (pago_id,),
            )
            return int(cur.fetchone()[0])

    def factura_tiene_movimientos(self, factura_venta_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT 1
                FROM pagos_movimientos pm
                JOIN pagos p ON p.pago_id = pm.pago_id
                WHERE p.factura_ventas_id = %s
                LIMIT 1
                """,
                (factura_venta_id,),
            )
            return cur.fetchone() is not None

    def list_movimientos(self, pago_id: int) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT pago_mov_id, pago_id, fecha_pago, monto_pago, medio_pago_id, tipo_pago_id
                FROM pagos_movimientos
                WHERE pago_id=%s
                ORDER BY fecha_pago ASC, pago_mov_id ASC
                """,
                (pago_id,),
            )
            rows = cur.fetchall()
            out = []
            for r in rows:
                out.append(
                    {
                        "pago_mov_id": int(r[0]),
                        "pago_id": int(r[1]),
                        "fecha_pago": r[2],
                        "monto_pago": r[3],
                        "medio_pago_id": int(r[4]),
                        "tipo_pago_id": int(r[5]),
                    }
                )
            return out

    def list_comprobantes_by_mov(self, pago_mov_id: int) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT pago_comprobante_id, comprobante_url, comprobante_mime, comprobante_hash, comprobante_created_at
                FROM pagos_comprobantes
                WHERE pago_mov_id=%s
                ORDER BY pago_comprobante_id ASC
                """,
                (pago_mov_id,),
            )
            rows = cur.fetchall()
            return [
                {
                    "pago_comprobante_id": int(r[0]),
                    "comprobante_url": r[1],
                    "comprobante_mime": r[2],
                    "comprobante_hash": r[3],
                    "comprobante_created_at": r[4],
                }
                for r in rows
            ]

    # ---------------------------
    # RECIBOS
    # ---------------------------
    def insert_recibo(
        self,
        pago_mov_id: int,
        comprobante_transferencia: str | None,
        recepcion_transferencia: bool,
        importe_recibo,
        fecha_recibo: datetime,
    ) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recibos (
                  pago_mov_id,
                  comprobante_transferencia_recibo,
                  recepcion_transferencia_recibo,
                  importe_recibo,
                  fecha_recibo
                ) VALUES (%s,%s,%s,%s,%s)
                RETURNING recibo_id
                """,
                (
                    pago_mov_id,
                    comprobante_transferencia,
                    recepcion_transferencia,
                    importe_recibo,
                    fecha_recibo,
                ),
            )
            return int(cur.fetchone()[0])

    def insert_detalle_recibo(self, recibo_id: int, factura_venta_id: int) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO detalle_recibos (recibo_id, factura_venta_id)
                VALUES (%s,%s)
                RETURNING det_recibo_id
                """,
                (recibo_id, factura_venta_id),
            )
            return int(cur.fetchone()[0])

    def get_recibo_by_movimiento(self, pago_mov_id: int) -> dict | None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT r.recibo_id,
                       r.pago_mov_id,
                       r.comprobante_transferencia_recibo,
                       r.recepcion_transferencia_recibo,
                       r.importe_recibo,
                       r.fecha_recibo
                FROM recibos r
                WHERE r.pago_mov_id = %s
                """,
                (pago_mov_id,),
            )
            row = cur.fetchone()
            if not row:
                return None

            return {
                "recibo_id": int(row[0]),
                "pago_mov_id": int(row[1]),
                "comprobante_transferencia_recibo": row[2],
                "recepcion_transferencia_recibo": bool(row[3]) if row[3] is not None else None,
                "importe_recibo": row[4],
                "fecha_recibo": row[5],
            }

    # ---------------------------
    # CONSULTA LISTADO POR CONTRATO
    # ---------------------------
    def list_pagos_by_contrato(
        self,
        contrato_id: int,
        anio: int | None,
        mes: int | None,
        estado: str | None,
        limit: int,
        offset: int,
    ) -> list[dict]:
        params = {"contrato_id": contrato_id, "limit": limit, "offset": offset}
        where = ["p.contrato_id = %(contrato_id)s"]

        if anio is not None:
            where.append("p.periodo_anio_pago = %(anio)s")
            params["anio"] = anio

        if mes is not None:
            where.append("p.periodo_mes_pago = %(mes)s")
            params["mes"] = mes

        with self.conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT p.pago_id,
                       p.periodo_anio_pago,
                       p.periodo_mes_pago,
                       ep.descripcion_epago AS estado_persistido,
                       fv.fecha_emision_fventas,
                       fv.fecha_vencimiento_fventas,
                       fv.importe_total_fventas,
                       COALESCE(SUM(pm.monto_pago), 0) AS total_pagado
                FROM pagos p
                JOIN estado_pago ep ON ep.estado_pago_id = p.estado_pago_id
                JOIN facturas_ventas fv ON fv.factura_venta_id = p.factura_ventas_id
                LEFT JOIN pagos_movimientos pm ON pm.pago_id = p.pago_id
                WHERE {' AND '.join(where)}
                GROUP BY
                    p.pago_id,
                    p.periodo_anio_pago,
                    p.periodo_mes_pago,
                    ep.descripcion_epago,
                    fv.fecha_emision_fventas,
                    fv.fecha_vencimiento_fventas,
                    fv.importe_total_fventas
                ORDER BY p.periodo_anio_pago DESC, p.periodo_mes_pago DESC, p.pago_id DESC
                LIMIT %(limit)s OFFSET %(offset)s
                """,
                params,
            )
            rows = cur.fetchall()

        out = []
        for r in rows:
            total_factura = Decimal(r[6])
            total_pagado = Decimal(r[7])
            if estado is not None:
                estado_calc = "PENDIENTE"
                if total_pagado > Decimal("0.00") and total_pagado < total_factura:
                    estado_calc = "PARCIAL"
                elif total_pagado >= total_factura:
                    estado_calc = "PAGADO"

                if estado_calc != estado:
                    continue

            out.append(
                {
                    "pago_id": int(r[0]),
                    "periodo_anio_pago": int(r[1]),
                    "periodo_mes_pago": int(r[2]),
                    "estado_persistido": r[3],
                    "fecha_emision": r[4],
                    "fecha_vencimiento": r[5],
                    "total_factura": total_factura,
                    "total_pagado": total_pagado,
                }
            )

        return out

    # ---------------------------
    # PATCH FACTURA (bonificación)
    # ---------------------------
    def get_factura(self, factura_venta_id: int) -> dict | None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT factura_venta_id, cliente_id, fecha_emision_fventas, fecha_vencimiento_fventas,
                       importe_fventas, bonificacion_fventas, importe_total_fventas
                FROM facturas_ventas
                WHERE factura_venta_id=%s
                """,
                (factura_venta_id,),
            )
            r = cur.fetchone()
            if not r:
                return None
            return {
                "factura_venta_id": int(r[0]),
                "cliente_id": int(r[1]),
                "fecha_emision": r[2],
                "fecha_vencimiento": r[3],
                "importe_base": r[4],
                "bonificacion": r[5],
                "total": r[6],
            }

    def update_factura_bonificacion(self, factura_venta_id: int, bonificacion, nuevo_total) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE facturas_ventas
                SET bonificacion_fventas=%s, importe_total_fventas=%s
                WHERE factura_venta_id=%s
                """,
                (bonificacion, nuevo_total, factura_venta_id),
            )
