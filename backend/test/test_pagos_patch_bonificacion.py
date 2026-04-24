from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

import pytest


def _get_contrato_activo(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT contrato_id
              FROM contratos
             WHERE estado_contrato_id = 3
             ORDER BY contrato_id ASC
             LIMIT 1
            """
        )
        row = cur.fetchone()
        assert row is not None, "Seed: falta al menos 1 contrato ACTIVO (estado_contrato_id=3)"
        return int(row[0])


def _get_medio_pago_id(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute("SELECT medio_pago_id FROM medios_pagos ORDER BY medio_pago_id ASC LIMIT 1")
        row = cur.fetchone()
        assert row is not None
        return int(row[0])


def _get_tipo_pago_id(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute("SELECT tipo_pago_id FROM tipo_pago ORDER BY tipo_pago_id ASC LIMIT 1")
        row = cur.fetchone()
        assert row is not None
        return int(row[0])


async def _generar_pago_periodo(admin_client, contrato_id: int, bonificacion_previa=0):
    today = date.today()
    body = {
        "periodo_anio_pago": today.year,
        "periodo_mes_pago": today.month,
        "fecha_emision": str(today),
        "fecha_vencimiento": None,
        "bonificacion_previa": str(bonificacion_previa),
    }
    r = await admin_client.post(f"/contratos/{contrato_id}/pagos/generar", json=body)
    assert r.status_code == 200, r.text
    return r.json()["pago"]


@pytest.mark.anyio
async def test_patch_bonificacion_ajuste_h_reduce_deuda(admin_client, db_conn):
    contrato_id = _get_contrato_activo(db_conn)

    pago = await _generar_pago_periodo(admin_client, contrato_id, bonificacion_previa=0)
    factura_id = int(pago["factura_venta_id"])
    total_old = Decimal(str(pago["total_factura"]))
    assert total_old > 0

    bonif_new = Decimal("100.00")
    r = await admin_client.patch(
        f"/facturas-ventas/{factura_id}",
        json={"bonificacion_fventas": str(bonif_new)},
    )
    assert r.status_code == 200, r.text
    out = r.json()

    assert int(out["factura_venta_id"]) == factura_id
    assert Decimal(str(out["total_old"])) == total_old

    total_new = Decimal(str(out["total_new"]))
    diff = Decimal(str(out["diff"]))

    assert total_new == max(Decimal("0.00"), total_old - bonif_new)
    assert diff == total_new - total_old
    assert diff < 0

    with db_conn.cursor() as cur:
        cur.execute("SELECT cliente_id FROM facturas_ventas WHERE factura_venta_id = %s", (factura_id,))
        row = cur.fetchone()
        assert row is not None
        cliente_id = int(row[0])

    r_cta = await admin_client.get(f"/clientes/{cliente_id}/cuenta")
    assert r_cta.status_code == 200, r_cta.text
    saldo = Decimal(str(r_cta.json()["saldo_cuenta"]))
    assert saldo == total_old + diff


@pytest.mark.anyio
async def test_patch_bonificacion_ajuste_d_aumenta_deuda(admin_client, db_conn):
    contrato_id = _get_contrato_activo(db_conn)

    pago = await _generar_pago_periodo(admin_client, contrato_id, bonificacion_previa=Decimal("50.00"))
    factura_id = int(pago["factura_venta_id"])
    total_old = Decimal(str(pago["total_factura"]))

    bonif_new = Decimal("0.00")
    r = await admin_client.patch(
        f"/facturas-ventas/{factura_id}",
        json={"bonificacion_fventas": str(bonif_new)},
    )
    assert r.status_code == 200, r.text
    out = r.json()

    total_new = Decimal(str(out["total_new"]))
    diff = Decimal(str(out["diff"]))

    assert diff == total_new - total_old
    assert diff > 0

    with db_conn.cursor() as cur:
        cur.execute("SELECT cliente_id FROM facturas_ventas WHERE factura_venta_id = %s", (factura_id,))
        row = cur.fetchone()
        assert row is not None
        cliente_id = int(row[0])

    r_cta = await admin_client.get(f"/clientes/{cliente_id}/cuenta")
    assert r_cta.status_code == 200, r_cta.text
    saldo = Decimal(str(r_cta.json()["saldo_cuenta"]))

    assert saldo == total_old + diff
    assert saldo > total_old


@pytest.mark.anyio
async def test_patch_bonificacion_diff_cero_no_mueve_cuenta(admin_client, db_conn):
    contrato_id = _get_contrato_activo(db_conn)

    pago = await _generar_pago_periodo(admin_client, contrato_id, bonificacion_previa=0)
    factura_id = int(pago["factura_venta_id"])
    total_old = Decimal(str(pago["total_factura"]))

    with db_conn.cursor() as cur:
        cur.execute("SELECT cliente_id, bonificacion_fventas FROM facturas_ventas WHERE factura_venta_id = %s", (factura_id,))
        row = cur.fetchone()
        assert row is not None
        cliente_id = int(row[0])
        bonif_actual = Decimal(str(row[1]))

    r_cta0 = await admin_client.get(f"/clientes/{cliente_id}/cuenta")
    assert r_cta0.status_code == 200, r_cta0.text
    saldo0 = Decimal(str(r_cta0.json()["saldo_cuenta"]))

    r = await admin_client.patch(
        f"/facturas-ventas/{factura_id}",
        json={"bonificacion_fventas": str(bonif_actual)},
    )
    assert r.status_code == 200, r.text
    out = r.json()

    assert Decimal(str(out["total_old"])) == total_old
    assert Decimal(str(out["diff"])) == Decimal("0")

    r_cta1 = await admin_client.get(f"/clientes/{cliente_id}/cuenta")
    assert r_cta1.status_code == 200, r_cta1.text
    saldo1 = Decimal(str(r_cta1.json()["saldo_cuenta"]))

    assert saldo1 == saldo0


@pytest.mark.anyio
async def test_patch_bonificacion_con_pagos_registrados_422(admin_client, db_conn):
    contrato_id = _get_contrato_activo(db_conn)
    medio_pago_id = _get_medio_pago_id(db_conn)
    tipo_pago_id = _get_tipo_pago_id(db_conn)

    pago = await _generar_pago_periodo(admin_client, contrato_id, bonificacion_previa=0)
    factura_id = int(pago["factura_venta_id"])
    pago_id = int(pago["pago_id"])

    r_mov = await admin_client.post(
        f"/pagos/{pago_id}/movimientos",
        json={
            "fecha_pago": datetime.utcnow().isoformat(),
            "monto_pago": "10.00",
            "medio_pago_id": medio_pago_id,
            "tipo_pago_id": tipo_pago_id,
            "observacion": "bloqueo patch",
            "comprobantes": [],
        },
    )
    assert r_mov.status_code == 200, r_mov.text

    r = await admin_client.patch(
        f"/facturas-ventas/{factura_id}",
        json={"bonificacion_fventas": "1.00"},
    )
    assert r.status_code == 422, r.text
    assert r.json()["detail"] == "No se puede modificar la bonificación de una factura con pagos registrados"
