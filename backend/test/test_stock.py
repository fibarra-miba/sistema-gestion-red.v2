# backend/test/test_stock.py

import pytest


TIPO_PRODUCTO_ID = 1  # 'SERVICIO' en el seed de test


async def _nuevo_producto(client, nombre, unidad="unidad"):
    r = await client.post(
        "/productos",
        json={
            "nombre_producto": nombre,
            "marca_producto": "Genérico",
            "modelo_producto": "STD",
            "tipo_producto_id": TIPO_PRODUCTO_ID,
            "unidad_stock_producto": unidad,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["producto_id"]


@pytest.mark.anyio
async def test_saldo_inicial_cero(admin_client):
    pid = await _nuevo_producto(admin_client, "Boquilla RJ45")
    r = await admin_client.get(f"/stock/{pid}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["cantidad"] == 0
    assert data["costo_promedio"] == 0


@pytest.mark.anyio
async def test_ajuste_positivo_y_negativo(admin_client):
    pid = await _nuevo_producto(admin_client, "Conector F")

    r = await admin_client.post(
        "/stock/ajustes",
        json={"producto_id": pid, "cantidad": 10, "positivo": True, "motivo": "carga inicial"},
    )
    assert r.status_code == 200, r.text

    r = await admin_client.post(
        "/stock/ajustes",
        json={"producto_id": pid, "cantidad": 3, "positivo": False, "motivo": "rotura"},
    )
    assert r.status_code == 200, r.text

    saldo = (await admin_client.get(f"/stock/{pid}")).json()
    assert saldo["cantidad"] == 7


@pytest.mark.anyio
async def test_ajuste_negativo_sin_stock_400(admin_client):
    pid = await _nuevo_producto(admin_client, "Precinto")
    r = await admin_client.post(
        "/stock/ajustes",
        json={"producto_id": pid, "cantidad": 5, "positivo": False, "motivo": "x"},
    )
    assert r.status_code == 400, r.text
    assert "insuficiente" in r.json()["detail"].lower()


@pytest.mark.anyio
async def test_existencias_y_kardex(admin_client):
    pid = await _nuevo_producto(admin_client, "Roseta óptica")
    await admin_client.post(
        "/stock/ajustes",
        json={"producto_id": pid, "cantidad": 4, "positivo": True, "motivo": "alta"},
    )

    ex = await admin_client.get("/stock", params={"search": "Roseta", "solo_con_stock": True})
    assert ex.status_code == 200, ex.text
    items = ex.json()["items"]
    assert any(i["producto_id"] == pid and i["cantidad"] == 4 for i in items)

    kx = await admin_client.get(f"/stock/{pid}/movimientos")
    assert kx.status_code == 200, kx.text
    movs = kx.json()["items"]
    assert len(movs) == 1
    assert movs[0]["codigo_tmstock"] == "AJUSTE_POSITIVO"


@pytest.mark.anyio
async def test_tecnico_puede_leer_no_escribir(tecnico_client):
    # producto_id 1 existe en el seed de test. Lectura de stock: OK para TÉCNICO.
    assert (await tecnico_client.get("/stock/1")).status_code == 200
    # Escritura prohibida (require_roles ADMIN/OPERADOR corta antes del handler).
    r = await tecnico_client.post(
        "/stock/ajustes",
        json={"producto_id": 1, "cantidad": 1, "positivo": True, "motivo": "x"},
    )
    assert r.status_code == 403, r.text
