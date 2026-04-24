from datetime import datetime, timezone, timedelta
import psycopg
import pytest

from app.repositories import domicilios_repo


def _insert_cliente(conn: psycopg.Connection, dni: str) -> int:
    """
    Inserta un cliente mínimo válido y devuelve cliente_id.
    Asume que el seed creó estado_cliente_id=1.
    """
    q = """
        INSERT INTO clientes (
            nombre_cliente, apellido_cliente, dni_cliente,
            telefono_cliente, email_cliente, fecha_alta_cliente,
            estado_cliente_id, observacion_cliente
        )
        VALUES (%s,%s,%s,%s,%s, NOW(), %s, %s)
        RETURNING cliente_id;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(
            q,
            (
                "Test",
                "Cliente",
                dni,
                "3870000000",
                "test@red.local",
                1,  # estado_cliente_id
                "seed test"
            ),
        )
        return cur.fetchone()["cliente_id"]


def _get_domicilio(conn: psycopg.Connection, domicilio_id: int) -> dict:
    q = "SELECT * FROM domicilios WHERE domicilio_id = %s;"
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(q, (domicilio_id,))
        row = cur.fetchone()
        assert row is not None
        return row


def _insert_domicilio_vigente_minimo(conn: psycopg.Connection, cliente_id: int, fecha_desde: datetime) -> int:
    """
    Inserta un domicilio vigente mínimo para pruebas (fecha_hasta_dom NULL).
    """
    q = """
        INSERT INTO domicilios (
            cliente_id, calle, numero, fecha_desde_dom, fecha_hasta_dom, estado_domicilio_id
        )
        VALUES (%s, %s, %s, %s, NULL, %s)
        RETURNING domicilio_id;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(q, (cliente_id, "Calle Test", 123, fecha_desde, 1))
        return cur.fetchone()["domicilio_id"]


def _count_vigentes(conn: psycopg.Connection, cliente_id: int) -> int:
    q = """
        SELECT COUNT(*)
        FROM domicilios
        WHERE cliente_id = %s AND fecha_hasta_dom IS NULL;
    """
    with conn.cursor() as cur:
        cur.execute(q, (cliente_id,))
        return cur.fetchone()[0]


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _assert_close_to_now(value: datetime, reference: datetime, tolerance_ms: int = 50):
    """
    Valida que un timestamp generado en DB (NOW()) esté "cerca" del timestamp de Python,
    tolerando desfasajes de micro/milisegundos entre clocks/procesos.
    """
    assert value is not None
    delta_s = abs((value - reference).total_seconds())
    assert delta_s <= tolerance_ms / 1000



def _assert_dt_equal(a: datetime, b: datetime):
    # Postgres puede normalizar precisión; comparamos exacto si coincide,
    # o toleramos micro-diferencias mínimas si aparecieran.
    assert a is not None and b is not None
    assert abs((a - b).total_seconds()) < 0.001


# -------------------------------------------------
# Tests
# -------------------------------------------------

def test_create_domicilio_setea_fecha_desde_now_si_falta(db_conn):
    cliente_id = _insert_cliente(db_conn, "40111111")

    ref = _now_utc()
    domicilio = domicilios_repo.create_domicilio(
        db_conn,
        cliente_id,
        {
            "calle": "Mitre",
            "numero": 999,
            "piso": None,
            "depto": None,
            "complejo": None,
            "referencias": None,
            # fecha_desde_dom ausente => COALESCE(..., NOW())
            "estado_domicilio_id": 1,
        },
    )

    row = _get_domicilio(db_conn, domicilio["domicilio_id"])
    assert row["fecha_hasta_dom"] is None
    _assert_close_to_now(row["fecha_desde_dom"], ref)


def test_close_vigente_usa_now_si_fecha_hasta_none(db_conn):
    cliente_id = _insert_cliente(db_conn, "40111112")
    fecha_desde = _now_utc() - timedelta(days=10)

    domicilio_id = _insert_domicilio_vigente_minimo(db_conn, cliente_id, fecha_desde)
    assert _count_vigentes(db_conn, cliente_id) == 1

    ref = _now_utc()
    affected = domicilios_repo.close_domicilios_vigentes(db_conn, cliente_id, None)

    assert affected == 1
    assert _count_vigentes(db_conn, cliente_id) == 0

    row = _get_domicilio(db_conn, domicilio_id)
    _assert_close_to_now(row["fecha_hasta_dom"], ref)



def test_close_vigente_respeta_fecha_custom(db_conn):
    cliente_id = _insert_cliente(db_conn, "40111113")
    fecha_desde = _now_utc() - timedelta(days=20)

    domicilio_id = _insert_domicilio_vigente_minimo(db_conn, cliente_id, fecha_desde)

    custom = datetime(2026, 2, 1, 12, 0, 0, tzinfo=timezone.utc)
    affected = domicilios_repo.close_domicilios_vigentes(db_conn, cliente_id, custom)

    assert affected == 1
    row = _get_domicilio(db_conn, domicilio_id)
    _assert_dt_equal(row["fecha_hasta_dom"], custom)


def test_flujo_cambio_domicilio_cierra_anterior_y_crea_nuevo_vigente(db_conn):
    cliente_id = _insert_cliente(db_conn, "40111114")

    # Domicilio vigente inicial
    dom1_id = _insert_domicilio_vigente_minimo(db_conn, cliente_id, _now_utc() - timedelta(days=30))
    assert _count_vigentes(db_conn, cliente_id) == 1

    # Evento de cambio ocurrió en fecha pasada (fecha_desde del nuevo)
    evento = datetime(2026, 1, 15, 9, 30, 0, tzinfo=timezone.utc)

    # Simulamos la lógica de service: cerrar vigentes con fecha del evento y crear nuevo domicilio
    affected = domicilios_repo.close_domicilios_vigentes(db_conn, cliente_id, evento)
    assert affected == 1

    dom2 = domicilios_repo.create_domicilio(
        db_conn,
        cliente_id,
        {
            "calle": "Nueva",
            "numero": 321,
            "piso": 2,
            "depto": "B",
            "complejo": "Torre Z",
            "referencias": "Portón negro",
            "fecha_desde_dom": evento,
            "fecha_hasta_dom": None,
            "estado_domicilio_id": 1,  # VIGENTE
        },
    )

    # Validaciones
    row1 = _get_domicilio(db_conn, dom1_id)
    row2 = _get_domicilio(db_conn, dom2["domicilio_id"])

    _assert_dt_equal(row1["fecha_hasta_dom"], evento)
    assert row2["fecha_hasta_dom"] is None
    _assert_dt_equal(row2["fecha_desde_dom"], evento)
    assert _count_vigentes(db_conn, cliente_id) == 1

