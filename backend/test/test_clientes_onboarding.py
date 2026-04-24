import pytest
from psycopg import Connection

# -------------------------------------------------
# Helpers
# -------------------------------------------------
def _count(conn: Connection, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]


# -------------------------------------------------
# Tests
# -------------------------------------------------
@pytest.mark.anyio
async def test_onboarding_ok_crea_todo(admin_client, db_conn):
    payload = {
        "cliente": {
            "nombre": "Juan",
            "apellido": "Perez",
            "dni": "30111222",
            "telefono": "3875550000",
            "email": "juanp@example.com",
            "estado_cliente_id": 1,
            "observacion": "alta test",
        },
        "domicilio": {
            # Campos alineados a tabla domicilios (histórico)
            "complejo": "Torre A",
            "piso": 3,
            "depto": "D",
            "calle": "Mitre",
            "numero": 123,
            "referencias": "Puerta azul",
            # Histórico / estado
            "estado_domicilio": 1,  # VIGENTE (según tu seed/catálogo)
            # fecha_desde_dom opcional: si no viene, se usa NOW()
            # "fecha_desde_dom": "2026-02-22T12:00:00Z"
        },
        "cuenta": {
            "estado_cuenta_id": 1
        }
    }

    before_clientes = _count(db_conn, "clientes")
    before_domicilios = _count(db_conn, "domicilios")
    before_cuenta = _count(db_conn, "cuenta")

    r = await admin_client.post("/clientes/onboarding", json=payload)
    assert r.status_code == 201, r.text

    assert _count(db_conn, "clientes") == before_clientes + 1
    assert _count(db_conn, "domicilios") == before_domicilios + 1
    assert _count(db_conn, "cuenta") == before_cuenta + 1


@pytest.mark.anyio
async def test_onboarding_duplicado_dni_409_y_no_deja_basura(admin_client, db_conn):
    payload = {
        "cliente": {
            "nombre": "A",
            "apellido": "B",
            "dni": "30999000",
            "telefono": "3875551111",
            "email": "a@b.com",
            "estado_cliente_id": 1,
            "observacion": None,
        },
        "domicilio": {
            "complejo": None,
            "piso": None,
            "depto": None,
            "calle": "X",
            "numero": 1,
            "referencias": None,
            "estado_domicilio": 1,  # VIGENTE
        },
        "cuenta": {
            "estado_cuenta_id": 1
        }
    }

    r1 = await admin_client.post("/clientes/onboarding", json=payload)
    assert r1.status_code == 201, r1.text

    before_clientes = _count(db_conn, "clientes")
    before_domicilios = _count(db_conn, "domicilios")
    before_cuenta = _count(db_conn, "cuenta")

    r2 = await admin_client.post("/clientes/onboarding", json=payload)
    assert r2.status_code == 409, r2.text

    # Si tu onboarding corre en transacción (como pretendemos),
    # esto valida que el segundo intento no dejó inserts parciales.
    assert _count(db_conn, "clientes") == before_clientes
    assert _count(db_conn, "domicilios") == before_domicilios
    assert _count(db_conn, "cuenta") == before_cuenta


@pytest.mark.anyio
async def test_onboarding_estado_cliente_invalido_422_y_rollback(admin_client, db_conn):
    payload = {
        "cliente": {
            "nombre": "FK",
            "apellido": "Bad",
            "dni": "30000111",
            "telefono": "3875552222",
            "email": "fk@bad.com",
            "estado_cliente_id": 999999,  # FK inválida
            "observacion": None,
        },
        "domicilio": {
            "calle": "Y",
            "numero": 2,
            "piso": None,
            "depto": None,
            "complejo": None,
            "referencias": None,
            "estado_domicilio": 1,
        },
        "cuenta": {
            "estado_cuenta_id": 1
        }
    }

    before_clientes = _count(db_conn, "clientes")
    before_domicilios = _count(db_conn, "domicilios")
    before_cuenta = _count(db_conn, "cuenta")

    r = await admin_client.post("/clientes/onboarding", json=payload)
    assert r.status_code in (400, 422), r.text

    assert _count(db_conn, "clientes") == before_clientes
    assert _count(db_conn, "domicilios") == before_domicilios
    assert _count(db_conn, "cuenta") == before_cuenta


@pytest.mark.anyio
async def test_onboarding_estado_cuenta_invalido_422_y_rollback(admin_client, db_conn):
    payload = {
        "cliente": {
            "nombre": "Cuenta",
            "apellido": "Bad",
            "dni": "30000222",
            "telefono": "3875553333",
            "email": "cuenta@bad.com",
            "estado_cliente_id": 1,
            "observacion": None,
        },
        "domicilio": {
            "calle": "Z",
            "numero": 3,
            "piso": None,
            "depto": None,
            "complejo": None,
            "referencias": None,
            "estado_domicilio": 1,
        },
        "cuenta": {
            "estado_cuenta_id": 999999  # FK inválida
        }
    }

    before_clientes = _count(db_conn, "clientes")
    before_domicilios = _count(db_conn, "domicilios")
    before_cuenta = _count(db_conn, "cuenta")

    r = await admin_client.post("/clientes/onboarding", json=payload)
    assert r.status_code in (400, 422), r.text

    assert _count(db_conn, "clientes") == before_clientes
    assert _count(db_conn, "domicilios") == before_domicilios
    assert _count(db_conn, "cuenta") == before_cuenta

