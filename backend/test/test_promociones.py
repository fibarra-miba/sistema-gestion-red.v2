# backend/test/test_promociones.py

import pytest


DESDE = "2026-01-01T00:00:00+00:00"
HASTA = "2026-12-31T00:00:00+00:00"


def _porcentaje_payload(**overrides):
    payload = {
        "nombre_promo": "Promo 10%",
        "descripcion_promo": "Diez por ciento",
        "tipo_promo_id": 1,  # PORCENTAJE
        "porcentaje_descuento": 10,
        "fecha_vigencia_desde_promo": DESDE,
        "fecha_vigencia_hasta_promo": HASTA,
    }
    payload.update(overrides)
    return payload


def _fijo_payload(**overrides):
    payload = {
        "nombre_promo": "Promo $5000",
        "tipo_promo_id": 2,  # DESCUENTO_FIJO
        "monto_descuento": 5000,
        "fecha_vigencia_desde_promo": DESDE,
        "fecha_vigencia_hasta_promo": HASTA,
    }
    payload.update(overrides)
    return payload


# ==========================================================
# CREATE
# ==========================================================

@pytest.mark.anyio
async def test_create_promocion_porcentaje_ok(admin_client):
    response = await admin_client.post("/promociones", json=_porcentaje_payload())
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["promocion_id"] >= 1
    assert data["tipo_promo_id"] == 1
    assert data["descripcion_tpromo"] == "PORCENTAJE"
    assert float(data["porcentaje_descuento"]) == 10.0
    assert data["monto_descuento"] is None
    assert data["activo_promo"] is True


@pytest.mark.anyio
async def test_create_promocion_fijo_ok(admin_client):
    response = await admin_client.post("/promociones", json=_fijo_payload())
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["tipo_promo_id"] == 2
    assert data["descripcion_tpromo"] == "DESCUENTO_FIJO"
    assert float(data["monto_descuento"]) == 5000.0
    assert data["porcentaje_descuento"] is None


@pytest.mark.anyio
async def test_create_promocion_porcentaje_con_monto_422(admin_client):
    # PORCENTAJE no admite monto.
    response = await admin_client.post(
        "/promociones", json=_porcentaje_payload(monto_descuento=5000)
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_create_promocion_porcentaje_sin_porcentaje_422(admin_client):
    payload = _porcentaje_payload()
    del payload["porcentaje_descuento"]
    response = await admin_client.post("/promociones", json=payload)
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_create_promocion_fijo_con_porcentaje_422(admin_client):
    response = await admin_client.post(
        "/promociones", json=_fijo_payload(porcentaje_descuento=10)
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_create_promocion_tipo_invalido_422(admin_client):
    response = await admin_client.post(
        "/promociones", json=_fijo_payload(tipo_promo_id=3)
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_create_promocion_fechas_invalidas_422(admin_client):
    response = await admin_client.post(
        "/promociones",
        json=_porcentaje_payload(
            fecha_vigencia_desde_promo=HASTA, fecha_vigencia_hasta_promo=DESDE
        ),
    )
    assert response.status_code == 422, response.text


# ==========================================================
# LIST / GET
# ==========================================================

@pytest.mark.anyio
async def test_list_promociones_y_filtros(admin_client):
    activa = await admin_client.post(
        "/promociones", json=_porcentaje_payload(nombre_promo="Activa")
    )
    assert activa.status_code == 200, activa.text

    inactiva = await admin_client.post(
        "/promociones", json=_fijo_payload(nombre_promo="Inactiva", activo_promo=False)
    )
    assert inactiva.status_code == 200, inactiva.text

    # Sin filtro: incluye el seed + las creadas.
    todas = await admin_client.get("/promociones")
    assert todas.status_code == 200, todas.text
    assert len(todas.json()["items"]) >= 2

    # activo=true excluye la inactiva.
    activas = await admin_client.get("/promociones", params={"activo": True})
    assert all(p["activo_promo"] for p in activas.json()["items"])

    # filtro por tipo.
    porcentaje = await admin_client.get("/promociones", params={"tipo_promo_id": 1})
    assert all(p["tipo_promo_id"] == 1 for p in porcentaje.json()["items"])


@pytest.mark.anyio
async def test_get_promocion_ok_y_404(admin_client):
    creada = await admin_client.post("/promociones", json=_porcentaje_payload())
    promocion_id = creada.json()["promocion_id"]

    ok = await admin_client.get(f"/promociones/{promocion_id}")
    assert ok.status_code == 200, ok.text
    assert ok.json()["promocion_id"] == promocion_id

    not_found = await admin_client.get("/promociones/99999")
    assert not_found.status_code == 404, not_found.text


# ==========================================================
# UPDATE
# ==========================================================

@pytest.mark.anyio
async def test_update_promocion_ok(admin_client):
    creada = await admin_client.post("/promociones", json=_porcentaje_payload())
    promocion_id = creada.json()["promocion_id"]

    response = await admin_client.patch(
        f"/promociones/{promocion_id}",
        json={"porcentaje_descuento": 25, "activo_promo": False},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert float(data["porcentaje_descuento"]) == 25.0
    assert data["activo_promo"] is False


@pytest.mark.anyio
async def test_update_promocion_cambio_tipo_inconsistente_422(admin_client):
    # Promo PORCENTAJE; cambiar a DESCUENTO_FIJO sin setear monto ni limpiar
    # porcentaje deja un estado inconsistente.
    creada = await admin_client.post("/promociones", json=_porcentaje_payload())
    promocion_id = creada.json()["promocion_id"]

    response = await admin_client.patch(
        f"/promociones/{promocion_id}", json={"tipo_promo_id": 2}
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_update_promocion_404(admin_client):
    response = await admin_client.patch(
        "/promociones/99999", json={"activo_promo": False}
    )
    assert response.status_code == 404, response.text


# ==========================================================
# ACL (ADMIN / OPERADOR)
# ==========================================================

@pytest.mark.anyio
async def test_operador_puede_gestionar_promociones(operador_client):
    response = await operador_client.post(
        "/promociones", json=_porcentaje_payload(nombre_promo="Op Promo")
    )
    assert response.status_code == 200, response.text


@pytest.mark.anyio
async def test_tecnico_no_puede_promociones(tecnico_client):
    response = await tecnico_client.get("/promociones")
    assert response.status_code == 403, response.text


@pytest.mark.anyio
async def test_cobranzas_no_puede_promociones(cobranzas_client):
    response = await cobranzas_client.get("/promociones")
    assert response.status_code == 403, response.text
