import pytest

from app.cli.create_admin import crear_admin, existe_admin_activo
from app.core.security import verify_password

PASSWORD = "AdminNuevo1"


def _datos(**override):
    datos = {
        "username": "root",
        "email": "root@red.com",
        "nombre": "Root",
        "apellido": "Sistema",
        "password": PASSWORD,
    }
    datos.update(override)
    return datos


def test_crear_admin_ok(db_conn):
    usuario_id = crear_admin(db_conn, **_datos())

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT r.codigo_rol, u.activo_usuario, u.requiere_cambio_password_usuario,
                   u.password_hash_usuario
            FROM usuarios u JOIN roles r ON r.rol_id = u.rol_id
            WHERE u.usuario_id = %s
            """,
            (usuario_id,),
        )
        rol, activo, requiere_cambio, password_hash = cur.fetchone()
        cur.execute(
            """
            SELECT detalle_auditoria FROM auditoria_eventos
            WHERE accion_auditoria = 'CREAR_ADMIN_CLI' AND entidad_id_auditoria = %s
            """,
            (str(usuario_id),),
        )
        eventos = cur.fetchall()

    assert rol == "ADMIN"
    assert activo is True
    assert requiere_cambio is True
    assert verify_password(PASSWORD, password_hash)
    assert len(eventos) == 1
    assert PASSWORD not in (eventos[0][0] or "")


def test_crear_admin_rechaza_username_duplicado(db_conn):
    with pytest.raises(ValueError, match="username"):
        crear_admin(db_conn, **_datos(username="admin"))


def test_crear_admin_rechaza_email_duplicado(db_conn):
    with pytest.raises(ValueError, match="email"):
        crear_admin(db_conn, **_datos(email="admin@red.com"))


def test_crear_admin_rechaza_password_debil(db_conn):
    with pytest.raises(ValueError):
        crear_admin(db_conn, **_datos(password="debil"))


def test_existe_admin_activo(db_conn):
    assert existe_admin_activo(db_conn) is True


@pytest.mark.anyio
async def test_nuevo_admin_puede_loguear_y_debe_cambiar_password(client, db_conn):
    crear_admin(db_conn, **_datos())
    db_conn.commit()

    response = await client.post(
        "/auth/login", json={"identifier": "root", "password": PASSWORD}
    )

    assert response.status_code == 200, response.text
    assert response.json()["requiere_cambio_password_usuario"] is True
