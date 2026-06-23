# backend/test/test_productos.py

import pytest


# El seed (010) inserta un único tipo_producto 'SERVICIO' (id=1) y un producto
# 'Cable UTP' de ese tipo. Lo usamos como tipo válido de base.
TIPO_SERVICIO_ID = 1


def _producto_payload(**overrides):
    payload = {
        "nombre_producto": "Router Test",
        "descripcion_producto": "Equipo de prueba",
        "marca_producto": "TP-Link",
        "modelo_producto": "AX10",
        "tipo_producto_id": TIPO_SERVICIO_ID,
    }
    payload.update(overrides)
    return payload


# ==========================================================
# CREATE
# ==========================================================

@pytest.mark.anyio
async def test_create_producto_ok(admin_client):
    response = await admin_client.post("/productos", json=_producto_payload())

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["producto_id"] >= 1
    assert data["nombre_producto"] == "Router Test"
    assert data["activo_producto"] is True
    # Enriquecido con el tipo (join), evita N+1 en el front.
    assert data["codigo_tproducto"] == "SERVICIO"


@pytest.mark.anyio
async def test_create_producto_tipo_invalido_422(admin_client):
    response = await admin_client.post(
        "/productos", json=_producto_payload(tipo_producto_id=99999)
    )

    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_create_producto_duplicado_409_case_insensitive(admin_client):
    primero = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Switch", marca_producto="Cisco", modelo_producto="SG110"
        ),
    )
    assert primero.status_code == 200, primero.text

    # Misma combinación nombre/marca/modelo con distinta capitalización → 409.
    duplicado = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="switch", marca_producto="cisco", modelo_producto="sg110"
        ),
    )
    assert duplicado.status_code == 409, duplicado.text


# ==========================================================
# LIST / FILTROS
# ==========================================================

@pytest.mark.anyio
async def test_list_productos_y_filtros(admin_client):
    # Producto activo y producto desactivado para ejercitar solo_activos.
    activo = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Antena", marca_producto="Ubiquiti", modelo_producto="M5"
        ),
    )
    assert activo.status_code == 200, activo.text
    activo_id = activo.json()["producto_id"]

    desactivado = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="ONU", marca_producto="Huawei", modelo_producto="HG8"
        ),
    )
    assert desactivado.status_code == 200, desactivado.text
    await admin_client.patch(
        f"/productos/{desactivado.json()['producto_id']}",
        json={"activo_producto": False},
    )

    # Sin filtros: incluye el seed (Cable UTP) + los creados.
    todos = await admin_client.get("/productos")
    assert todos.status_code == 200, todos.text
    assert len(todos.json()["items"]) >= 3

    # search por nombre.
    por_nombre = await admin_client.get("/productos", params={"search": "Antena"})
    assert por_nombre.status_code == 200, por_nombre.text
    nombres = [p["nombre_producto"] for p in por_nombre.json()["items"]]
    assert "Antena" in nombres

    # solo_activos excluye el desactivado.
    solo_activos = await admin_client.get("/productos", params={"solo_activos": True})
    ids_activos = [p["producto_id"] for p in solo_activos.json()["items"]]
    assert activo_id in ids_activos
    assert all(p["activo_producto"] for p in solo_activos.json()["items"])

    # filtro por tipo.
    por_tipo = await admin_client.get(
        "/productos", params={"tipo_producto_id": TIPO_SERVICIO_ID}
    )
    assert por_tipo.status_code == 200, por_tipo.text
    assert all(
        p["tipo_producto_id"] == TIPO_SERVICIO_ID for p in por_tipo.json()["items"]
    )


# ==========================================================
# GET
# ==========================================================

@pytest.mark.anyio
async def test_get_producto_ok_y_404(admin_client):
    creado = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Patchcord", marca_producto="AMP", modelo_producto="1m"
        ),
    )
    assert creado.status_code == 200, creado.text
    producto_id = creado.json()["producto_id"]

    ok = await admin_client.get(f"/productos/{producto_id}")
    assert ok.status_code == 200, ok.text
    assert ok.json()["producto_id"] == producto_id

    not_found = await admin_client.get("/productos/99999")
    assert not_found.status_code == 404, not_found.text


# ==========================================================
# UPDATE
# ==========================================================

@pytest.mark.anyio
async def test_update_producto_ok(admin_client):
    creado = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Mikrotik", marca_producto="Mikrotik", modelo_producto="hAP"
        ),
    )
    assert creado.status_code == 200, creado.text
    producto_id = creado.json()["producto_id"]

    response = await admin_client.patch(
        f"/productos/{producto_id}",
        json={"descripcion_producto": "Actualizado", "activo_producto": False},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["descripcion_producto"] == "Actualizado"
    assert data["activo_producto"] is False


@pytest.mark.anyio
async def test_update_producto_404(admin_client):
    response = await admin_client.patch(
        "/productos/99999", json={"descripcion_producto": "x"}
    )
    assert response.status_code == 404, response.text


@pytest.mark.anyio
async def test_update_producto_duplicado_409(admin_client):
    a = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Alpha", marca_producto="MarcaA", modelo_producto="M1"
        ),
    )
    assert a.status_code == 200, a.text

    b = await admin_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Beta", marca_producto="MarcaB", modelo_producto="M2"
        ),
    )
    assert b.status_code == 200, b.text

    # Mover B a la misma combinación que A → choca con el índice único.
    response = await admin_client.patch(
        f"/productos/{b.json()['producto_id']}",
        json={"nombre_producto": "Alpha", "marca_producto": "MarcaA", "modelo_producto": "M1"},
    )
    assert response.status_code == 409, response.text


# ==========================================================
# ACL (escritura: ADMIN / OPERADOR; lectura: cualquier autenticado)
# ==========================================================

@pytest.mark.anyio
async def test_operador_puede_crear_producto(operador_client):
    response = await operador_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Operador Prod", marca_producto="MX", modelo_producto="O1"
        ),
    )
    assert response.status_code == 200, response.text


@pytest.mark.anyio
async def test_tecnico_lee_pero_no_crea_producto(tecnico_client):
    # El técnico necesita LEER productos (elige insumos al cargar detalles).
    lectura = await tecnico_client.get("/productos")
    assert lectura.status_code == 200, lectura.text

    # ...pero no puede crearlos (acto administrativo).
    escritura = await tecnico_client.post(
        "/productos",
        json=_producto_payload(
            nombre_producto="Tecnico Prod", marca_producto="MX", modelo_producto="T1"
        ),
    )
    assert escritura.status_code == 403, escritura.text
