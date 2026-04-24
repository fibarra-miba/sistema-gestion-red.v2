# app/services/contratos_service.py

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

import psycopg

from app.repositories.contratos_repo import ContractRepository
from app.repositories.instalaciones_repo import InstalacionesRepository
from app.repositories.planes_repo import PlanesRepository
from app.repositories.clientes_repo import get_cliente_by_id
from app.repositories.precios_repo import PreciosRepo
from app.repositories.domicilios_repo import (
    get_domicilio_by_id,
    get_domicilio_vigente_by_cliente,
)


class ContractService:
    # Estados (IDs del catálogo)
    BORRADOR = 1
    PENDIENTE_INSTALACION = 2
    ACTIVO = 3
    SUSPENDIDO = 4
    BAJA = 5
    CANCELADO = 6

    PLAN_ACTIVO = 1

    def __init__(
        self,
        repo: ContractRepository,
        instalaciones_repo: InstalacionesRepository | None = None,
    ):
        self.repo = repo
        self.instalaciones_repo = instalaciones_repo
        self.precios_repo = PreciosRepo(repo.conn)

    # ==========================================================
    # VALIDACIONES AUXILIARES
    # ==========================================================

    def _validar_cliente_existente(self, cliente_id: int) -> dict:
        cliente = get_cliente_by_id(self.repo.conn, cliente_id)
        if not cliente:
            raise ValueError("Cliente no encontrado.")
        return cliente

    def _validar_domicilio(self, cliente_id: int, domicilio_id: int) -> dict:
        domicilio = get_domicilio_by_id(self.repo.conn, domicilio_id)
        if not domicilio:
            raise ValueError("Domicilio no encontrado.")

        if int(domicilio["cliente_id"]) != int(cliente_id):
            raise ValueError("El domicilio no pertenece al cliente informado.")

        domicilio_vigente = get_domicilio_vigente_by_cliente(self.repo.conn, cliente_id)
        if not domicilio_vigente or int(domicilio_vigente["domicilio_id"]) != int(domicilio_id):
            raise ValueError("El domicilio informado no es el domicilio vigente del cliente.")

        return domicilio

    def _validar_plan_activo(self, plan_id: int) -> dict:
        with self.repo.conn.cursor() as cur:
            cur.execute(
                """
                SELECT plan_id, estado_plan_id
                FROM planes
                WHERE plan_id = %s
                """,
                (plan_id,),
            )
            row = cur.fetchone()

        if not row:
            raise ValueError("Plan no encontrado.")

        estado_plan_id = int(row[1])

        if estado_plan_id != self.PLAN_ACTIVO:
            raise ValueError("El plan informado no está activo.")

        return {
            "plan_id": int(row[0]),
            "estado_plan_id": estado_plan_id,
        }
        
    def _obtener_precio_vigente_plan(self, plan_id: int, fecha_referencia: datetime) -> dict:
        precio = self.precios_repo.get_precio_base_vigente(plan_id, fecha_referencia.date())
        if not precio:
            raise ValueError("El plan no tiene precio vigente para la fecha indicada.")
        return precio

    # ==========================================================
    # CREATE
    # ==========================================================

    def create_contract(self, cliente_id: int, domicilio_id: int, plan_id: int) -> dict:
        self._validar_cliente_existente(cliente_id)
        self._validar_domicilio(cliente_id, domicilio_id)
        self._validar_plan_activo(plan_id)

        now = datetime.now(timezone.utc)
        precio_vigente = self._obtener_precio_vigente_plan(plan_id, now)
        return self.repo.create(
            cliente_id=cliente_id,
            domicilio_id=domicilio_id,
            plan_id=plan_id,
            precio_base_contrato=precio_vigente["precio"],
            fecha_inicio=now,
            estado_contrato_id=self.BORRADOR,
        )

    # ==========================================================
    # READ
    # ==========================================================

    def get_contract(self, contrato_id: int) -> dict:
        contrato = self.repo.get_by_id(contrato_id)
        if not contrato:
            raise ValueError("Contrato no encontrado.")
        return contrato

    def get_contract_commercial(self, contrato_id: int) -> dict:
        contrato = self.repo.get_commercial_by_id(contrato_id)
        if not contrato:
            raise ValueError("Contrato no encontrado.")
        return contrato

    def list_by_cliente(self, cliente_id: int) -> List[dict]:
        return self.repo.get_by_cliente(cliente_id)

    def list_contracts(
        self,
        cliente_id: Optional[int] = None,
        estado_contrato_id: Optional[int] = None,
        plan_id: Optional[int] = None,
        domicilio_id: Optional[int] = None,
    ) -> List[dict]:
        return self.repo.list_commercial(
            cliente_id=cliente_id,
            estado_contrato_id=estado_contrato_id,
            plan_id=plan_id,
            domicilio_id=domicilio_id,
        )

    # ==========================================================
    # ACTIVATE / RESUME
    # ==========================================================

    def _validar_no_solapamiento_activo_mismo_domicilio(self, contrato: dict) -> None:
        if contrato.get("domicilio_id") is None:
            raise ValueError("Contrato inválido: falta domicilio_id.")

        if self.repo.exists_other_active_overlapping_by_domicilio(
            domicilio_id=int(contrato["domicilio_id"]),
            fecha_inicio=contrato["fecha_inicio_contrato"],
            fecha_fin=contrato.get("fecha_fin_contrato"),
            exclude_contrato_id=int(contrato["contrato_id"]),
        ):
            raise ValueError("Ya existe un contrato ACTIVO vigente para ese domicilio.")

    def activate(self, contrato_id: int) -> None:
        contrato = self.get_contract(contrato_id)

        if contrato["estado_contrato_id"] not in (self.BORRADOR, self.PENDIENTE_INSTALACION):
            raise ValueError("El contrato no puede activarse desde su estado actual.")

        self._validar_no_solapamiento_activo_mismo_domicilio(contrato)

        try:
            self.repo.update_estado(contrato_id, self.ACTIVO, fecha_fin=None)
        except psycopg.errors.ExclusionViolation:
            raise ValueError("Ya existe un contrato ACTIVO vigente para ese domicilio.")

    def suspend(self, contrato_id: int) -> None:
        contrato = self.get_contract(contrato_id)
        if contrato["estado_contrato_id"] != self.ACTIVO:
            raise ValueError("Solo un contrato ACTIVO puede suspenderse.")
        self.repo.update_estado(contrato_id, self.SUSPENDIDO, fecha_fin=None)

    def resume(self, contrato_id: int) -> None:
        contrato = self.get_contract(contrato_id)
        if contrato["estado_contrato_id"] != self.SUSPENDIDO:
            raise ValueError("Solo un contrato SUSPENDIDO puede reanudarse.")

        self._validar_no_solapamiento_activo_mismo_domicilio(contrato)

        try:
            self.repo.update_estado(contrato_id, self.ACTIVO, fecha_fin=None)
        except psycopg.errors.ExclusionViolation:
            raise ValueError("Ya existe un contrato ACTIVO vigente para ese domicilio.")

    # ==========================================================
    # CANCEL / TERMINATE
    # ==========================================================

    def cancel(self, contrato_id: int) -> None:
        contrato = self.get_contract(contrato_id)
        if contrato["estado_contrato_id"] in (self.BAJA, self.CANCELADO):
            raise ValueError("El contrato ya está finalizado.")
        self.repo.update_estado(contrato_id, self.CANCELADO, fecha_fin=datetime.now(timezone.utc))

    def terminate(self, contrato_id: int) -> None:
        contrato = self.get_contract(contrato_id)
        if contrato["estado_contrato_id"] not in (self.ACTIVO, self.SUSPENDIDO):
            raise ValueError("Solo contratos activos o suspendidos pueden darse de baja.")
        self.repo.update_estado(contrato_id, self.BAJA, fecha_fin=datetime.now(timezone.utc))

    # ==========================================================
    # CHANGE PLAN
    # ==========================================================

    def change_plan(self, contrato_id: int, new_plan_id: int) -> dict:
        contrato = self.get_contract(contrato_id)
        if contrato["estado_contrato_id"] not in (self.ACTIVO, self.SUSPENDIDO):
            raise ValueError("Solo contratos activos o suspendidos pueden cambiar de plan.")

        self._validar_plan_activo(new_plan_id)
        
        now = datetime.now(timezone.utc)
        precio_vigente = self._obtener_precio_vigente_plan(new_plan_id, now)

        self.repo.update_estado(
            contrato_id,
            self.BAJA,
            fecha_fin=datetime.now(timezone.utc)
        )

        nuevo = self.repo.create(
            cliente_id=int(contrato["cliente_id"]),
            domicilio_id=int(contrato["domicilio_id"]),
            plan_id=new_plan_id,
            precio_base_contrato=precio_vigente["precio"],
            fecha_inicio=datetime.now(timezone.utc),
            estado_contrato_id=self.BORRADOR,
        )
        return nuevo

    # ==========================================================
    # CONDICIÓN TÉCNICA
    # ==========================================================

    def confirmar_condicion_tecnica(
        self,
        contrato_id: int,
        apto: bool,
        fecha_programacion_pinstalacion: datetime | None = None,
        tecnico_pinstalacion: str | None = None,
        notas_pinstalacion: str | None = None,
    ) -> dict:
        if self.instalaciones_repo is None:
            raise ValueError("InstalacionesRepository no configurado en ContractService.")

        contrato = self.repo.get_by_id_for_update(contrato_id)
        if not contrato:
            raise ValueError("Contrato no encontrado.")

        if contrato["estado_contrato_id"] != self.BORRADOR:
            raise ValueError("Solo contratos en BORRADOR pueden confirmar condición técnica.")

        if apto:
            self._validar_no_solapamiento_activo_mismo_domicilio(contrato)
            try:
                self.repo.update_estado_only(contrato_id, self.ACTIVO)
            except psycopg.errors.ExclusionViolation:
                raise ValueError("Ya existe un contrato ACTIVO vigente para ese domicilio.")

            return {
                "contrato_id": contrato_id,
                "estado_contrato_id": self.ACTIVO,
                "programacion_id": None,
            }

        if fecha_programacion_pinstalacion is None:
            raise ValueError(
                "Debe informar fecha_programacion_pinstalacion cuando requiere instalación."
            )

        estado_programacion_id = self.instalaciones_repo.get_estado_programacion_id("PROGRAMADA")
        if estado_programacion_id is None:
            raise ValueError("No existe el estado de programación 'PROGRAMADA'.")

        self.repo.update_estado_only(contrato_id, self.PENDIENTE_INSTALACION)

        programacion = self.instalaciones_repo.create_programacion(
            contrato_id=int(contrato["contrato_id"]),
            domicilio_id=int(contrato["domicilio_id"]),
            fecha_programacion_pinstalacion=fecha_programacion_pinstalacion,
            estado_programacion_id=estado_programacion_id,
            tecnico_pinstalacion=tecnico_pinstalacion,
            notas_pinstalacion=notas_pinstalacion,
        )

        return {
            "contrato_id": contrato_id,
            "estado_contrato_id": self.PENDIENTE_INSTALACION,
            "programacion_id": int(programacion["programacion_id"]),
        }
