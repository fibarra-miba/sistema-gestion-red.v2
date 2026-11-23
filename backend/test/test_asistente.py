# backend/test/test_asistente.py
"""Fachada del asistente de Telegram (docs/asistente.md)."""

import pytest

from app.core.security import SESSION_COOKIE_NAME
from app.repositories.asistente_repo import AsistenteRepository

SECRETO = "secreto-de-prueba"
TELEGRAM_ADMIN = 555000111
UA = "RED-Asistente/telegram"


def _usuario_id(conn, username: str) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT usuario_id FROM usuarios WHERE username_usuario = %s", (username,))
        return cur.fetchone()[0]


@pytest.fixture
def secreto(monkeypatch):
    monkeypatch.setenv("ASISTENTE_SECRETO", SECRETO)
    return SECRETO


@pytest.fixture
def admin_vinculado(db_conn):
    AsistenteRepository(db_conn).vincular(_usuario_id(db_conn, "admin"), TELEGRAM_ADMIN)
    db_conn.commit()
    return TELEGRAM_ADMIN


async def _pedir_sesion(client, telegram_id, secreto=SECRETO, headers=None):
    h = {"X-Asistente-Secreto": secreto, "User-Agent": UA}
    h.update(headers or {})
    return await client.post("/asistente/sesion", json={"telegram_user_id": telegram_id}, headers=h)


# ==========================================================
# Sesión interna
# ==========================================================

@pytest.mark.anyio
async def test_sesion_deshabilitada_sin_secreto(client, admin_vinculado, monkeypatch):
    monkeypatch.delenv("ASISTENTE_SECRETO", raising=False)
    r = await _pedir_sesion(client, admin_vinculado)
    assert r.status_code == 503, r.text


@pytest.mark.anyio
async def test_sesion_secreto_incorrecto(client, secreto, admin_vinculado):
    r = await _pedir_sesion(client, admin_vinculado, secreto="otro")
    assert r.status_code == 401, r.text


@pytest.mark.anyio
async def test_sesion_rechaza_lo_que_viene_por_proxy(client, secreto, admin_vinculado):
    r = await _pedir_sesion(client, admin_vinculado, headers={"X-Forwarded-For": "1.2.3.4"})
    assert r.status_code == 403, r.text


@pytest.mark.anyio
async def test_sesion_cuenta_no_vinculada(client, secreto):
    r = await _pedir_sesion(client, 999999)
    assert r.status_code == 404, r.text


@pytest.mark.anyio
async def test_sesion_desvinculada_no_entra(client, secreto, admin_vinculado, db_conn):
    assert AsistenteRepository(db_conn).desvincular(_usuario_id(db_conn, "admin"))
    db_conn.commit()
    r = await _pedir_sesion(client, admin_vinculado)
    assert r.status_code == 404, r.text


@pytest.mark.anyio
async def test_sesion_ok_actua_como_el_usuario_y_audita(client, secreto, admin_vinculado, db_conn):
    r = await _pedir_sesion(client, admin_vinculado)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["usuario"]["username"] == "admin"
    assert data["usuario"]["rol"] == "ADMIN"

    # La sesión emitida sirve para el resto de la API, con los permisos del usuario.
    client.cookies.set(SESSION_COOKIE_NAME, data["token"])
    me = await client.get("/auth/me")
    assert me.status_code == 200, me.text

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT user_agent_auditoria, detalle_auditoria FROM auditoria_eventos
            WHERE accion_auditoria = 'LOGIN_ASISTENTE'
            ORDER BY auditoria_id DESC LIMIT 1
            """
        )
        ua, detalle = cur.fetchone()
    assert ua == UA
    assert detalle == f"telegram:{TELEGRAM_ADMIN}"


def test_un_telegram_no_se_vincula_a_dos_usuarios(db_conn):
    import psycopg

    repo = AsistenteRepository(db_conn)
    repo.vincular(_usuario_id(db_conn, "admin"), 777)
    with pytest.raises(psycopg.errors.UniqueViolation):
        repo.vincular(_usuario_id(db_conn, "operador"), 777)
    db_conn.rollback()


# ==========================================================
# Consultas compactas
# ==========================================================

@pytest.mark.anyio
async def test_buscar_clientes(admin_client):
    r = await admin_client.get("/asistente/clientes", params={"q": "cliente testing"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total"] == 1
    c = data["clientes"][0]
    assert set(c) == {"id", "nombre", "dni", "tel", "estado", "domicilio", "contratos_vigentes"}
    assert c["nombre"] == "Cliente Testing"
    assert c["domicilio"].startswith("Av. Principal 123, piso 3 depto D")


@pytest.mark.anyio
async def test_buscar_clientes_por_dni(admin_client):
    r = await admin_client.get("/asistente/clientes", params={"q": "87654321"})
    assert r.status_code == 200, r.text
    assert [c["nombre"] for c in r.json()["clientes"]] == ["Cliente PagosSeed"]


@pytest.mark.anyio
async def test_buscar_clientes_texto_corto(admin_client):
    r = await admin_client.get("/asistente/clientes", params={"q": "a"})
    assert r.status_code == 422, r.text


@pytest.mark.anyio
async def test_buscar_clientes_tecnico_403(tecnico_client):
    r = await tecnico_client.get("/asistente/clientes", params={"q": "cliente"})
    assert r.status_code == 403, r.text


@pytest.mark.anyio
async def test_ficha_cliente(cobranzas_client):
    r = await cobranzas_client.get("/asistente/clientes/1")
    assert r.status_code == 200, r.text
    f = r.json()
    for k in ("nombre", "dni", "domicilio", "saldo", "contratos", "garantias_con_saldo",
              "proxima_instalacion"):
        assert k in f
    assert f["nombre"] == "Cliente Testing"
    assert isinstance(f["saldo"], float)


@pytest.mark.anyio
async def test_ficha_cliente_inexistente(admin_client):
    r = await admin_client.get("/asistente/clientes/999999")
    assert r.status_code == 404, r.text


@pytest.mark.anyio
async def test_agenda_muestra_programadas_en_hora_local(admin_client, db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO programacion_instalaciones (
                domicilio_id, contrato_id, fecha_programacion_pinstalacion,
                estado_programacion_id, tecnico_pinstalacion
            )
            SELECT k.domicilio_id, k.contrato_id,
                   (CURRENT_DATE + 1 + TIME '10:30') AT TIME ZONE 'America/Argentina/Buenos_Aires',
                   (SELECT estado_programacion_id FROM estado_programacion
                     WHERE descripcion_eprogramacion = 'PROGRAMADA'),
                   'Técnico Agenda'
            FROM contratos k ORDER BY k.contrato_id LIMIT 1
            """
        )
    db_conn.commit()

    r = await admin_client.get("/asistente/agenda")
    assert r.status_code == 200, r.text
    items = [i for i in r.json()["instalaciones"] if i["tecnico"] == "Técnico Agenda"]
    assert len(items) == 1
    assert items[0]["fecha"].endswith("10:30")


@pytest.mark.anyio
async def test_agenda_rango_invalido(admin_client):
    r = await admin_client.get("/asistente/agenda", params={"desde": "2026-01-10", "hasta": "2026-01-01"})
    assert r.status_code == 422, r.text
    r = await admin_client.get("/asistente/agenda", params={"desde": "2026-01-01", "hasta": "2026-03-01"})
    assert r.status_code == 422, r.text


@pytest.mark.anyio
async def test_agenda_cobranzas_403(cobranzas_client):
    r = await cobranzas_client.get("/asistente/agenda")
    assert r.status_code == 403, r.text


@pytest.mark.anyio
async def test_resumen(operador_client):
    r = await operador_client.get("/asistente/resumen")
    assert r.status_code == 200, r.text
    data = r.json()
    assert set(data) == {"clientes_activos", "contratos", "deudores", "deuda_total",
                         "instalaciones_proximos_7_dias"}


@pytest.mark.anyio
async def test_planes_con_precio_vigente(tecnico_client):
    r = await tecnico_client.get("/asistente/planes")
    assert r.status_code == 200, r.text
    planes = r.json()["planes"]
    assert [(p["plan"], p["mbps"], p["precio"]) for p in planes] == [
        ("Plan Básico", 10, 10000.0),
        ("Plan Intermedio", 20, 20000.0),
        ("Plan Avanzado", 40, 40000.0),
    ]
