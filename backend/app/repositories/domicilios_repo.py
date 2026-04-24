# app/repositories/domicilios_repo.py

import psycopg
from typing import Dict, Any, Optional, List
from datetime import datetime


def close_domicilios_vigentes(
    conn: psycopg.Connection,
    cliente_id: int,
    fecha_hasta_dom: datetime | None = None
) -> int:
    """
    Cierra todos los domicilios vigentes (fecha_hasta_dom IS NULL) del cliente.
    Si fecha_hasta_dom viene None, usa NOW().
    """
    query = """
        UPDATE domicilios
        SET fecha_hasta_dom = COALESCE(%s, NOW())
        WHERE cliente_id = %s
          AND fecha_hasta_dom IS NULL;
    """
    with conn.cursor() as cur:
        cur.execute(query, (fecha_hasta_dom, cliente_id))
        return cur.rowcount


def create_domicilio(
    conn: psycopg.Connection,
    cliente_id: int,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    query = """
        INSERT INTO domicilios (
            cliente_id,
            complejo,
            piso,
            depto,
            calle,
            numero,
            referencias,
            fecha_desde_dom,
            fecha_hasta_dom,
            estado_domicilio_id
        )
        VALUES (
            %(cliente_id)s,
            %(complejo)s,
            %(piso)s,
            %(depto)s,
            %(calle)s,
            %(numero)s,
            %(referencias)s,
            COALESCE(%(fecha_desde_dom)s, NOW()),
            %(fecha_hasta_dom)s,
            %(estado_domicilio_id)s
        )
        RETURNING
            domicilio_id,
            cliente_id,
            complejo,
            piso,
            depto,
            calle,
            numero,
            referencias,
            fecha_desde_dom,
            fecha_hasta_dom,
            estado_domicilio_id;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(
            query,
            {
                "cliente_id": cliente_id,
                "complejo": data.get("complejo"),
                "piso": data.get("piso"),
                "depto": data.get("depto"),
                "calle": data.get("calle"),
                "numero": data.get("numero"),
                "referencias": data.get("referencias"),
                "fecha_desde_dom": data.get("fecha_desde_dom"),
                "fecha_hasta_dom": data.get("fecha_hasta_dom"),
                "estado_domicilio_id": data.get("estado_domicilio_id"),
            }
        )
        return cur.fetchone()


def get_domicilio_vigente_by_cliente(
    conn: psycopg.Connection,
    cliente_id: int
) -> Optional[Dict[str, Any]]:
    query = """
        SELECT
            domicilio_id,
            cliente_id,
            complejo,
            piso,
            depto,
            calle,
            numero,
            referencias,
            fecha_desde_dom,
            fecha_hasta_dom,
            estado_domicilio_id
        FROM domicilios
        WHERE cliente_id = %s
          AND fecha_hasta_dom IS NULL
        ORDER BY fecha_desde_dom DESC, domicilio_id DESC
        LIMIT 1;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(query, (cliente_id,))
        return cur.fetchone()


def list_domicilios_by_cliente(
    conn: psycopg.Connection,
    cliente_id: int
) -> List[Dict[str, Any]]:
    query = """
        SELECT
            domicilio_id,
            cliente_id,
            complejo,
            piso,
            depto,
            calle,
            numero,
            referencias,
            fecha_desde_dom,
            fecha_hasta_dom,
            estado_domicilio_id
        FROM domicilios
        WHERE cliente_id = %s
        ORDER BY fecha_desde_dom DESC, domicilio_id DESC;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(query, (cliente_id,))
        return cur.fetchall()


def get_domicilio_by_id(
    conn: psycopg.Connection,
    domicilio_id: int
) -> Optional[Dict[str, Any]]:
    query = """
        SELECT
            domicilio_id,
            cliente_id,
            complejo,
            piso,
            depto,
            calle,
            numero,
            referencias,
            fecha_desde_dom,
            fecha_hasta_dom,
            estado_domicilio_id
        FROM domicilios
        WHERE domicilio_id = %s
        LIMIT 1;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(query, (domicilio_id,))
        return cur.fetchone()