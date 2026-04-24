from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest


def _get_estado_contrato_activo_id() -> int:
    return 3


def _crear_cliente(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO clientes (
                nombre_cliente,
                apellido_cliente,
                dni_cliente,
                telefono_cliente,
                email_cliente,
                fecha_alta_cliente,
                estado_cliente_id,
                observacion_cliente
            )
            VALUES (
                'Cliente',
                'LoteTest',
                '99999999',
                '3879999999',
                'cliente.lote.test@red.local',
                NOW(),
                1,
                'Cliente exclusivo para test_generar_lote'
            )
            RETURNING cliente_id
            """
        )
        cliente_id = int(cur.fetchone()[0])

        cur.execute(
            """
            INSERT INTO cuenta (
                cliente_id,
                saldo_cuenta,
                estado_cuenta_id
            )
            VALUES (%s, 0, 1)
            """,
            (cliente_id,),
        )

        db_conn.commit()
        return cliente_id


def _get_plan_id_seed(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute("SELECT plan_id FROM planes ORDER BY plan_id ASC LIMIT 1")
        row = cur.fetchone()
        assert row is not None, "Seed: falta al menos 1 plan"
        return int(row[0])


def _crear_plan_sin_precios(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO planes (nombre_plan, velocidad_mbps_plan, estado_plan_id, descripcion_plan)
            VALUES ('Plan Sin Precio', 99, 1, 'Plan para test precio no vigente')
            RETURNING plan_id
            """
        )
        plan_id = int(cur.fetchone()[0])
        db_conn.commit()
        return plan_id


def _get_promo_vencida_id(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT promocion_id
              FROM promociones
             WHERE activo_promo = TRUE
               AND fecha_vigencia_hasta_promo IS NOT NULL
               AND fecha_vigencia_hasta_promo < CURRENT_DATE
             ORDER BY promocion_id ASC
             LIMIT 1
            """
        )
        row = cur.fetchone()
        assert row is not None, "Seed: falta una promoción vencida"
        return int(row[0])


def _crear_domicilio(db_conn, cliente_id: int, depto: str) -> int:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO domicilios (
                cliente_id, complejo, piso, depto, calle, numero, referencias,
                fecha_desde_dom, fecha_hasta_dom, estado_domicilio_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NULL, %s)
            RETURNING domicilio_id
            """,
            (
                cliente_id,
                "Torre Test",
                1,
                depto,
                "Calle Test",
                100,
                "Ref Test",
                1,
            ),
        )
        domicilio_id = int(cur.fetchone()[0])
        db_conn.commit()
        return domicilio_id


def _crear_contrato(
    db_conn,
    cliente_id: int,
    domicilio_id: int,
    plan_id: int,
    aplica_promocion: bool,
    promocion_id: int | None,
) -> int:
    precio_base = Decimal("10000.00")
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(MAX(precio_mensual_pplanes), 10000)
              FROM precios_planes
             WHERE plan_id = %s
            """,
            (plan_id,),
        )
        row = cur.fetchone()
        if row and row[0] is not None:
            precio_base = Decimal(str(row[0]))

        cur.execute(
            """
            INSERT INTO contratos (
                cliente_id,
                domicilio_id,
                plan_id,
                precio_base_contrato,
                fecha_inicio_contrato,
                estado_contrato_id,
                aplica_promocion,
                promocion_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING contrato_id
            """,
            (
                cliente_id,
                domicilio_id,
                plan_id,
                precio_base,
                date.today().replace(day=1),
                _get_estado_contrato_activo_id(),
                aplica_promocion,
                promocion_id,
            ),
        )
        contrato_id = int(cur.fetchone()[0])
        db_conn.commit()
        return contrato_id


async def _generar_individual(admin_client, contrato_id: int, anio: int, mes: int):
    body = {
        "periodo_anio_pago": anio,
        "periodo_mes_pago": mes,
        "fecha_emision": str(date.today()),
        "fecha_vencimiento": None,
        "bonificacion_previa": 0,
    }
    return await admin_client.post(f"/contratos/{contrato_id}/pagos/generar", json=body)


@pytest.mark.anyio
async def test_generar_lote_robusto_creados_omitidos_errores(admin_client, db_conn):
    cliente_id = _crear_cliente(db_conn)
    plan_ok = _get_plan_id_seed(db_conn)
    plan_sin_precio = _crear_plan_sin_precios(db_conn)
    promo_vencida_id = _get_promo_vencida_id(db_conn)

    dom_a = _crear_domicilio(db_conn, cliente_id, "A")
    dom_b = _crear_domicilio(db_conn, cliente_id, "B")
    dom_c = _crear_domicilio(db_conn, cliente_id, "C")
    dom_d = _crear_domicilio(db_conn, cliente_id, "D")

    contrato_ok = _crear_contrato(db_conn, cliente_id, dom_a, plan_ok, False, None)
    contrato_omit = _crear_contrato(db_conn, cliente_id, dom_b, plan_ok, False, None)
    contrato_precio_err = _crear_contrato(db_conn, cliente_id, dom_c, plan_sin_precio, False, None)
    contrato_promo_err = _crear_contrato(db_conn, cliente_id, dom_d, plan_ok, True, promo_vencida_id)

    today = date.today()
    r_pre = await _generar_individual(admin_client, contrato_omit, today.year, today.month)
    assert r_pre.status_code == 200, r_pre.text

    body = {
        "periodo_anio_pago": today.year,
        "periodo_mes_pago": today.month,
        "fecha_emision": str(today),
        "fecha_vencimiento": None,
        "bonificacion_previa_default": 0,
    }

    r = await admin_client.post("/pagos/generar-lote", json=body)
    assert r.status_code == 200, r.text
    out = r.json()

    assert out["creados"] == 2
    assert out["omitidos_existentes"] >= 1

    assert isinstance(out["errores"], list)
    assert len(out["errores"]) == 2

    err_by_id = {e["contrato_id"]: e for e in out["errores"]}

    assert contrato_precio_err in err_by_id
    assert err_by_id[contrato_precio_err]["status_code"] == 422
    assert err_by_id[contrato_precio_err]["error"] in (
        "Precio base no vigente",
        "Pricing inválido: PRECIO_NO_VIGENTE",
    )

    assert contrato_promo_err in err_by_id
    assert err_by_id[contrato_promo_err]["status_code"] == 422
    assert err_by_id[contrato_promo_err]["error"] in (
        "Promoción no vigente",
        "Pricing inválido: PROMO_NO_VIGENTE",
    )

    r_ok = await admin_client.get(f"/contratos/{contrato_ok}/pagos")
    assert r_ok.status_code == 200, r_ok.text
    items_ok = r_ok.json()
    assert len(items_ok) == 1
