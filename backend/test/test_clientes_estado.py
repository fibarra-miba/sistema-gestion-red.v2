import pytest
from psycopg import Connection


def _insert_cliente_minimo(conn: Connection, dni: str = "39998001") -> int:
    with conn.cursor() as cur:
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
            VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s)
            RETURNING cliente_id
            """,
            (
                "Cliente",
                "EstadoTest",
                dni,
                "3874001000",
                f"{dni}@mail.com",
                1,  # ACTIVO
                "test estado cliente",
            ),
        )
        cliente_id = cur.fetchone()[0]

    conn.commit()
    return cliente_id


@pytest.mark.anyio
async def test_desactivar_cliente_ok(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39998001")

    r = await admin_client.post(f"/clientes/{cliente_id}/desactivar")
    assert r.status_code == 200, r.text
    assert r.json()["estado_cliente_id"] == 2  # INACTIVO


@pytest.mark.anyio
async def test_activar_cliente_ok(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39998002")

    r_desactivar = await admin_client.post(f"/clientes/{cliente_id}/desactivar")
    assert r_desactivar.status_code == 200, r_desactivar.text

    r = await admin_client.post(f"/clientes/{cliente_id}/activar")
    assert r.status_code == 200, r.text
    assert r.json()["estado_cliente_id"] == 1  # ACTIVO


@pytest.mark.anyio
async def test_activar_cliente_ya_activo_400(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39998003")

    r = await admin_client.post(f"/clientes/{cliente_id}/activar")
    assert r.status_code == 400, r.text
    assert r.json()["detail"] == "El cliente ya está ACTIVO."


@pytest.mark.anyio
async def test_desactivar_cliente_ya_inactivo_400(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39998004")

    r1 = await admin_client.post(f"/clientes/{cliente_id}/desactivar")
    assert r1.status_code == 200, r1.text

    r2 = await admin_client.post(f"/clientes/{cliente_id}/desactivar")
    assert r2.status_code == 400, r2.text
    assert r2.json()["detail"] == "El cliente ya está INACTIVO."


@pytest.mark.anyio
async def test_desactivar_cliente_con_contrato_activo_400(admin_client):
    # Cliente 2 del seed tiene un contrato ACTIVO (ver test/sql/010_fixtures.sql).
    r = await admin_client.post("/clientes/2/desactivar")
    assert r.status_code == 400, r.text
    assert "contratos activos o suspendidos" in r.json()["detail"]


@pytest.mark.anyio
async def test_activar_cliente_inexistente_404(admin_client):
    r = await admin_client.post("/clientes/999999/activar")
    assert r.status_code == 404, r.text
    assert r.json()["detail"] == "Cliente not found"


@pytest.mark.anyio
async def test_desactivar_cliente_inexistente_404(admin_client):
    r = await admin_client.post("/clientes/999999/desactivar")
    assert r.status_code == 404, r.text
    assert r.json()["detail"] == "Cliente not found"
