import os
import sys
import pathlib

import psycopg
import pytest
from httpx import AsyncClient

# =========================
# Fix PYTHONPATH
# =========================
BASE_DIR = pathlib.Path(__file__).resolve().parents[1]  # /app
sys.path.insert(0, str(BASE_DIR))

from app.main import app  # noqa: E402
from app.core.security import hash_password  # noqa: E402


# =========================
# SQL paths
# =========================
def _resolve_sql_dir(base_dir: pathlib.Path) -> pathlib.Path:
    """
    Prioridad:
    1) backend/test/sql            (canónico para la suite)
    2) <repo>/infra/sql/core       (fallback para runs locales fuera de docker)
    """
    candidate_1 = base_dir / "test" / "sql"
    if candidate_1.exists():
        return candidate_1

    candidate_2 = base_dir.parent / "infra" / "sql" / "core"
    if candidate_2.exists():
        return candidate_2

    raise FileNotFoundError(
        "No se encontró el directorio de SQL. "
        "Creá backend/test/sql y copiá ahí 001_schema.sql, 002_constraints.sql, "
        "003_indexes.sql, 005_catalogos_base.sql, 006_post_seed.sql y 010_seed.sql."
    )


SQL_DIR = _resolve_sql_dir(BASE_DIR)

SCHEMA_FILES = [
    SQL_DIR / "001_schema.sql",
    SQL_DIR / "002_constraints.sql",
    SQL_DIR / "003_indexes.sql",
    # Catálogos/estados base: el seed (010) los referencia por descripción,
    # así que deben sembrarse antes.
    SQL_DIR / "005_catalogos_base.sql",
    # Constraints que dependen de catálogos ya sembrados (índice único parcial
    # de garantía ACTIVA). Debe correr después de 005 para alinear la DB de test
    # con la real (bootstrap docker corre 006 antes de 010).
    SQL_DIR / "006_post_seed.sql",
    SQL_DIR / "010_seed.sql",
]


# =========================
# Helpers SQL
# =========================
def _read_sql(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def _split_sql_statements(sql: str) -> list[str]:
    """
    Divide un script SQL en statements respetando:
    - strings con comillas simples ('...')
    - dollar-quoting ($$...$$ y $tag$...$tag$), p. ej. bloques DO $$ ... $$
    - comentarios de línea (-- ...)

    Necesario porque 006_post_seed.sql usa un bloque DO con ';' internos que un
    split naive por ';' partiría en fragmentos inválidos.
    """
    statements: list[str] = []
    buf: list[str] = []
    i = 0
    n = len(sql)
    in_single = False
    dollar_tag: str | None = None

    while i < n:
        ch = sql[i]

        if dollar_tag is not None:
            if sql.startswith(dollar_tag, i):
                buf.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = None
                continue
            buf.append(ch)
            i += 1
            continue

        if in_single:
            buf.append(ch)
            i += 1
            if ch == "'":
                in_single = False
            continue

        # Comentario de línea: descartar hasta el fin de línea.
        if ch == "-" and i + 1 < n and sql[i + 1] == "-":
            while i < n and sql[i] != "\n":
                i += 1
            continue

        if ch == "'":
            in_single = True
            buf.append(ch)
            i += 1
            continue

        if ch == "$":
            j = sql.find("$", i + 1)
            # Apertura válida de dollar-quote: $$ (tag vacío) o $identificador$.
            if j != -1 and (j == i + 1 or sql[i + 1 : j].isidentifier()):
                tag = sql[i : j + 1]
                dollar_tag = tag
                buf.append(tag)
                i = j + 1
                continue

        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
            i += 1
            continue

        buf.append(ch)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


def _exec_sql(conn: psycopg.Connection, sql: str) -> None:
    with conn.cursor() as cur:
        for stmt in _split_sql_statements(sql):
            cur.execute(stmt)


def _recreate_public_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("DROP SCHEMA IF EXISTS public CASCADE;")
        cur.execute("CREATE SCHEMA public;")
        cur.execute("GRANT ALL ON SCHEMA public TO public;")


def _table_exists(conn: psycopg.Connection, table_name: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT EXISTS (
                SELECT 1
                  FROM information_schema.tables
                 WHERE table_schema = 'public'
                   AND table_name = %s
            )
            """,
            (table_name,),
        )
        row = cur.fetchone()
        return bool(row[0]) if row else False


def _column_exists(conn: psycopg.Connection, table_name: str, column_name: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT EXISTS (
                SELECT 1
                  FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = %s
                   AND column_name = %s
            )
            """,
            (table_name, column_name),
        )
        row = cur.fetchone()
        return bool(row[0]) if row else False


def _auth_schema_ready(conn: psycopg.Connection) -> bool:
    """
    Detecta si el schema de tests incluye la capa auth nueva.
    Si no existe, NO intentamos sembrar usuarios ni usar fixtures autenticadas.
    """
    required_tables = {"roles", "usuarios"}
    return all(_table_exists(conn, t) for t in required_tables)


def _ensure_test_users(conn: psycopg.Connection) -> None:
    """
    Asegura usuarios de prueba por rol para la suite auth/ACL.
    Si el schema cargado aún es legacy y no tiene tablas auth, no hace nada.
    """
    if not _auth_schema_ready(conn):
        return

    users = [
        {
            "codigo_rol": "ADMIN",
            "username": "admin",
            "email": "admin@red.com",
            "password": "admin",
            "nombre": "Admin",
            "apellido": "Sistema",
            "activo": True,
            "requiere_cambio": False,
        },
        {
            "codigo_rol": "OPERADOR",
            "username": "operador",
            "email": "operador@red.com",
            "password": "Operador1",
            "nombre": "Usuario",
            "apellido": "Operador",
            "activo": True,
            "requiere_cambio": False,
        },
        {
            "codigo_rol": "TECNICO",
            "username": "tecnico",
            "email": "tecnico@red.com",
            "password": "Tecnico1",
            "nombre": "Usuario",
            "apellido": "Tecnico",
            "activo": True,
            "requiere_cambio": False,
        },
        {
            "codigo_rol": "COBRANZAS",
            "username": "cobranzas",
            "email": "cobranzas@red.com",
            "password": "Cobranzas1",
            "nombre": "Usuario",
            "apellido": "Cobranzas",
            "activo": True,
            "requiere_cambio": False,
        },
    ]

    has_updated_at = _column_exists(conn, "usuarios", "updated_at")

    with conn.cursor() as cur:
        for user in users:
            cur.execute(
                """
                SELECT rol_id
                  FROM roles
                 WHERE codigo_rol = %s
                 LIMIT 1
                """,
                (user["codigo_rol"],),
            )
            row = cur.fetchone()
            if row is None:
                raise RuntimeError(
                    f"No existe rol seed para codigo_rol={user['codigo_rol']}"
                )
            rol_id = row[0]

            cur.execute(
                """
                SELECT usuario_id
                  FROM usuarios
                 WHERE username_usuario = %s
                 LIMIT 1
                """,
                (user["username"],),
            )
            existing = cur.fetchone()

            password_hash = hash_password(user["password"])

            if existing is None:
                cur.execute(
                    """
                    INSERT INTO usuarios (
                        rol_id,
                        username_usuario,
                        email_usuario,
                        password_hash_usuario,
                        nombre_usuario,
                        apellido_usuario,
                        activo_usuario,
                        requiere_cambio_password_usuario
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        rol_id,
                        user["username"],
                        user["email"],
                        password_hash,
                        user["nombre"],
                        user["apellido"],
                        user["activo"],
                        user["requiere_cambio"],
                    ),
                )
            else:
                if has_updated_at:
                    cur.execute(
                        """
                        UPDATE usuarios
                           SET rol_id = %s,
                               email_usuario = %s,
                               password_hash_usuario = %s,
                               nombre_usuario = %s,
                               apellido_usuario = %s,
                               activo_usuario = %s,
                               requiere_cambio_password_usuario = %s,
                               updated_at = NOW()
                         WHERE username_usuario = %s
                        """,
                        (
                            rol_id,
                            user["email"],
                            password_hash,
                            user["nombre"],
                            user["apellido"],
                            user["activo"],
                            user["requiere_cambio"],
                            user["username"],
                        ),
                    )
                else:
                    cur.execute(
                        """
                        UPDATE usuarios
                           SET rol_id = %s,
                               email_usuario = %s,
                               password_hash_usuario = %s,
                               nombre_usuario = %s,
                               apellido_usuario = %s,
                               activo_usuario = %s,
                               requiere_cambio_password_usuario = %s
                         WHERE username_usuario = %s
                        """,
                        (
                            rol_id,
                            user["email"],
                            password_hash,
                            user["nombre"],
                            user["apellido"],
                            user["activo"],
                            user["requiere_cambio"],
                            user["username"],
                        ),
                    )


# =========================
# Fixtures DB
# =========================
def _dbname_from_url(url: str) -> str:
    # postgresql://user:pass@host:port/dbname?params -> dbname
    path = url.split("/")[-1]
    return path.split("?")[0]


@pytest.fixture(scope="session")
def test_db_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL not set")

    # SALVAGUARDA: la suite hace DROP SCHEMA public CASCADE sobre esta DB.
    # Si se apunta por error a la base real (p. ej. ./red test usando el
    # DATABASE_URL de producción), abortamos ANTES de destruir datos.
    # Convención: la base de test debe llamarse con "test" en el nombre.
    # Para casos excepcionales, ALLOW_DESTRUCTIVE_DB=1 saltea el chequeo.
    dbname = _dbname_from_url(url)
    if "test" not in dbname.lower() and os.getenv("ALLOW_DESTRUCTIVE_DB") != "1":
        raise RuntimeError(
            f"Negándome a correr tests contra '{dbname}': la suite recrea el "
            f"schema (destructivo) y el nombre no parece de test. Apuntá "
            f"DATABASE_URL a una base con 'test' en el nombre (ej. mi_base_test) "
            f"o seteá ALLOW_DESTRUCTIVE_DB=1 si realmente es lo que querés."
        )
    return url


@pytest.fixture(scope="function")
def db_conn(test_db_url: str):
    conn = psycopg.connect(test_db_url)
    try:
        _recreate_public_schema(conn)

        for f in SCHEMA_FILES:
            _exec_sql(conn, _read_sql(f))

        _ensure_test_users(conn)
        conn.commit()

        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# =========================
# Fixtures HTTP
# =========================
@pytest.fixture(scope="function")
async def client(db_conn):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


# =========================
# Helpers auth
# =========================
async def _login(ac: AsyncClient, identifier: str, password: str) -> AsyncClient:
    response = await ac.post(
        "/auth/login",
        json={
            "identifier": identifier,
            "password": password,
        },
    )
    assert response.status_code == 200, response.text
    return ac


@pytest.fixture(scope="function")
def auth_schema_ready(db_conn):
    return _auth_schema_ready(db_conn)


async def _maybe_login(
    ac: AsyncClient,
    auth_schema_ready: bool,
    identifier: str,
    password: str,
) -> AsyncClient:
    if not auth_schema_ready:
        return ac
    return await _login(ac, identifier, password)


# =========================
# Clients autenticados por rol
# =========================
@pytest.fixture(scope="function")
async def admin_client(client: AsyncClient) -> AsyncClient:
    return await _login(client, "admin", "admin")


@pytest.fixture(scope="function")
async def operador_client(client: AsyncClient) -> AsyncClient:
    return await _login(client, "operador", "Operador1")


@pytest.fixture(scope="function")
async def tecnico_client(client: AsyncClient) -> AsyncClient:
    return await _login(client, "tecnico", "Tecnico1")


@pytest.fixture(scope="function")
async def cobranzas_client(client: AsyncClient) -> AsyncClient:
    return await _login(client, "cobranzas", "Cobranzas1")
