# test/test_instalaciones.py

from datetime import datetime, timezone

import pytest


# ==========================================================
# CONSTANTES SEED CONTROLADAS
# ==========================================================

CLIENTE_ID = 3
DOMICILIO_ID = 3
PLAN_ID = 1


# ==========================================================
# HELPERS
# ==========================================================

async def _crear_contrato_operativo(admin_client):
    res = await admin_client.post(
        "/contratos",
        json={
            "cliente_id": CLIENTE_ID,
            "domicilio_id": DOMICILIO_ID,
            "plan_id": PLAN_ID,
            "precio_base_contrato": 10000,
            "fecha_inicio_contrato": "2025-01-01",
            "aplica_promocion": False,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()["contrato_id"]


async def _crear_programacion(admin_client):
    contrato_id = await _crear_contrato_operativo(admin_client)

    res_prog = await admin_client.post(
        "/instalaciones/programaciones-instalacion",
        json={
            "contrato_id": contrato_id,
            "domicilio_id": DOMICILIO_ID,
            "fecha_programacion_pinstalacion": "2030-01-01T10:00:00Z",
        },
    )
    assert res_prog.status_code == 200, res_prog.text
    programacion_id = res_prog.json()["programacion_id"]

    return contrato_id, programacion_id


async def _crear_instalacion_pendiente(admin_client):
    contrato_id, programacion_id = await _crear_programacion(admin_client)

    res_inst = await admin_client.post(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/ejecutar",
        json={},
    )
    assert res_inst.status_code == 200, res_inst.text

    return contrato_id, res_inst.json()["instalacion_id"], programacion_id


# ==========================================================
# 1. ACTIVAR / PROGRAMAR
# ==========================================================

async def _producto(client, nombre):
    r = await client.post(
        "/productos",
        json={
            "nombre_producto": nombre,
            "marca_producto": "Genérico",
            "modelo_producto": "STD",
            "tipo_producto_id": 1,
            "unidad_stock_producto": "unidad",
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["producto_id"]


@pytest.mark.anyio
async def test_activar_contrato_crea_instalacion_pendiente(admin_client):
    contrato_id = await _crear_contrato_operativo(admin_client)

    res = await admin_client.post(f"/contratos/{contrato_id}/activate")
    assert res.status_code == 200, res.text

    items = (
        await admin_client.get(f"/instalaciones?contrato_id={contrato_id}")
    ).json()["items"]
    assert len(items) == 1
    assert items[0]["estado_instalacion_id"] == 1  # PENDIENTE


@pytest.mark.anyio
async def test_activar_permite_cargar_productos(admin_client):
    contrato_id = await _crear_contrato_operativo(admin_client)
    await admin_client.post(f"/contratos/{contrato_id}/activate")

    instalacion_id = (
        await admin_client.get(f"/instalaciones?contrato_id={contrato_id}")
    ).json()["items"][0]["instalacion_id"]

    prod = await _producto(admin_client, "Conector activación directa")
    await admin_client.post(
        "/stock/ajustes",
        json={"producto_id": prod, "cantidad": 5, "positivo": True, "motivo": "alta"},
    )

    res = await admin_client.post(
        f"/instalaciones/{instalacion_id}/detalles",
        json={
            "producto_id": prod,
            "cantidad_dinstalacion": 2,
            "unidad_dinstalacion": "unidad",
        },
    )
    assert res.status_code == 200, res.text


@pytest.mark.anyio
async def test_programar_instalacion_deja_pendiente_instalacion(admin_client):
    contrato_id = await _crear_contrato_operativo(admin_client)

    res = await admin_client.post(
        f"/contratos/{contrato_id}/programar-instalacion",
        json={"fecha_programacion_pinstalacion": "2030-01-01T10:00:00Z"},
    )

    assert res.status_code == 200, res.text
    data = res.json()
    assert data["estado_contrato_id"] == 2
    assert data["programacion_id"] is not None


@pytest.mark.anyio
async def test_activar_solo_desde_borrador(admin_client):
    contrato_id = await _crear_contrato_operativo(admin_client)

    primera = await admin_client.post(f"/contratos/{contrato_id}/activate")
    assert primera.status_code == 200, primera.text

    # Ya está ACTIVO: no puede volver a activarse.
    segunda = await admin_client.post(f"/contratos/{contrato_id}/activate")
    assert segunda.status_code == 400, segunda.text


# ==========================================================
# 2. REPROGRAMACION
# ==========================================================

@pytest.mark.anyio
async def test_reprogramacion_crea_historial(admin_client):
    _, _, programacion_id = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.post(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/reprogramar",
        json={
            "fecha_programacion_pinstalacion": "2030-01-02T10:00:00Z",
            "motivo_reprogramacion": "Test",
        },
    )

    assert res.status_code == 400


@pytest.mark.anyio
async def test_reprogramacion_crea_historial_sobre_programacion_programada(admin_client):
    _, programacion_id = await _crear_programacion(admin_client)

    res = await admin_client.post(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/reprogramar",
        json={
            "fecha_programacion_pinstalacion": "2030-01-02T10:00:00Z",
            "motivo_reprogramacion": "Test",
        },
    )

    assert res.status_code == 200, res.text

    res_list = await admin_client.get(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/reprogramaciones"
    )

    assert res_list.status_code == 200, res_list.text
    assert len(res_list.json()["items"]) >= 1


# ==========================================================
# 3. EJECUTAR PROGRAMACION / CREAR INSTALACION
# ==========================================================

@pytest.mark.anyio
async def test_ejecutar_programacion_crea_instalacion(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    assert instalacion_id is not None


@pytest.mark.anyio
async def test_ejecutar_programacion_pasa_programacion_a_completada(admin_client):
    _, programacion_id = await _crear_programacion(admin_client)

    res = await admin_client.post(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/ejecutar",
        json={},
    )

    assert res.status_code == 200, res.text

    res_prog = await admin_client.get(
        f"/instalaciones/programaciones-instalacion/{programacion_id}"
    )
    assert res_prog.status_code == 200, res_prog.text
    assert res_prog.json()["estado_programacion_id"] == 2


# ==========================================================
# 4. COMPLETAR
# ==========================================================

@pytest.mark.anyio
async def test_completar_instalacion_activa_contrato(admin_client):
    _, instalacion_id, programacion_id = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.post(f"/instalaciones/{instalacion_id}/completar")

    assert res.status_code == 200, res.text
    data = res.json()

    assert data["estado_instalacion_id"] == 2
    assert data["estado_contrato_id"] == 3

    res_prog = await admin_client.get(
        f"/instalaciones/programaciones-instalacion/{programacion_id}"
    )
    assert res_prog.status_code == 200, res_prog.text
    assert res_prog.json()["estado_programacion_id"] == 2


# ==========================================================
# 5. CANCELAR
# ==========================================================

@pytest.mark.anyio
async def test_cancelar_instalacion(admin_client):
    _, instalacion_id, programacion_id = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.post(f"/instalaciones/{instalacion_id}/cancelar")

    assert res.status_code == 200, res.text

    res_prog = await admin_client.get(
        f"/instalaciones/programaciones-instalacion/{programacion_id}"
    )
    assert res_prog.status_code == 200, res_prog.text
    assert res_prog.json()["estado_programacion_id"] == 3


# ==========================================================
# 6. FALLAR
# ==========================================================

@pytest.mark.anyio
async def test_fallar_instalacion(admin_client):
    _, instalacion_id, programacion_id = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.post(f"/instalaciones/{instalacion_id}/fallar")

    assert res.status_code == 200, res.text

    res_prog = await admin_client.get(
        f"/instalaciones/programaciones-instalacion/{programacion_id}"
    )
    assert res_prog.status_code == 200, res_prog.text
    assert res_prog.json()["estado_programacion_id"] == 4


# ==========================================================
# 7. REINTENTAR
# ==========================================================

@pytest.mark.anyio
async def test_reintentar_instalacion_cancelada(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    await admin_client.post(f"/instalaciones/{instalacion_id}/cancelar")

    res = await admin_client.post(
        f"/instalaciones/{instalacion_id}/reintentar",
        json={"fecha_programacion_pinstalacion": "2030-01-05T10:00:00Z"},
    )

    assert res.status_code == 200, res.text


@pytest.mark.anyio
async def test_reintentar_instalacion_fallida(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    await admin_client.post(f"/instalaciones/{instalacion_id}/fallar")

    res = await admin_client.post(
        f"/instalaciones/{instalacion_id}/reintentar",
        json={"fecha_programacion_pinstalacion": "2030-01-06T10:00:00Z"},
    )

    assert res.status_code == 200, res.text


@pytest.mark.anyio
async def test_reintentar_instalacion_completada_error(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    await admin_client.post(f"/instalaciones/{instalacion_id}/completar")

    res = await admin_client.post(
        f"/instalaciones/{instalacion_id}/reintentar",
        json={"fecha_programacion_pinstalacion": "2030-01-07T10:00:00Z"},
    )

    assert res.status_code == 400


# ==========================================================
# 8. DAR BAJA
# ==========================================================

@pytest.mark.anyio
async def test_dar_baja_instalacion_completada_pasa_contrato_a_pendiente_instalacion(admin_client):
    contrato_id, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    res_completar = await admin_client.post(f"/instalaciones/{instalacion_id}/completar")
    assert res_completar.status_code == 200, res_completar.text

    res_baja = await admin_client.post(f"/instalaciones/{instalacion_id}/dar-baja")
    assert res_baja.status_code == 200, res_baja.text

    data_baja = res_baja.json()
    assert data_baja["contrato_id"] == contrato_id
    assert data_baja["estado_contrato_id"] == 2

    res_contrato = await admin_client.get(f"/contratos/{contrato_id}")
    assert res_contrato.status_code == 200, res_contrato.text
    assert res_contrato.json()["estado_contrato_id"] == 2


@pytest.mark.anyio
async def test_no_dar_baja_instalacion_pendiente(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.post(f"/instalaciones/{instalacion_id}/dar-baja")

    assert res.status_code == 400


# ==========================================================
# 9. VALIDACIONES
# ==========================================================

@pytest.mark.anyio
async def test_no_reprogramar_programacion_cancelada(admin_client):
    _, instalacion_id, programacion_id = await _crear_instalacion_pendiente(admin_client)

    await admin_client.post(f"/instalaciones/{instalacion_id}/cancelar")

    res = await admin_client.post(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/reprogramar",
        json={"fecha_programacion_pinstalacion": "2030-01-09T10:00:00Z"},
    )

    assert res.status_code == 400


@pytest.mark.anyio
async def test_no_cancelar_instalacion_completada(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    await admin_client.post(f"/instalaciones/{instalacion_id}/completar")

    res = await admin_client.post(f"/instalaciones/{instalacion_id}/cancelar")

    assert res.status_code == 400


@pytest.mark.anyio
async def test_no_fallar_instalacion_completada(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    await admin_client.post(f"/instalaciones/{instalacion_id}/completar")

    res = await admin_client.post(f"/instalaciones/{instalacion_id}/fallar")

    assert res.status_code == 400


@pytest.mark.anyio
async def test_no_ejecutar_programacion_completada(admin_client):
    _, programacion_id = await _crear_programacion(admin_client)

    first = await admin_client.post(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/ejecutar",
        json={},
    )
    assert first.status_code == 200, first.text

    second = await admin_client.post(
        f"/instalaciones/programaciones-instalacion/{programacion_id}/ejecutar",
        json={},
    )

    assert second.status_code == 400


# ==========================================================
# 10. EDICION DE DATOS DE CARGA (PATCH)
# ==========================================================

def _fecha_utc(valor: str) -> datetime:
    return datetime.fromisoformat(valor).astimezone(timezone.utc)


@pytest.mark.anyio
async def test_editar_fecha_instalacion_completada(admin_client):
    """El caso real: corregir la fecha de una instalación ya completada."""
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)
    await admin_client.post(f"/instalaciones/{instalacion_id}/completar")

    res = await admin_client.patch(
        f"/instalaciones/{instalacion_id}",
        json={"fecha_instalacion": "2026-01-15T10:00:00Z"},
    )

    assert res.status_code == 200, res.text
    esperada = datetime(2026, 1, 15, 10, 0, tzinfo=timezone.utc)
    assert _fecha_utc(res.json()["fecha_instalacion"]) == esperada

    res_get = await admin_client.get(f"/instalaciones/{instalacion_id}")
    assert _fecha_utc(res_get.json()["fecha_instalacion"]) == esperada


@pytest.mark.anyio
async def test_editar_instalacion_no_cambia_estado(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)
    await admin_client.post(f"/instalaciones/{instalacion_id}/completar")

    res = await admin_client.patch(
        f"/instalaciones/{instalacion_id}",
        json={"fecha_instalacion": "2026-01-15T10:00:00Z"},
    )

    assert res.status_code == 200, res.text
    assert res.json()["estado_instalacion_id"] == 2  # COMPLETADA


@pytest.mark.anyio
async def test_editar_codigo_y_observacion(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.patch(
        f"/instalaciones/{instalacion_id}",
        json={
            "codigo_instalacion": "INS-0001",
            "observacion_instalacion": "Se reubicó el ONT.",
        },
    )

    assert res.status_code == 200, res.text
    data = res.json()
    assert data["codigo_instalacion"] == "INS-0001"
    assert data["observacion_instalacion"] == "Se reubicó el ONT."


@pytest.mark.anyio
async def test_editar_instalacion_patch_parcial_no_pisa_otros_campos(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)
    await admin_client.patch(
        f"/instalaciones/{instalacion_id}",
        json={"codigo_instalacion": "INS-0002"},
    )

    res = await admin_client.patch(
        f"/instalaciones/{instalacion_id}",
        json={"observacion_instalacion": "Nota nueva."},
    )

    assert res.status_code == 200, res.text
    assert res.json()["codigo_instalacion"] == "INS-0002"


@pytest.mark.anyio
async def test_editar_instalacion_rechaza_fecha_futura(admin_client):
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.patch(
        f"/instalaciones/{instalacion_id}",
        json={"fecha_instalacion": "2099-01-01T10:00:00Z"},
    )

    assert res.status_code == 422, res.text


@pytest.mark.anyio
async def test_editar_instalacion_rechaza_fecha_nula(admin_client):
    """fecha_instalacion es NOT NULL: mandar null explícito es 422, no un 500."""
    _, instalacion_id, _ = await _crear_instalacion_pendiente(admin_client)

    res = await admin_client.patch(
        f"/instalaciones/{instalacion_id}",
        json={"fecha_instalacion": None},
    )

    assert res.status_code == 422, res.text


@pytest.mark.anyio
async def test_editar_instalacion_inexistente(admin_client):
    res = await admin_client.patch(
        "/instalaciones/999999",
        json={"fecha_instalacion": "2026-01-15T10:00:00Z"},
    )

    assert res.status_code == 404, res.text


@pytest.mark.anyio
async def test_tecnico_no_puede_editar_instalacion(tecnico_client):
    """El TÉCNICO opera instalaciones pero no corrige datos de carga.
    El guard de rol corta antes del handler, así que el id no importa."""
    res = await tecnico_client.patch(
        "/instalaciones/1",
        json={"fecha_instalacion": "2026-01-15T10:00:00Z"},
    )

    assert res.status_code == 403, res.text
