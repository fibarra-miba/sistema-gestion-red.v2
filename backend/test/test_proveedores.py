# backend/test/test_proveedores.py

import pytest


# estado_proveedor sembrado en 005: 1=ACTIVO, 2=INACTIVO.
ESTADO_ACTIVO = 1
ESTADO_INACTIVO = 2


def _payload(**overrides):
    payload = {
        "nombre_prov": "Distribuidora Norte",
        "telefono_prov": "3875001122",
        "email_prov": "ventas@norte.com",
        "estado_proveedor_id": ESTADO_ACTIVO,
    }
    payload.update(overrides)
    return payload


@pytest.mark.anyio
async def test_create_proveedor_ok(admin_client):
    r = await admin_client.post("/proveedores", json=_payload())
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["proveedor_id"] >= 1
    assert data["nombre_prov"] == "Distribuidora Norte"
    assert data["descripcion_eprov"] == "ACTIVO"


@pytest.mark.anyio
async def test_create_proveedor_estado_invalido_422(admin_client):
    r = await admin_client.post("/proveedores", json=_payload(estado_proveedor_id=9999))
    assert r.status_code == 422, r.text


@pytest.mark.anyio
async def test_get_proveedor_404(admin_client):
    r = await admin_client.get("/proveedores/999999")
    assert r.status_code == 404, r.text


@pytest.mark.anyio
async def test_update_proveedor_ok(admin_client):
    created = await admin_client.post("/proveedores", json=_payload())
    pid = created.json()["proveedor_id"]

    r = await admin_client.patch(
        f"/proveedores/{pid}", json={"estado_proveedor_id": ESTADO_INACTIVO}
    )
    assert r.status_code == 200, r.text
    assert r.json()["descripcion_eprov"] == "INACTIVO"


@pytest.mark.anyio
async def test_list_proveedores_search(admin_client):
    await admin_client.post("/proveedores", json=_payload(nombre_prov="Mayorista Sur"))
    r = await admin_client.get("/proveedores", params={"search": "Sur"})
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert any("Sur" in (p["nombre_prov"] or "") for p in items)


@pytest.mark.anyio
async def test_cobranzas_no_puede_crear_proveedor(cobranzas_client):
    r = await cobranzas_client.post("/proveedores", json=_payload())
    assert r.status_code == 403, r.text
