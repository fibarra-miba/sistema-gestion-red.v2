# backend/test/test_planes.py

import pytest


# ==========================================================
# CREATE PLAN
# ==========================================================

@pytest.mark.anyio
async def test_create_plan(admin_client):
    payload = {
        "nombre_plan": "Plan Test 100 Mbps",
        "velocidad_mbps_plan": 100,
        "descripcion_plan": "Plan de prueba",
        "estado_plan_id": 1,
    }

    response = await admin_client.post("/planes", json=payload)

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["nombre_plan"] == payload["nombre_plan"]
    assert data["velocidad_mbps_plan"] == payload["velocidad_mbps_plan"]
    assert data["descripcion_plan"] == payload["descripcion_plan"]
    assert data["estado_plan_id"] == payload["estado_plan_id"]
    assert "precio_vigente" in data


# ==========================================================
# GET PLAN BY ID
# ==========================================================

@pytest.mark.anyio
async def test_get_plan_by_id(admin_client):
    payload = {
        "nombre_plan": "Plan Consulta",
        "velocidad_mbps_plan": 50,
        "descripcion_plan": "Plan para consulta",
        "estado_plan_id": 1,
    }

    create_response = await admin_client.post("/planes", json=payload)
    assert create_response.status_code == 200, create_response.text
    plan_id = create_response.json()["plan_id"]

    response = await admin_client.get(f"/planes/{plan_id}")

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["plan_id"] == plan_id
    assert "precio_vigente" in data
    assert "fecha_desde_precio_vigente" in data
    assert "fecha_hasta_precio_vigente" in data


# ==========================================================
# LIST PLANS
# ==========================================================

@pytest.mark.anyio
async def test_list_planes(admin_client):
    response = await admin_client.get("/planes")

    assert response.status_code == 200, response.text
    data = response.json()

    assert "items" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 3
    assert "precio_vigente" in data["items"][0]


@pytest.mark.anyio
async def test_list_planes_returns_seed_current_prices(admin_client):
    response = await admin_client.get("/planes")

    assert response.status_code == 200, response.text
    items = response.json()["items"]

    by_name = {item["nombre_plan"]: item for item in items}

    assert float(by_name["Plan Básico"]["precio_vigente"]) == 10000.0
    assert float(by_name["Plan Intermedio"]["precio_vigente"]) == 20000.0
    assert float(by_name["Plan Avanzado"]["precio_vigente"]) == 40000.0


# ==========================================================
# UPDATE PLAN
# ==========================================================

@pytest.mark.anyio
async def test_update_plan(admin_client):
    payload = {
        "nombre_plan": "Plan Editable",
        "velocidad_mbps_plan": 30,
        "descripcion_plan": "Antes de editar",
        "estado_plan_id": 1,
    }

    create_response = await admin_client.post("/planes", json=payload)
    assert create_response.status_code == 200, create_response.text
    plan_id = create_response.json()["plan_id"]

    update_payload = {
        "nombre_plan": "Plan Editado",
        "velocidad_mbps_plan": 60,
    }

    response = await admin_client.patch(f"/planes/{plan_id}", json=update_payload)

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["nombre_plan"] == "Plan Editado"
    assert data["velocidad_mbps_plan"] == 60
    assert "precio_vigente" in data


# ==========================================================
# DELETE PLAN (LOGICAL DELETE)
# ==========================================================

@pytest.mark.anyio
async def test_delete_plan(admin_client):
    payload = {
        "nombre_plan": "Plan Eliminable",
        "velocidad_mbps_plan": 25,
        "descripcion_plan": "Plan a eliminar",
        "estado_plan_id": 1,
    }

    create_response = await admin_client.post("/planes", json=payload)
    assert create_response.status_code == 200, create_response.text
    plan_id = create_response.json()["plan_id"]

    delete_response = await admin_client.delete(f"/planes/{plan_id}")

    assert delete_response.status_code == 200, delete_response.text
    assert delete_response.json()["message"] == "Plan desactivado correctamente."

    get_response = await admin_client.get(f"/planes/{plan_id}")
    assert get_response.status_code == 200, get_response.text
    data = get_response.json()
    assert data["estado_plan_id"] == 2


# ==========================================================
# UNIQUE PLAN NAME
# ==========================================================

@pytest.mark.anyio
async def test_unique_plan_name(admin_client):
    payload = {
        "nombre_plan": "Plan Único",
        "velocidad_mbps_plan": 80,
        "descripcion_plan": "Primer registro",
        "estado_plan_id": 1,
    }

    response_1 = await admin_client.post("/planes", json=payload)
    assert response_1.status_code == 200, response_1.text

    response_2 = await admin_client.post("/planes", json=payload)

    assert response_2.status_code == 400
    assert "Ya existe un plan con ese nombre" in response_2.json()["detail"]


# ==========================================================
# PRECIOS DEL PLAN - HISTORIAL
# ==========================================================

@pytest.mark.anyio
async def test_list_plan_prices_seed(admin_client):
    response = await admin_client.get("/planes/1/precios")

    assert response.status_code == 200, response.text
    data = response.json()

    assert "items" in data
    assert len(data["items"]) >= 1
    assert data["items"][0]["plan_id"] == 1
    assert float(data["items"][0]["precio_mensual_pplanes"]) == 10000.0


@pytest.mark.anyio
async def test_create_plan_price(admin_client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            UPDATE precios_planes
               SET fecha_hasta_pplanes = '2029-12-31T23:59:59Z'
             WHERE plan_id = 2
               AND fecha_hasta_pplanes IS NULL
            """
        )
    db_conn.commit()

    payload = {
        "precio_mensual_pplanes": 25000,
        "fecha_desde_pplanes": "2030-01-01T00:00:00Z",
        "fecha_hasta_pplanes": "2035-01-01T00:00:00Z",
    }

    response = await admin_client.post("/planes/2/precios", json=payload)

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["plan_id"] == 2
    assert float(data["precio_mensual_pplanes"]) == 25000.0
    assert data["fecha_desde_pplanes"] is not None
    assert data["fecha_hasta_pplanes"] is not None


@pytest.mark.anyio
async def test_create_plan_price_fails_if_overlap(admin_client):
    payload = {
        "precio_mensual_pplanes": 99999,
        "fecha_desde_pplanes": "2025-01-01T00:00:00Z",
        "fecha_hasta_pplanes": None,
    }

    response = await admin_client.post("/planes/1/precios", json=payload)

    assert response.status_code == 400, response.text
    assert "solapado" in response.json()["detail"].lower()


@pytest.mark.anyio
async def test_get_plan_shows_new_current_price_after_non_overlapping_insert(admin_client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            UPDATE precios_planes
               SET fecha_hasta_pplanes = '2029-12-31T23:59:59Z'
             WHERE plan_id = 1
               AND fecha_hasta_pplanes IS NULL
            """
        )
    db_conn.commit()

    create_price_response = await admin_client.post(
        "/planes/1/precios",
        json={
            "precio_mensual_pplanes": 18000,
            "fecha_desde_pplanes": "2030-01-01T00:00:00Z",
            "fecha_hasta_pplanes": "2035-01-01T00:00:00Z",
        },
    )
    assert create_price_response.status_code == 200, create_price_response.text

    current_response = await admin_client.get("/planes/1")
    assert current_response.status_code == 200, current_response.text
    current_data = current_response.json()

    assert float(current_data["precio_vigente"]) == 10000.0

    history_response = await admin_client.get("/planes/1/precios")
    assert history_response.status_code == 200, history_response.text
    history_items = history_response.json()["items"]

    assert len(history_items) >= 2
    assert any(float(item["precio_mensual_pplanes"]) == 18000.0 for item in history_items)


@pytest.mark.anyio
async def test_list_plan_prices_fails_if_plan_not_exists(admin_client):
    response = await admin_client.get("/planes/999999/precios")

    assert response.status_code == 404, response.text
    assert response.json()["detail"] == "Plan no encontrado."


@pytest.mark.anyio
async def test_create_plan_price_fails_if_plan_not_exists(admin_client):
    response = await admin_client.post(
        "/planes/999999/precios",
        json={
            "precio_mensual_pplanes": 12345,
            "fecha_desde_pplanes": "2030-01-01T00:00:00Z",
            "fecha_hasta_pplanes": None,
        },
    )

    assert response.status_code == 400, response.text
    assert response.json()["detail"] == "Plan no encontrado."


# ==========================================================
# UPDATE PRICE - SOLO FUTUROS
# ==========================================================

@pytest.mark.anyio
async def test_update_future_plan_price(admin_client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            UPDATE precios_planes
               SET fecha_hasta_pplanes = '2029-12-31T23:59:59Z'
             WHERE plan_id = 3
               AND fecha_hasta_pplanes IS NULL
            """
        )
    db_conn.commit()

    create_response = await admin_client.post(
        "/planes/3/precios",
        json={
            "precio_mensual_pplanes": 50000,
            "fecha_desde_pplanes": "2030-01-01T00:00:00Z",
            "fecha_hasta_pplanes": "2035-01-01T00:00:00Z",
        },
    )
    assert create_response.status_code == 200, create_response.text
    precio_id = create_response.json()["precios_planes_id"]

    patch_response = await admin_client.patch(
        f"/planes/3/precios/{precio_id}",
        json={
            "precio_mensual_pplanes": 55000,
            "fecha_hasta_pplanes": "2036-01-01T00:00:00Z",
        },
    )

    assert patch_response.status_code == 200, patch_response.text
    data = patch_response.json()

    assert data["precios_planes_id"] == precio_id
    assert data["plan_id"] == 3
    assert float(data["precio_mensual_pplanes"]) == 55000.0
    assert data["fecha_hasta_pplanes"] == "2036-01-01T00:00:00Z"


@pytest.mark.anyio
async def test_update_current_plan_price_fails(admin_client):
    response = await admin_client.patch(
        "/planes/1/precios/1",
        json={
            "precio_mensual_pplanes": 12345,
        },
    )

    assert response.status_code == 400, response.text
    assert response.json()["detail"] == "Solo se pueden editar precios futuros."


@pytest.mark.anyio
async def test_update_historical_plan_price_fails(admin_client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO precios_planes (
                plan_id,
                precio_mensual_pplanes,
                fecha_desde_pplanes,
                fecha_hasta_pplanes
            )
            VALUES (
                1,
                9000,
                '2020-01-01T00:00:00Z',
                '2020-12-31T23:59:59Z'
            )
            RETURNING precios_planes_id
            """
        )
        precio_id = cur.fetchone()[0]
    db_conn.commit()

    response = await admin_client.patch(
        f"/planes/1/precios/{precio_id}",
        json={
            "precio_mensual_pplanes": 9500,
        },
    )

    assert response.status_code == 400, response.text
    assert response.json()["detail"] == "Solo se pueden editar precios futuros."


@pytest.mark.anyio
async def test_update_future_plan_price_fails_if_overlap(admin_client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            UPDATE precios_planes
               SET fecha_hasta_pplanes = '2029-12-31T23:59:59Z'
             WHERE plan_id = 2
               AND fecha_hasta_pplanes IS NULL
            """
        )
    db_conn.commit()

    response_1 = await admin_client.post(
        "/planes/2/precios",
        json={
            "precio_mensual_pplanes": 25000,
            "fecha_desde_pplanes": "2030-01-01T00:00:00Z",
            "fecha_hasta_pplanes": "2032-01-01T00:00:00Z",
        },
    )
    assert response_1.status_code == 200, response_1.text
    precio_id_1 = response_1.json()["precios_planes_id"]

    response_2 = await admin_client.post(
        "/planes/2/precios",
        json={
            "precio_mensual_pplanes": 28000,
            "fecha_desde_pplanes": "2032-01-01T00:00:00Z",
            "fecha_hasta_pplanes": "2034-01-01T00:00:00Z",
        },
    )
    assert response_2.status_code == 200, response_2.text

    patch_response = await admin_client.patch(
        f"/planes/2/precios/{precio_id_1}",
        json={
            "fecha_hasta_pplanes": "2033-01-01T00:00:00Z",
        },
    )

    assert patch_response.status_code == 400, patch_response.text
    assert "solapado" in patch_response.json()["detail"].lower()


@pytest.mark.anyio
async def test_update_future_plan_price_fails_if_price_not_found(admin_client):
    response = await admin_client.patch(
        "/planes/1/precios/999999",
        json={
            "precio_mensual_pplanes": 12345,
        },
    )

    assert response.status_code == 404, response.text
    assert response.json()["detail"] == "Precio no encontrado."


@pytest.mark.anyio
async def test_update_future_plan_price_fails_if_price_belongs_to_another_plan(admin_client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            UPDATE precios_planes
               SET fecha_hasta_pplanes = '2029-12-31T23:59:59Z'
             WHERE plan_id = 2
               AND fecha_hasta_pplanes IS NULL
            """
        )
    db_conn.commit()

    create_response = await admin_client.post(
        "/planes/2/precios",
        json={
            "precio_mensual_pplanes": 26000,
            "fecha_desde_pplanes": "2030-01-01T00:00:00Z",
            "fecha_hasta_pplanes": "2035-01-01T00:00:00Z",
        },
    )
    assert create_response.status_code == 200, create_response.text
    precio_id = create_response.json()["precios_planes_id"]

    response = await admin_client.patch(
        f"/planes/1/precios/{precio_id}",
        json={
            "precio_mensual_pplanes": 27000,
        },
    )

    assert response.status_code == 400, response.text
    assert response.json()["detail"] == "El precio no pertenece al plan indicado."
