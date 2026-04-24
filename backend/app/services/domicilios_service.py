from datetime import datetime
from typing import Dict, Any, List

import psycopg

from app.repositories import clientes_repo, domicilios_repo


class DomicilioService:

    @staticmethod
    def _validar_cliente_existe(conn: psycopg.Connection, cliente_id: int) -> None:
        cliente = clientes_repo.get_cliente_by_id(conn, cliente_id)
        if not cliente:
            raise ValueError("CLIENTE_NOT_FOUND")

    @staticmethod
    def _validar_fechas(data: Dict[str, Any]) -> None:
        fecha_desde = data.get("fecha_desde_dom")
        fecha_hasta = data.get("fecha_hasta_dom")

        if fecha_desde and fecha_hasta and fecha_hasta < fecha_desde:
            raise ValueError("DOMICILIO_DATE_RANGE_INVALID")

    @staticmethod
    def crear_nuevo_domicilio(
        conn: psycopg.Connection,
        cliente_id: int,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        DomicilioService._validar_cliente_existe(conn, cliente_id)
        DomicilioService._validar_fechas(data)

        fecha_desde = data.get("fecha_desde_dom")
        if fecha_desde is None:
            fecha_desde = datetime.now().astimezone()

        domicilios_repo.close_domicilios_vigentes(
            conn,
            cliente_id=cliente_id,
            fecha_hasta_dom=fecha_desde
        )

        data_repo = {
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

        return domicilios_repo.create_domicilio(conn, cliente_id, data_repo)

    @staticmethod
    def obtener_domicilio_vigente(
        conn: psycopg.Connection,
        cliente_id: int
    ) -> Dict[str, Any]:
        DomicilioService._validar_cliente_existe(conn, cliente_id)

        domicilio = domicilios_repo.get_domicilio_vigente_by_cliente(conn, cliente_id)
        if not domicilio:
            raise ValueError("DOMICILIO_VIGENTE_NOT_FOUND")

        return domicilio

    @staticmethod
    def listar_historial(
        conn: psycopg.Connection,
        cliente_id: int
    ) -> List[Dict[str, Any]]:
        DomicilioService._validar_cliente_existe(conn, cliente_id)
        return domicilios_repo.list_domicilios_by_cliente(conn, cliente_id)