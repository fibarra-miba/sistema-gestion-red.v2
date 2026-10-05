# backend/test/test_garantias_cobros.py

from datetime import datetime, timedelta, timezone

import pytest

from test_garantias import ESTADO_ANULADA, _setup_equipo_en_instalacion

# Medios sembrados en 005_catalogos_base.sql: 1 EFECTIVO, 2 TRANSFERENCIA, 3 TARJETA.
MEDIO_EFECTIVO = 1
MEDIO_TRANSFERENCIA = 2


async def _crear_garantia(admin_client, db_conn, monto=1000, **extra):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)
    res = await admin_client.post(
        "/instalaciones/garantias",
        json={
            "instalacion_id": instalacion_id,
            "producto_id": equipo_id,
            "monto_garantia": monto,
            **extra,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


@pytest.mark.anyio
async def test_alta_con_cobro_aplica_defaults(admin_client, db_conn):
    inicio = "2026-03-01T10:00:00+00:00"
    g = await _crear_garantia(
        admin_client,
        db_conn,
        monto=1500,
        fecha_inicio_garantia=inicio,
        cobro={"medio_pago_id": MEDIO_EFECTIVO},
    )
    assert g["total_cobrado"] == 1500.0
    assert g["saldo_pendiente_cobro"] == 0.0

    cobros = await admin_client.get(f"/instalaciones/garantias/{g['garantia_id']}/cobros")
    assert cobros.status_code == 200, cobros.text
    items = cobros.json()
    assert len(items) == 1
    assert items[0]["monto_cobro_garantia"] == 1500.0
    assert datetime.fromisoformat(items[0]["fecha_cobro_garantia"]) == datetime.fromisoformat(inicio)
    assert items[0]["descripcion_medio_pago"] == "EFECTIVO"


@pytest.mark.anyio
async def test_alta_sin_cobro(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=800)
    assert g["total_cobrado"] == 0
    assert g["saldo_pendiente_cobro"] == 800.0
    assert isinstance(g["cliente_id"], int)

    listado = await admin_client.get(
        "/instalaciones/garantias", params={"instalacion_id": g["instalacion_id"]}
    )
    assert listado.status_code == 200, listado.text
    item = listado.json()["items"][0]
    assert item["total_cobrado"] == 0
    assert item["cliente_id"] == g["cliente_id"]
    assert item["saldo_pendiente_cobro"] == 800.0


@pytest.mark.anyio
async def test_cobro_en_dos_partes_hasta_completar(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    url = f"/instalaciones/garantias/{g['garantia_id']}/cobros"

    r1 = await admin_client.post(
        url, json={"monto_cobro_garantia": 400, "medio_pago_id": MEDIO_EFECTIVO}
    )
    assert r1.status_code == 200, r1.text
    assert r1.json()["monto_cobro_garantia"] == 400.0

    parcial = await admin_client.get(f"/instalaciones/garantias/{g['garantia_id']}")
    assert parcial.json()["total_cobrado"] == 400.0
    assert parcial.json()["saldo_pendiente_cobro"] == 600.0

    r2 = await admin_client.post(
        url,
        json={
            "monto_cobro_garantia": 600,
            "medio_pago_id": MEDIO_TRANSFERENCIA,
            "comprobante_cobro_garantia": "TR-123",
        },
    )
    assert r2.status_code == 200, r2.text
    assert r2.json()["comprobante_cobro_garantia"] == "TR-123"

    final = await admin_client.get(f"/instalaciones/garantias/{g['garantia_id']}")
    assert final.json()["total_cobrado"] == 1000.0
    assert final.json()["saldo_pendiente_cobro"] == 0.0


@pytest.mark.anyio
async def test_cobro_excede_saldo_400(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    res = await admin_client.post(
        f"/instalaciones/garantias/{g['garantia_id']}/cobros",
        json={"monto_cobro_garantia": 1000.01, "medio_pago_id": MEDIO_EFECTIVO},
    )
    assert res.status_code == 400, res.text
    assert res.json()["detail"] == "El cobro supera el saldo pendiente de la garantía."


@pytest.mark.anyio
async def test_cobro_garantia_anulada_400(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    anulada = await admin_client.patch(
        f"/instalaciones/garantias/{g['garantia_id']}",
        json={"estado_garantia_id": ESTADO_ANULADA, "resolucion_garantia": "Error de carga"},
    )
    assert anulada.status_code == 200, anulada.text

    res = await admin_client.post(
        f"/instalaciones/garantias/{g['garantia_id']}/cobros",
        json={"monto_cobro_garantia": 100, "medio_pago_id": MEDIO_EFECTIVO},
    )
    assert res.status_code == 400, res.text


@pytest.mark.anyio
async def test_cobro_fecha_futura_400(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    futura = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    res = await admin_client.post(
        f"/instalaciones/garantias/{g['garantia_id']}/cobros",
        json={
            "fecha_cobro_garantia": futura,
            "monto_cobro_garantia": 100,
            "medio_pago_id": MEDIO_EFECTIVO,
        },
    )
    assert res.status_code == 400, res.text
    assert res.json()["detail"] == "La fecha de cobro no puede ser futura."


@pytest.mark.anyio
async def test_cobro_garantia_sin_monto_400(admin_client, db_conn):
    instalacion_id, equipo_id, _ = _setup_equipo_en_instalacion(db_conn)
    g = await admin_client.post(
        "/instalaciones/garantias",
        json={"instalacion_id": instalacion_id, "producto_id": equipo_id},
    )
    assert g.status_code == 200, g.text
    assert g.json()["saldo_pendiente_cobro"] is None
    res = await admin_client.post(
        f"/instalaciones/garantias/{g.json()['garantia_id']}/cobros",
        json={"monto_cobro_garantia": 100, "medio_pago_id": MEDIO_EFECTIVO},
    )
    assert res.status_code == 400, res.text


@pytest.mark.anyio
async def test_cobro_medio_inexistente_422_y_garantia_inexistente_404(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    res = await admin_client.post(
        f"/instalaciones/garantias/{g['garantia_id']}/cobros",
        json={"monto_cobro_garantia": 100, "medio_pago_id": 9999},
    )
    assert res.status_code == 422, res.text

    nf = await admin_client.post(
        "/instalaciones/garantias/999999/cobros",
        json={"monto_cobro_garantia": 100, "medio_pago_id": MEDIO_EFECTIVO},
    )
    assert nf.status_code == 404, nf.text


@pytest.mark.anyio
async def test_resumen_incluye_cobrado_y_pendiente_cobro(admin_client, db_conn):
    antes = (await admin_client.get("/instalaciones/garantias/resumen")).json()

    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    res = await admin_client.post(
        f"/instalaciones/garantias/{g['garantia_id']}/cobros",
        json={"monto_cobro_garantia": 300, "medio_pago_id": MEDIO_EFECTIVO},
    )
    assert res.status_code == 200, res.text

    despues = (await admin_client.get("/instalaciones/garantias/resumen")).json()
    assert despues["cobrado"] - antes["cobrado"] == pytest.approx(300.0)
    assert despues["pendiente_cobro"] - antes["pendiente_cobro"] == pytest.approx(700.0)


@pytest.mark.anyio
async def test_cobro_tecnico_403_en_escritura(tecnico_client):
    res = await tecnico_client.post(
        "/instalaciones/garantias/1/cobros",
        json={"monto_cobro_garantia": 100, "medio_pago_id": MEDIO_EFECTIVO},
    )
    assert res.status_code == 403, res.text


# ==========================================================
# RECIBOS
# ==========================================================

@pytest.mark.anyio
async def test_cada_cobro_crea_recibo_con_numero_unico(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    url = f"/instalaciones/garantias/{g['garantia_id']}/cobros"

    r1 = await admin_client.post(
        url, json={"monto_cobro_garantia": 400, "medio_pago_id": MEDIO_EFECTIVO}
    )
    r2 = await admin_client.post(
        url, json={"monto_cobro_garantia": 600, "medio_pago_id": MEDIO_TRANSFERENCIA}
    )
    assert r1.status_code == 200 and r2.status_code == 200, (r1.text, r2.text)

    rec1, rec2 = r1.json()["recibo"], r2.json()["recibo"]
    assert rec1["numero_recibo_garantia"].startswith("DG-")
    assert len(rec1["numero_recibo_garantia"]) == 9
    assert rec1["numero_recibo_garantia"] != rec2["numero_recibo_garantia"]
    assert rec1["recibo_garantia_id"] != rec2["recibo_garantia_id"]
    assert rec1["numero_recibo_garantia"] == f"DG-{rec1['recibo_garantia_id']:06d}"
    assert rec1["importe_recibo_garantia"] == 400.0
    assert rec1["medio_pago_descripcion"] == "EFECTIVO"
    assert rec1["garantia_id"] == g["garantia_id"]
    assert rec1["cliente_nombre"] == g["cliente_nombre"]
    assert "Huawei" in rec1["producto_descripcion"]


@pytest.mark.anyio
async def test_recibo_conserva_snapshot_tras_cobro_posterior(admin_client, db_conn):
    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    url = f"/instalaciones/garantias/{g['garantia_id']}/cobros"

    r1 = await admin_client.post(
        url, json={"monto_cobro_garantia": 400, "medio_pago_id": MEDIO_EFECTIVO}
    )
    assert r1.status_code == 200, r1.text
    r2 = await admin_client.post(
        url, json={"monto_cobro_garantia": 600, "medio_pago_id": MEDIO_EFECTIVO}
    )
    assert r2.status_code == 200, r2.text

    primero = await admin_client.get(
        f"/instalaciones/garantias/recibos/{r1.json()['recibo']['recibo_garantia_id']}"
    )
    assert primero.status_code == 200, primero.text
    data = primero.json()
    assert data["total_cobrado_al_emitir"] == 400.0
    assert data["saldo_pendiente_al_emitir"] == 600.0
    assert data["monto_garantia"] == 1000.0

    assert r2.json()["recibo"]["saldo_pendiente_al_emitir"] == 0.0

    listado = await admin_client.get(url)
    assert [c["recibo"]["numero_recibo_garantia"] for c in listado.json()] == [
        r1.json()["recibo"]["numero_recibo_garantia"],
        r2.json()["recibo"]["numero_recibo_garantia"],
    ]


@pytest.mark.anyio
async def test_alta_con_cobro_emite_recibo_y_get_recibo_404(admin_client, db_conn):
    g = await _crear_garantia(
        admin_client, db_conn, monto=500, cobro={"medio_pago_id": MEDIO_EFECTIVO}
    )
    cobros = await admin_client.get(f"/instalaciones/garantias/{g['garantia_id']}/cobros")
    recibo = cobros.json()[0]["recibo"]
    assert recibo["importe_recibo_garantia"] == 500.0
    assert recibo["saldo_pendiente_al_emitir"] == 0.0

    ok = await admin_client.get(f"/instalaciones/garantias/recibos/{recibo['recibo_garantia_id']}")
    assert ok.status_code == 200, ok.text

    nf = await admin_client.get("/instalaciones/garantias/recibos/999999")
    assert nf.status_code == 404, nf.text


# ==========================================================
# COBRANZAS: ve garantías y registra cobros; no administra
# ==========================================================

@pytest.mark.anyio
async def test_cobranzas_ve_y_cobra_pero_no_administra(admin_client, db_conn):
    from conftest import _login

    g = await _crear_garantia(admin_client, db_conn, monto=1000)
    gid = g["garantia_id"]

    cobranzas = await _login(admin_client, "cobranzas", "Cobranzas1")

    me = await cobranzas.get("/auth/me")
    caps = me.json()["capabilities"]
    assert caps["can_view_garantias"] is True
    assert caps["can_cobrar_garantias"] is True

    assert (await cobranzas.get("/instalaciones/garantias")).status_code == 200
    assert (await cobranzas.get(f"/instalaciones/garantias?cliente_id={g['cliente_id']}")).status_code == 200
    assert (await cobranzas.get(f"/instalaciones/garantias/{gid}")).status_code == 200
    assert (await cobranzas.get("/instalaciones/garantias/resumen")).status_code == 200

    cobro = await cobranzas.post(
        f"/instalaciones/garantias/{gid}/cobros",
        json={"monto_cobro_garantia": 1000, "medio_pago_id": MEDIO_TRANSFERENCIA},
    )
    assert cobro.status_code == 200, cobro.text
    recibo_id = cobro.json()["recibo"]["recibo_garantia_id"]
    assert (await cobranzas.get(f"/instalaciones/garantias/recibos/{recibo_id}")).status_code == 200
    assert (await cobranzas.get(f"/instalaciones/garantias/{gid}/cobros")).status_code == 200

    # Administración de garantías y el resto de instalaciones siguen vedados.
    patch = await cobranzas.patch(
        f"/instalaciones/garantias/{gid}", json={"motivo_garantia": "x"}
    )
    assert patch.status_code == 403
    assert (await cobranzas.get("/instalaciones")).status_code == 403
    assert (await cobranzas.get(f"/instalaciones/{g['instalacion_id']}")).status_code == 403


@pytest.mark.anyio
async def test_tecnico_ve_garantias_pero_no_cobra(tecnico_client):
    me = await tecnico_client.get("/auth/me")
    caps = me.json()["capabilities"]
    assert caps["can_view_garantias"] is True
    assert caps["can_cobrar_garantias"] is False
    assert (await tecnico_client.get("/instalaciones/garantias")).status_code == 200
