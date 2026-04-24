import pytest
from psycopg import Connection


def _count(conn: Connection, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]


def _get_first_cliente_id(conn: Connection) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT cliente_id FROM clientes ORDER BY cliente_id LIMIT 1")
        row = cur.fetchone()
        if not row:
            raise AssertionError("El seed no tiene clientes para testear domicilios")
        return row[0]


def _insert_cliente_minimo(conn: Connection, dni: str = "39999111") -> int:
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
                "Test",
                dni,
                "3874000000",
                f"{dni}@mail.com",
                1,
                "test domicilios",
            ),
        )
        cliente_id = cur.fetchone()[0]

    conn.commit()
    return cliente_id


@pytest.mark.anyio
async def test_crear_domicilio_ok(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39999112")
    before = _count(db_conn, "domicilios")

    payload = {
        "complejo": "Torre Norte",
        "piso": 5,
        "depto": "B",
        "calle": "Alsina",
        "numero": 450,
        "referencias": "Frente al porton",
        "estado_domicilio_id": 1,
    }

    r = await admin_client.post(f"/clientes/{cliente_id}/domicilios", json=payload)
    assert r.status_code == 201, r.text

    body = r.json()
    assert body["cliente_id"] == cliente_id
    assert body["calle"] == "Alsina"
    assert body["numero"] == 450
    assert body["fecha_hasta_dom"] is None

    assert _count(db_conn, "domicilios") == before + 1


@pytest.mark.anyio
async def test_crear_domicilio_cierra_vigente_anterior(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39999113")

    payload_1 = {
        "complejo": "Torre A",
        "piso": 1,
        "depto": "A",
        "calle": "Mitre",
        "numero": 100,
        "referencias": "Primer domicilio",
        "estado_domicilio_id": 1,
    }

    r1 = await admin_client.post(f"/clientes/{cliente_id}/domicilios", json=payload_1)
    assert r1.status_code == 201, r1.text
    domicilio_1 = r1.json()

    payload_2 = {
        "complejo": "Torre B",
        "piso": 8,
        "depto": "C",
        "calle": "Balcarce",
        "numero": 999,
        "referencias": "Segundo domicilio",
        "estado_domicilio_id": 1,
    }

    r2 = await admin_client.post(f"/clientes/{cliente_id}/domicilios", json=payload_2)
    assert r2.status_code == 201, r2.text
    domicilio_2 = r2.json()

    assert domicilio_1["domicilio_id"] != domicilio_2["domicilio_id"]

    rv = await admin_client.get(f"/clientes/{cliente_id}/domicilio-vigente")
    assert rv.status_code == 200, rv.text
    vigente = rv.json()

    assert vigente["domicilio_id"] == domicilio_2["domicilio_id"]
    assert vigente["calle"] == "Balcarce"

    rh = await admin_client.get(f"/clientes/{cliente_id}/domicilios")
    assert rh.status_code == 200, rh.text
    historial = rh.json()

    assert len(historial) == 2

    primero = next(x for x in historial if x["domicilio_id"] == domicilio_1["domicilio_id"])
    segundo = next(x for x in historial if x["domicilio_id"] == domicilio_2["domicilio_id"])

    assert primero["fecha_hasta_dom"] is not None
    assert segundo["fecha_hasta_dom"] is None


@pytest.mark.anyio
async def test_listar_historial_domicilios(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39999114")

    payload_1 = {
        "complejo": "Hist 1",
        "piso": 2,
        "depto": "A",
        "calle": "San Martin",
        "numero": 10,
        "referencias": "Uno",
        "estado_domicilio_id": 1,
    }

    payload_2 = {
        "complejo": "Hist 2",
        "piso": 4,
        "depto": "D",
        "calle": "Belgrano",
        "numero": 20,
        "referencias": "Dos",
        "estado_domicilio_id": 1,
    }

    r1 = await admin_client.post(f"/clientes/{cliente_id}/domicilios", json=payload_1)
    assert r1.status_code == 201, r1.text

    r2 = await admin_client.post(f"/clientes/{cliente_id}/domicilios", json=payload_2)
    assert r2.status_code == 201, r2.text

    r = await admin_client.get(f"/clientes/{cliente_id}/domicilios")
    assert r.status_code == 200, r.text

    body = r.json()
    assert len(body) == 2
    assert body[0]["calle"] == "Belgrano"
    assert body[1]["calle"] == "San Martin"


@pytest.mark.anyio
async def test_get_domicilio_vigente_404_si_no_tiene(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39999115")

    r = await admin_client.get(f"/clientes/{cliente_id}/domicilio-vigente")
    assert r.status_code == 404, r.text
    assert r.json()["detail"] == "Domicilio vigente not found"


@pytest.mark.anyio
async def test_post_domicilio_404_si_cliente_no_existe(admin_client):
    payload = {
        "complejo": "Nope",
        "piso": 1,
        "depto": "A",
        "calle": "Inexistente",
        "numero": 123,
        "referencias": None,
        "estado_domicilio_id": 1,
    }

    r = await admin_client.post("/clientes/999999/domicilios", json=payload)
    assert r.status_code == 404, r.text
    assert r.json()["detail"] == "Cliente not found"


@pytest.mark.anyio
async def test_post_domicilio_fechas_invalidas_422(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39999116")

    payload = {
        "complejo": "Fechas",
        "piso": 1,
        "depto": "A",
        "calle": "Urquiza",
        "numero": 55,
        "referencias": None,
        "fecha_desde_dom": "2026-03-10T10:00:00Z",
        "fecha_hasta_dom": "2026-03-01T10:00:00Z",
        "estado_domicilio_id": 1,
    }

    r = await admin_client.post(f"/clientes/{cliente_id}/domicilios", json=payload)
    assert r.status_code == 422, r.text
    assert "fecha_hasta_dom" in r.json()["detail"]


@pytest.mark.anyio
async def test_post_domicilio_estado_invalido_422_y_sin_basura(admin_client, db_conn):
    cliente_id = _insert_cliente_minimo(db_conn, "39999117")
    before = _count(db_conn, "domicilios")

    payload = {
        "complejo": "FK",
        "piso": 9,
        "depto": "Z",
        "calle": "Rivadavia",
        "numero": 777,
        "referencias": "estado invalido",
        "estado_domicilio_id": 999999,
    }

    r = await admin_client.post(f"/clientes/{cliente_id}/domicilios", json=payload)
    assert r.status_code == 422, r.text
    assert _count(db_conn, "domicilios") == before
