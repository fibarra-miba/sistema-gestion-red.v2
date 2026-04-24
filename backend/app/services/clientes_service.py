import psycopg
from psycopg.errors import UniqueViolation
from typing import Dict, Any, Optional

from app.repositories import (
    clientes_repo,
    domicilios_repo,
    cuentas_repo,  # se mantiene import, aunque no use create_cuenta
)


class ClienteService:

    @staticmethod
    def listar(
        conn: psycopg.Connection,
        limit: int,
        offset: int,
        search: Optional[str] = None
    ):
        return clientes_repo.list_clientes(conn, limit, offset, search)

    @staticmethod
    def obtener(conn: psycopg.Connection, cliente_id: int):
        cliente = clientes_repo.get_cliente_by_id(conn, cliente_id)
        if not cliente:
            raise ValueError("CLIENTE_NOT_FOUND")
        return cliente

    @staticmethod
    def crear_cliente(
        conn: psycopg.Connection,
        data: Dict[str, Any]
    ):
        if not data.get("dni"):
            raise ValueError("DNI_REQUIRED")

        data_repo = {
            "nombre_cliente": data.get("nombre"),
            "apellido_cliente": data.get("apellido"),
            "dni_cliente": data.get("dni"),
            "telefono_cliente": data.get("telefono"),
            "email_cliente": data.get("email"),
            "estado_cliente_id": data.get("estado_cliente_id"),
            "observacion_cliente": data.get("observaciones"),
        }

        try:
            return clientes_repo.create_cliente(conn, data_repo)
        except UniqueViolation:
            raise

    @staticmethod
    def actualizar_cliente(
        conn: psycopg.Connection,
        cliente_id: int,
        data: Dict[str, Any]
    ):
        cliente = clientes_repo.get_cliente_by_id(conn, cliente_id)
        if not cliente:
            raise ValueError("CLIENTE_NOT_FOUND")

        data_repo = {
            "nombre_cliente": data.get("nombre"),
            "apellido_cliente": data.get("apellido"),
            "dni_cliente": data.get("dni"),
            "telefono_cliente": data.get("telefono"),
            "email_cliente": data.get("email"),
            "observacion_cliente": data.get("observaciones"),
        }

        try:
            updated = clientes_repo.update_cliente(conn, cliente_id, data_repo)
            return updated
        except UniqueViolation:
            raise

    @staticmethod
    def _create_cuenta_minimal(conn: psycopg.Connection, cliente_id: int, estado_cuenta_id: int) -> None:
        """
        Inserta cuenta mínima.
        Motivo: el repo cuentas_repo no expone create_cuenta (según error de tests),
        y no queremos refactor grande ahora.
        """
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO cuenta (cliente_id, saldo_cuenta, estado_cuenta_id)
                VALUES (%s, 0, %s)
                RETURNING cuenta_id
                """,
                (cliente_id, estado_cuenta_id),
            )
            _ = cur.fetchone()

    @staticmethod
    def onboarding(conn, payload):
        """
        Crea Cliente + Domicilio vigente + Cuenta, de forma transaccional (la transacción la maneja el get_db / test fixture).
        """
        cliente_payload = payload["cliente"]

        cliente_data = {
            "nombre_cliente": cliente_payload.get("nombre"),
            "apellido_cliente": cliente_payload.get("apellido"),
            "dni_cliente": cliente_payload.get("dni"),
            "telefono_cliente": cliente_payload.get("telefono"),
            "email_cliente": cliente_payload.get("email"),
            "estado_cliente_id": cliente_payload.get("estado_cliente_id"),
            "observacion_cliente": cliente_payload.get("observacion"),
        }

        cliente = clientes_repo.create_cliente(conn, cliente_data)
        cliente_id = cliente["cliente_id"]

        domicilio_payload = payload["domicilio"]

        if domicilio_payload.get("estado_domicilio_id") is None and domicilio_payload.get("estado_domicilio") is not None:
            domicilio_payload["estado_domicilio_id"] = domicilio_payload["estado_domicilio"]

        if domicilio_payload.get("estado_domicilio_id") is None:
            domicilio_payload["estado_domicilio_id"] = 1

        domicilios_repo.close_domicilios_vigentes(
            conn,
            cliente_id=cliente_id,
            fecha_hasta_dom=domicilio_payload.get("fecha_desde_dom")
        )

        domicilios_repo.create_domicilio(conn, cliente_id, domicilio_payload)

        estado_cuenta_id = payload["cuenta"]["estado_cuenta_id"]
        self_check = estado_cuenta_id
        ClienteService._create_cuenta_minimal(conn, cliente_id, self_check)

        return cliente