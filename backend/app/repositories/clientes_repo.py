from typing import Optional, Dict, Any, List
import psycopg


def list_clientes(
    conn: psycopg.Connection,
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    base_query = """
        SELECT
            cliente_id,
            nombre_cliente,
            apellido_cliente,
            dni_cliente,
            telefono_cliente,
            email_cliente,
            fecha_alta_cliente,
            estado_cliente_id,
            observacion_cliente
        FROM clientes
    """

    params: List[Any] = []
    where_clauses: List[str] = []

    if search:
        tokens = [token.strip().lower() for token in search.split() if token.strip()]

        for token in tokens:
            where_clauses.append("""
                (
                    LOWER(nombre_cliente) LIKE %s OR
                    LOWER(apellido_cliente) LIKE %s OR
                    LOWER(COALESCE(email_cliente, '')) LIKE %s OR
                    COALESCE(dni_cliente, '') LIKE %s
                )
            """)
            params.extend([f"%{token}%"] * 4)

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    final_query = f"""
        {base_query}
        {where_sql}
        ORDER BY cliente_id
        LIMIT %s OFFSET %s
    """

    params.extend([limit, offset])

    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(final_query, params)
        return cur.fetchall()


def get_cliente_by_id(
    conn: psycopg.Connection,
    cliente_id: int
) -> Optional[Dict[str, Any]]:
    query = """
        SELECT
            cliente_id,
            nombre_cliente,
            apellido_cliente,
            dni_cliente,
            telefono_cliente,
            email_cliente,
            fecha_alta_cliente,
            estado_cliente_id,
            observacion_cliente
        FROM clientes
        WHERE cliente_id = %s
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(query, (cliente_id,))
        return cur.fetchone()


def create_cliente(
    conn: psycopg.Connection,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    query = """
        INSERT INTO clientes (
            nombre_cliente,
            apellido_cliente,
            dni_cliente,
            telefono_cliente,
            email_cliente,
            fecha_alta_cliente,
            estado_cliente_id,
            observacion_cliente
        )
        VALUES (
            %(nombre_cliente)s,
            %(apellido_cliente)s,
            %(dni_cliente)s,
            %(telefono_cliente)s,
            %(email_cliente)s,
            NOW(),
            %(estado_cliente_id)s,
            %(observacion_cliente)s
        )
        RETURNING
            cliente_id,
            nombre_cliente,
            apellido_cliente,
            dni_cliente,
            telefono_cliente,
            email_cliente,
            fecha_alta_cliente,
            estado_cliente_id,
            observacion_cliente;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(query, data)
        return cur.fetchone()


def update_cliente(
    conn: psycopg.Connection,
    cliente_id: int,
    data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    query = """
        UPDATE clientes
        SET
            nombre_cliente = %(nombre_cliente)s,
            apellido_cliente = %(apellido_cliente)s,
            dni_cliente = %(dni_cliente)s,
            telefono_cliente = %(telefono_cliente)s,
            email_cliente = %(email_cliente)s,
            observacion_cliente = %(observacion_cliente)s
        WHERE cliente_id = %(cliente_id)s
        RETURNING
            cliente_id,
            nombre_cliente,
            apellido_cliente,
            dni_cliente,
            telefono_cliente,
            email_cliente,
            fecha_alta_cliente,
            estado_cliente_id,
            observacion_cliente;
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(query, {**data, "cliente_id": cliente_id})
        return cur.fetchone()