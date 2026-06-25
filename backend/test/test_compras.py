# backend/test/test_compras.py

import pytest


TIPO_PRODUCTO_ID = 1
ESTADO_PROV_ACTIVO = 1


async def _proveedor(client):
    r = await client.post(
        "/proveedores",
        json={"nombre_prov": "Proveedor Test", "estado_proveedor_id": ESTADO_PROV_ACTIVO},
    )
    assert r.status_code == 200, r.text
    return r.json()["proveedor_id"]


async def _producto(client, nombre):
    r = await client.post(
        "/productos",
        json={
            "nombre_producto": nombre,
            "marca_producto": "Genérico",
            "modelo_producto": "STD",
            "tipo_producto_id": TIPO_PRODUCTO_ID,
            "unidad_stock_producto": "unidad",
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["producto_id"]


@pytest.mark.anyio
async def test_compra_directa_genera_stock(admin_client):
    prov = await _proveedor(admin_client)
    prod = await _producto(admin_client, "Cable coaxial")

    r = await admin_client.post(
        "/compras",
        json={
            "proveedor_id": prov,
            "detalles": [
                {"producto_id": prod, "cantidad_presentacion": 100, "costo_presentacion": 50}
            ],
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["importe_total_fcompras"] == 5000
    assert data["descripcion_efcompra"] == "EMITIDA"
    assert data["detalles"][0]["cantidad_base"] == 100
    assert data["detalles"][0]["costo_unitario_base"] == 50

    saldo = (await admin_client.get(f"/stock/{prod}")).json()
    assert saldo["cantidad"] == 100
    assert saldo["costo_promedio"] == 50


@pytest.mark.anyio
async def test_compra_con_presentacion_aplica_factor(admin_client):
    prov = await _proveedor(admin_client)
    prod = await _producto(admin_client, "Boquilla RJ45")

    pres = await admin_client.post(
        f"/productos/{prod}/presentaciones",
        json={
            "nombre_presentacion": "Bolsa x100",
            "unidad_compra_presentacion": "bolsa",
            "factor_a_stock": 100,
        },
    )
    assert pres.status_code == 200, pres.text
    presentacion_id = pres.json()["presentacion_id"]

    r = await admin_client.post(
        "/compras",
        json={
            "proveedor_id": prov,
            "detalles": [
                {
                    "producto_id": prod,
                    "presentacion_id": presentacion_id,
                    "cantidad_presentacion": 1,
                    "costo_presentacion": 5000,
                }
            ],
        },
    )
    assert r.status_code == 200, r.text
    det = r.json()["detalles"][0]
    assert det["cantidad_base"] == 100
    assert det["costo_unitario_base"] == 50
    assert det["factor_aplicado"] == 100

    saldo = (await admin_client.get(f"/stock/{prod}")).json()
    assert saldo["cantidad"] == 100


@pytest.mark.anyio
async def test_compra_proveedor_invalido_422(admin_client):
    prod = await _producto(admin_client, "Switch PoE")
    r = await admin_client.post(
        "/compras",
        json={
            "proveedor_id": 999999,
            "detalles": [{"producto_id": prod, "cantidad_presentacion": 1, "costo_presentacion": 10}],
        },
    )
    assert r.status_code == 422, r.text


@pytest.mark.anyio
async def test_anular_compra_revierte_stock(admin_client):
    prov = await _proveedor(admin_client)
    prod = await _producto(admin_client, "Patch cord")

    compra = await admin_client.post(
        "/compras",
        json={
            "proveedor_id": prov,
            "detalles": [{"producto_id": prod, "cantidad_presentacion": 20, "costo_presentacion": 100}],
        },
    )
    fid = compra.json()["factura_compra_id"]
    assert (await admin_client.get(f"/stock/{prod}")).json()["cantidad"] == 20

    r = await admin_client.post(f"/compras/{fid}/anular")
    assert r.status_code == 200, r.text
    assert r.json()["descripcion_efcompra"] == "ANULADA"
    assert (await admin_client.get(f"/stock/{prod}")).json()["cantidad"] == 0

    # Doble anulación → 409.
    r2 = await admin_client.post(f"/compras/{fid}/anular")
    assert r2.status_code == 409, r2.text


@pytest.mark.anyio
async def test_anular_compra_consumida_falla_400(admin_client):
    prov = await _proveedor(admin_client)
    prod = await _producto(admin_client, "Fusible")

    compra = await admin_client.post(
        "/compras",
        json={
            "proveedor_id": prov,
            "detalles": [{"producto_id": prod, "cantidad_presentacion": 10, "costo_presentacion": 30}],
        },
    )
    fid = compra.json()["factura_compra_id"]

    # Consumir todo vía ajuste negativo.
    await admin_client.post(
        "/stock/ajustes",
        json={"producto_id": prod, "cantidad": 10, "positivo": False, "motivo": "consumo"},
    )

    r = await admin_client.post(f"/compras/{fid}/anular")
    assert r.status_code == 400, r.text
    # La factura sigue EMITIDA (no se anuló).
    assert (await admin_client.get(f"/compras/{fid}")).json()["descripcion_efcompra"] == "EMITIDA"
