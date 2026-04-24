import os
import psycopg
from typing import Generator

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")


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

