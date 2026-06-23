import pytest
from psycopg import Connection


def _count(conn: Connection, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]


def _login_admin_payload():
    return {
        "identifier": "admin",
        "password": "admin",
    }


def _crear_usuario_payload(
    username: str = "operador1",
    email: str = "operador1@red.com",
    codigo_rol: str = "OPERADOR",
):
    return {
        "codigo_rol": codigo_rol,
        "username_usuario": username,
        "email_usuario": email,
        "password": "Operador1",
        "nombre_usuario": "Juan",
        "apellido_usuario": "Operador",
        "activo_usuario": True,
        "requiere_cambio_password_usuario": False,
    }


@pytest.mark.anyio
async def test_list_roles_admin_ok(client):
    login = await client.post("/auth/login", json=_login_admin_payload())
    assert login.status_code == 200, login.text

    response = await client.get("/usuarios/roles")

    assert response.status_code == 200, response.text
    data = response.json()

    codigos = {item["codigo_rol"] for item in data}
    assert {"ADMIN", "OPERADOR", "TECNICO", "COBRANZAS"} <= codigos


@pytest.mark.anyio
async def test_list_usuarios_requiere_admin(client):
    response = await client.get("/usuarios")

    assert response.status_code == 401, response.text


@pytest.mark.anyio
async def test_create_usuario_admin_ok(client, db_conn):
    login = await client.post("/auth/login", json=_login_admin_payload())
    assert login.status_code == 200, login.text

    before = _count(db_conn, "usuarios")

    response = await client.post(
        "/usuarios",
        json=_crear_usuario_payload(),
    )

    assert response.status_code == 201, response.text
    data = response.json()

    assert _count(db_conn, "usuarios") == before + 1
    assert data["username_usuario"] == "operador1"
    assert data["email_usuario"] == "operador1@red.com"
    assert data["codigo_rol"] == "OPERADOR"
    assert data["activo_usuario"] is True
    assert data["requiere_cambio_password_usuario"] is False


@pytest.mark.anyio
async def test_create_usuario_duplicado_devuelve_409(client):
    login = await client.post("/auth/login", json=_login_admin_payload())
    assert login.status_code == 200, login.text

    r1 = await client.post(
        "/usuarios",
        json=_crear_usuario_payload(),
    )
    assert r1.status_code == 201, r1.text

    r2 = await client.post(
        "/usuarios",
        json=_crear_usuario_payload(),
    )

    assert r2.status_code == 409, r2.text
    assert r2.json()["detail"] == "Username o email ya existente."


@pytest.mark.anyio
async def test_create_usuario_password_invalida_rechaza(client):
    login = await client.post("/auth/login", json=_login_admin_payload())
    assert login.status_code == 200, login.text

    payload = _crear_usuario_payload()
    payload["password"] = "SinNumero"

    response = await client.post("/usuarios", json=payload)

    assert response.status_code == 400, response.text
    assert "número" in response.json()["detail"]


@pytest.mark.anyio
async def test_get_usuario_by_id_admin_ok(client):
    login = await client.post("/auth/login", json=_login_admin_payload())
    assert login.status_code == 200, login.text

    create = await client.post("/usuarios", json=_crear_usuario_payload())
    assert create.status_code == 201, create.text
    usuario_id = create.json()["usuario_id"]

    response = await client.get(f"/usuarios/{usuario_id}")

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["usuario_id"] == usuario_id
    assert data["username_usuario"] == "operador1"


@pytest.mark.anyio
async def test_patch_usuario_admin_ok(client):
    login = await client.post("/auth/login", json=_login_admin_payload())
    assert login.status_code == 200, login.text

    create = await client.post("/usuarios", json=_crear_usuario_payload())
    assert create.status_code == 201, create.text
    usuario_id = create.json()["usuario_id"]

    response = await client.patch(
        f"/usuarios/{usuario_id}",
        json={
            "codigo_rol": "TECNICO",
            "activo_usuario": False,
            "requiere_cambio_password_usuario": True,
            "nombre_usuario": "Pedro",
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["codigo_rol"] == "TECNICO"
    assert data["activo_usuario"] is False
    assert data["requiere_cambio_password_usuario"] is True
    assert data["nombre_usuario"] == "Pedro"


@pytest.mark.anyio
async def test_reset_password_admin_ok_y_fuerza_cambio(client):
    login = await client.post("/auth/login", json=_login_admin_payload())
    assert login.status_code == 200, login.text

    create = await client.post(
        "/usuarios",
        json=_crear_usuario_payload(
            username="cobranzas1",
            email="cobranzas1@red.com",
            codigo_rol="COBRANZAS",
        ),
    )
    assert create.status_code == 201, create.text
    usuario_id = create.json()["usuario_id"]

    reset = await client.post(f"/usuarios/{usuario_id}/reset-password")
    assert reset.status_code == 200, reset.text
    assert reset.json()["message"] == "Contraseña reseteada a Inicio.01 y cambio obligatorio activado."

    login_user = await client.post(
        "/auth/login",
        json={
            "identifier": "cobranzas1",
            "password": "Inicio.01",
        },
    )
    assert login_user.status_code == 200, login_user.text
    data = login_user.json()
    assert data["requiere_cambio_password_usuario"] is True

    forbidden = await client.get("/catalogos/medios-pagos")
    assert forbidden.status_code == 403, forbidden.text
    assert forbidden.json()["detail"] == "Debe cambiar su contraseña antes de continuar."


@pytest.mark.anyio
async def test_usuario_reseteado_puede_cambiar_password_y_luego_operar(client):
    admin_login = await client.post("/auth/login", json=_login_admin_payload())
    assert admin_login.status_code == 200, admin_login.text

    create = await client.post(
        "/usuarios",
        json=_crear_usuario_payload(
            username="tecnico1",
            email="tecnico1@red.com",
            codigo_rol="TECNICO",
        ),
    )
    assert create.status_code == 201, create.text
    usuario_id = create.json()["usuario_id"]

    reset = await client.post(f"/usuarios/{usuario_id}/reset-password")
    assert reset.status_code == 200, reset.text

    await client.post("/auth/logout")

    login_tecnico = await client.post(
        "/auth/login",
        json={
            "identifier": "tecnico1",
            "password": "Inicio.01",
        },
    )
    assert login_tecnico.status_code == 200, login_tecnico.text
    assert login_tecnico.json()["requiere_cambio_password_usuario"] is True

    blocked = await client.get("/instalaciones")
    assert blocked.status_code == 403, blocked.text

    change = await client.post(
        "/auth/change-password",
        json={
            "current_password": "Inicio.01",
            "new_password": "TecnicoNuevo1",
            "revoke_all_sessions": True,
        },
    )
    assert change.status_code == 200, change.text

    relogin = await client.post(
        "/auth/login",
        json={
            "identifier": "tecnico1",
            "password": "TecnicoNuevo1",
        },
    )
    assert relogin.status_code == 200, relogin.text
    assert relogin.json()["requiere_cambio_password_usuario"] is False

    allowed = await client.get("/instalaciones")
    assert allowed.status_code == 200, allowed.text


@pytest.mark.anyio
async def test_operador_no_puede_entrar_a_usuarios(client):
    admin_login = await client.post("/auth/login", json=_login_admin_payload())
    assert admin_login.status_code == 200, admin_login.text

    create = await client.post(
        "/usuarios",
        json=_crear_usuario_payload(
            username="operador2",
            email="operador2@red.com",
            codigo_rol="OPERADOR",
        ),
    )
    assert create.status_code == 201, create.text

    await client.post("/auth/logout")

    login_operador = await client.post(
        "/auth/login",
        json={
            "identifier": "operador2",
            "password": "Operador1",
        },
    )
    assert login_operador.status_code == 200, login_operador.text

    response = await client.get("/usuarios")

    assert response.status_code == 403, response.text
    assert response.json()["detail"] == "No autorizado."


@pytest.mark.anyio
async def test_cobranzas_puede_pagos_pero_no_instalaciones(client):
    admin_login = await client.post("/auth/login", json=_login_admin_payload())
    assert admin_login.status_code == 200, admin_login.text

    create = await client.post(
        "/usuarios",
        json=_crear_usuario_payload(
            username="cobranzas2",
            email="cobranzas2@red.com",
            codigo_rol="COBRANZAS",
        ),
    )
    assert create.status_code == 201, create.text

    await client.post("/auth/logout")

    login_cobranzas = await client.post(
        "/auth/login",
        json={
            "identifier": "cobranzas2",
            "password": "Operador1",
        },
    )
    assert login_cobranzas.status_code == 200, login_cobranzas.text

    pagos = await client.get("/clientes/2/cuenta")
    assert pagos.status_code == 200, pagos.text

    instalaciones = await client.get("/instalaciones")
    assert instalaciones.status_code == 403, instalaciones.text
    assert instalaciones.json()["detail"] == "No autorizado."

    # COBRANZAS necesita LEER clientes y contratos para operar la pantalla de
    # pagos (selectores cruzados): esas lecturas deben estar permitidas.
    clientes_list = await client.get("/clientes")
    assert clientes_list.status_code == 200, clientes_list.text

    contratos_list = await client.get("/contratos")
    assert contratos_list.status_code == 200, contratos_list.text

    # ...pero NO debe poder escribir ni operar transiciones comerciales.
    cliente_create = await client.post("/clientes", json={})
    assert cliente_create.status_code == 403, cliente_create.text

    contrato_activate = await client.post("/contratos/1/activate")
    assert contrato_activate.status_code == 403, contrato_activate.text
