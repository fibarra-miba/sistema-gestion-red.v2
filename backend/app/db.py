import os
import psycopg
from typing import Generator

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")


# Usar SIEMPRE como Depends(get_db, scope="function"): con el scope por defecto el
# commit corre después de enviar la respuesta, y el cliente puede leer antes de que
# la escritura exista (o recibir 200 de algo que terminó en rollback).
# test/test_db_scope.py lo verifica.
def get_db() -> Generator[psycopg.Connection, None, None]:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
        
    conn = psycopg.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

