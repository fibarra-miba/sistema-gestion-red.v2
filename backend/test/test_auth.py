import pytest
from psycopg import Connection


def _count(conn: Connection, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]


def _get_usuario_by_username(conn: Connection, username: str):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                usuario_id,
                username_usuario,
                email_usuario,
                activo_usuario,
                requiere_cambio_password_usuario
            FROM usuarios
            WHERE username_usuario = %s
            """,
            (username,),
        )
        return cur.fetchone()


@pytest.mark.anyio
async def test_login_ok_admin(client):
    response = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["username_usuario"] == "admin"
    assert data["email_usuario"] == "admin@red.com"
    assert data["rol"]["codigo_rol"] == "ADMIN"
    assert data["activo_usuario"] is True
    assert data["requiere_cambio_password_usuario"] is False

    set_cookie = response.headers.get("set-cookie", "")
    assert "red_session=" in set_cookie


@pytest.mark.anyio
async def test_login_usuario_inexistente_devuelve_mismo_mensaje(client):
    response = await client.post(
        "/auth/login",
        json={
            "identifier": "usuario_que_no_existe",
            "password": "cualquiercosa",
        },
    )

    assert response.status_code == 401, response.text
    assert response.json()["detail"] == "Credenciales inválidas."


@pytest.mark.anyio
async def test_login_password_incorrecta_devuelve_mismo_mensaje(client):
    response = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "incorrecta",
        },
    )

    assert response.status_code == 401, response.text
    assert response.json()["detail"] == "Credenciales inválidas."


@pytest.mark.anyio
async def test_login_usuario_inactivo_falla_como_credenciales_invalidas(client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            UPDATE usuarios
               SET activo_usuario = FALSE
             WHERE username_usuario = 'admin'
            """
        )
    db_conn.commit()

    response = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )

    assert response.status_code == 401, response.text
    assert response.json()["detail"] == "Credenciales inválidas."


@pytest.mark.anyio
async def test_auth_me_con_sesion_valida(client):
    login = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )
    assert login.status_code == 200, login.text

    response = await client.get("/auth/me")

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["username_usuario"] == "admin"
    assert data["rol"]["codigo_rol"] == "ADMIN"
    assert data["capabilities"]["can_manage_users"] is True
    assert data["capabilities"]["can_manage_planes"] is True
    assert data["capabilities"]["can_manage_clientes"] is True
    assert data["capabilities"]["can_manage_pagos"] is True


@pytest.mark.anyio
async def test_auth_me_sin_cookie_rechaza(client):
    response = await client.get("/auth/me")

    assert response.status_code == 401, response.text
    assert response.json()["detail"] == "No autenticado."


@pytest.mark.anyio
async def test_logout_revoca_sesion(client):
    login = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )
    assert login.status_code == 200, login.text

    me_before = await client.get("/auth/me")
    assert me_before.status_code == 200, me_before.text

    logout = await client.post("/auth/logout")
    assert logout.status_code == 200, logout.text
    assert logout.json()["message"] == "Sesión cerrada correctamente."

    me_after = await client.get("/auth/me")
    assert me_after.status_code == 401, me_after.text


@pytest.mark.anyio
async def test_change_password_ok_y_exige_relogin(client):
    login = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )
    assert login.status_code == 200, login.text

    response = await client.post(
        "/auth/change-password",
        json={
            "current_password": "admin",
            "new_password": "AdminNuevo1",
            "revoke_all_sessions": True,
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["message"] == "Contraseña actualizada. Debe iniciar sesión nuevamente."

    me_after = await client.get("/auth/me")
    assert me_after.status_code == 401, me_after.text

    old_login = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )
    assert old_login.status_code == 401, old_login.text
    assert old_login.json()["detail"] == "Credenciales inválidas."

    new_login = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "AdminNuevo1",
        },
    )
    assert new_login.status_code == 200, new_login.text


@pytest.mark.anyio
async def test_change_password_falla_si_password_actual_incorrecta(client):
    login = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )
    assert login.status_code == 200, login.text

    response = await client.post(
        "/auth/change-password",
        json={
            "current_password": "mal_actual",
            "new_password": "AdminNuevo1",
            "revoke_all_sessions": True,
        },
    )

    assert response.status_code == 400, response.text
    assert response.json()["detail"] == "La contraseña actual es incorrecta."


@pytest.mark.anyio
async def test_change_password_falla_si_nueva_no_cumple_politica(client):
    login = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )
    assert login.status_code == 200, login.text

    response = await client.post(
        "/auth/change-password",
        json={
            "current_password": "admin",
            "new_password": "sinmayus",
            "revoke_all_sessions": True,
        },
    )

    assert response.status_code == 400, response.text
    assert "mayúscula" in response.json()["detail"]


@pytest.mark.anyio
async def test_login_failure_audita_evento(client, db_conn):
    before = _count(db_conn, "auditoria_eventos")

    response = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "incorrecta",
        },
    )

    assert response.status_code == 401, response.text
    assert _count(db_conn, "auditoria_eventos") == before + 1

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT accion_auditoria
            FROM auditoria_eventos
            ORDER BY auditoria_id DESC
            LIMIT 1
            """
        )
        row = cur.fetchone()

    assert row is not None
    assert row[0] == "LOGIN_FAILURE"


@pytest.mark.anyio
async def test_login_success_crea_sesion_y_auditoria(client, db_conn):
    before_sessions = _count(db_conn, "sesiones_usuarios")
    before_audit = _count(db_conn, "auditoria_eventos")

    response = await client.post(
        "/auth/login",
        json={
            "identifier": "admin",
            "password": "admin",
        },
    )

    assert response.status_code == 200, response.text
    assert _count(db_conn, "sesiones_usuarios") == before_sessions + 1
    assert _count(db_conn, "auditoria_eventos") >= before_audit + 1

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT accion_auditoria
            FROM auditoria_eventos
            ORDER BY auditoria_id DESC
            LIMIT 1
            """
        )
        row = cur.fetchone()

    assert row is not None
    assert row[0] == "LOGIN_SUCCESS"
