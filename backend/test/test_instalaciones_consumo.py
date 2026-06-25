# backend/test/test_instalaciones_consumo.py
#
# El consumo de material al cargar un detalle de instalación descuenta stock
# (SALIDA_INSTALACION) y se bloquea si no hay saldo suficiente.

import pytest


TIPO_PRODUCTO_ID = 1


def _instalacion_id(db_conn) -> int:
    with db_conn.cursor() as cur:
        cur.execute("SELECT instalacion_id FROM instalaciones ORDER BY instalacion_id ASC LIMIT 1")
        row = cur.fetchone()
    assert row is not None, "El seed de test debe tener al menos una instalación"
    return int(row[0])


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
async def test_detalle_sin_stock_bloquea_400(admin_client, db_conn):
    inst = _instalacion_id(db_conn)
    prod = await _producto(admin_client, "Grampa stock cero")

    r = await admin_client.post(
        f"/instalaciones/{inst}/detalles",
        json={
            "producto_id": prod,
            "cantidad_dinstalacion": 5,
            "unidad_dinstalacion": "unidad",
        },
    )
    assert r.status_code == 400, r.text
    assert "insuficiente" in r.json()["detail"].lower()


@pytest.mark.anyio
async def test_detalle_descuenta_stock_y_expone_costo(admin_client, db_conn):
    inst = _instalacion_id(db_conn)
    prod = await _producto(admin_client, "Grampa con stock")

    # Ajuste positivo sin stock previo: entra a costo PMP 0 (suficiente para
    # validar el descuento de cantidad y la exposición de costo por línea).
    await admin_client.post(
        "/stock/ajustes",
        json={"producto_id": prod, "cantidad": 10, "positivo": True, "motivo": "alta"},
    )

    r = await admin_client.post(
        f"/instalaciones/{inst}/detalles",
        json={
            "producto_id": prod,
            "cantidad_dinstalacion": 3,
            "unidad_dinstalacion": "unidad",
        },
    )
    assert r.status_code == 200, r.text

    saldo = (await admin_client.get(f"/stock/{prod}")).json()
    assert saldo["cantidad"] == 7

    # El detalle expone el costo de la salida imputada.
    detalles = (await admin_client.get(f"/instalaciones/{inst}/detalles")).json()["items"]
    linea = [d for d in detalles if d["producto_id"] == prod][0]
    assert linea["costo_unitario_dinstalacion"] is not None
    assert linea["costo_total_dinstalacion"] is not None


@pytest.mark.anyio
async def test_consumo_costea_a_pmp_de_la_compra(admin_client, db_conn):
    inst = _instalacion_id(db_conn)
    prod = await _producto(admin_client, "Cable PMP")

    prov = await admin_client.post(
        "/proveedores",
        json={"nombre_prov": "Prov PMP", "estado_proveedor_id": 1},
    )
    prov_id = prov.json()["proveedor_id"]

    # Compra: 100 u a $50/u → PMP 50.
    await admin_client.post(
        "/compras",
        json={
            "proveedor_id": prov_id,
            "detalles": [{"producto_id": prod, "cantidad_presentacion": 100, "costo_presentacion": 50}],
        },
    )

    r = await admin_client.post(
        f"/instalaciones/{inst}/detalles",
        json={"producto_id": prod, "cantidad_dinstalacion": 4, "unidad_dinstalacion": "metros"},
    )
    assert r.status_code == 200, r.text

    detalles = (await admin_client.get(f"/instalaciones/{inst}/detalles")).json()["items"]
    linea = [d for d in detalles if d["producto_id"] == prod][0]
    assert linea["costo_unitario_dinstalacion"] == 50
    assert linea["costo_total_dinstalacion"] == 200
