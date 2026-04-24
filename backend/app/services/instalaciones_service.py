# app/services/instalaciones_service.py

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import psycopg

from app.repositories.contratos_repo import ContractRepository
from app.repositories.instalaciones_repo import InstalacionesRepository


class InstalacionesService:
    BORRADOR = 1
    PENDIENTE_INSTALACION = 2
    ACTIVO = 3

    def __init__(
        self,
        contratos_repo: ContractRepository,
        instalaciones_repo: InstalacionesRepository,
    ):
        self.contratos_repo = contratos_repo
        self.instalaciones_repo = instalaciones_repo

    # ==========================================================
    # HELPERS
    # ==========================================================

    def _get_contrato(self, contrato_id: int) -> dict:
        contrato = self.contratos_repo.get_by_id(contrato_id)
        if not contrato:
            raise ValueError("Contrato no encontrado.")
        return contrato

    def _get_programacion(self, programacion_id: int) -> dict:
        programacion = self.instalaciones_repo.get_programacion_by_id(programacion_id)
        if not programacion:
            raise ValueError("Programación no encontrada.")
        return programacion

    def _get_instalacion(self, instalacion_id: int) -> dict:
        instalacion = self.instalaciones_repo.get_instalacion_by_id(instalacion_id)
        if not instalacion:
            raise ValueError("Instalación no encontrada.")
        return instalacion

    def _estado_programacion_id(self, descripcion: str) -> int:
        estado_id = self.instalaciones_repo.get_estado_programacion_id(descripcion)
        if estado_id is None:
            raise ValueError(f"No existe estado de programación '{descripcion}'.")
        return estado_id

    def _estado_instalacion_id(self, descripcion: str) -> int:
        estado_id = self.instalaciones_repo.get_estado_instalacion_id(descripcion)
        if estado_id is None:
            raise ValueError(f"No existe estado de instalación '{descripcion}'.")
        return estado_id

    def _estado_programacion_descripcion(self, estado_programacion_id: int) -> str:
        descripcion = self.instalaciones_repo.get_estado_programacion_descripcion(
            estado_programacion_id
        )
        if descripcion is None:
            raise ValueError("Estado de programación inválido.")
        return descripcion

    def _estado_instalacion_descripcion(self, estado_instalacion_id: int) -> str:
        descripcion = self.instalaciones_repo.get_estado_instalacion_descripcion(
            estado_instalacion_id
        )
        if descripcion is None:
            raise ValueError("Estado de instalación inválido.")
        return descripcion

    def _validar_programacion_en_estado(
        self, programacion: dict, *estados_validos: str
    ) -> None:
        estado_actual = self._estado_programacion_descripcion(
            int(programacion["estado_programacion_id"])
        )
        if estado_actual not in estados_validos:
            raise ValueError(
                f"La programación debe estar en estado {', '.join(estados_validos)}. "
                f"Estado actual: {estado_actual}."
            )

    def _validar_instalacion_en_estado(
        self, instalacion: dict, *estados_validos: str
    ) -> None:
        estado_actual = self._estado_instalacion_descripcion(
            int(instalacion["estado_instalacion_id"])
        )
        if estado_actual not in estados_validos:
            raise ValueError(
                f"La instalación debe estar en estado {', '.join(estados_validos)}. "
                f"Estado actual: {estado_actual}."
            )

    def _validar_no_solapamiento_activo_mismo_domicilio(self, contrato: dict) -> None:
        if self.contratos_repo.exists_other_active_overlapping_by_domicilio(
            domicilio_id=int(contrato["domicilio_id"]),
            fecha_inicio=contrato["fecha_inicio_contrato"],
            fecha_fin=contrato.get("fecha_fin_contrato"),
            exclude_contrato_id=int(contrato["contrato_id"]),
        ):
            raise ValueError("Ya existe un contrato ACTIVO vigente para ese domicilio.")

    # ==========================================================
    # CONTRATOS - CONDICION TECNICA
    # ==========================================================

    def confirmar_condicion_tecnica(
        self,
        contrato_id: int,
        apto: bool,
        fecha_programacion_pinstalacion: Optional[datetime] = None,
        tecnico_pinstalacion: Optional[str] = None,
        notas_pinstalacion: Optional[str] = None,
    ) -> dict:
        contrato = self.contratos_repo.get_by_id_for_update(contrato_id)
        if not contrato:
            raise ValueError("Contrato no encontrado.")

        if int(contrato["estado_contrato_id"]) != self.BORRADOR:
            raise ValueError(
                "Solo contratos en BORRADOR pueden confirmar condición técnica."
            )

        if apto:
            self._validar_no_solapamiento_activo_mismo_domicilio(contrato)
            try:
                self.contratos_repo.update_estado_only(contrato_id, self.ACTIVO)
            except psycopg.errors.ExclusionViolation:
                raise ValueError(
                    "Ya existe un contrato ACTIVO vigente para ese domicilio."
                )

            return {
                "contrato_id": contrato_id,
                "estado_contrato_id": self.ACTIVO,
                "programacion_id": None,
            }

        if fecha_programacion_pinstalacion is None:
            raise ValueError(
                "Debe informar fecha_programacion_pinstalacion cuando requiere instalación."
            )

        estado_programada = self._estado_programacion_id("PROGRAMADA")

        self.contratos_repo.update_estado_only(
            contrato_id, self.PENDIENTE_INSTALACION
        )

        programacion = self.instalaciones_repo.create_programacion(
            contrato_id=int(contrato["contrato_id"]),
            domicilio_id=int(contrato["domicilio_id"]),
            fecha_programacion_pinstalacion=fecha_programacion_pinstalacion,
            estado_programacion_id=estado_programada,
            tecnico_pinstalacion=tecnico_pinstalacion,
            notas_pinstalacion=notas_pinstalacion,
        )

        return {
            "contrato_id": contrato_id,
            "estado_contrato_id": self.PENDIENTE_INSTALACION,
            "programacion_id": int(programacion["programacion_id"]),
        }

    # ==========================================================
    # PROGRAMACION
    # ==========================================================

    def crear_programacion(
        self,
        contrato_id: int,
        domicilio_id: int,
        fecha_programacion_pinstalacion: datetime,
        tecnico_pinstalacion: Optional[str] = None,
        notas_pinstalacion: Optional[str] = None,
    ) -> dict:
        contrato = self._get_contrato(contrato_id)

        if int(contrato["domicilio_id"]) != int(domicilio_id):
            raise ValueError("El domicilio_id no coincide con el domicilio del contrato.")

        estado_contrato_actual = int(contrato["estado_contrato_id"])
        if estado_contrato_actual not in (
            self.BORRADOR,
            self.PENDIENTE_INSTALACION,
        ):
            raise ValueError(
                "No se puede programar una instalación para el estado actual del contrato."
            )

        if estado_contrato_actual == self.BORRADOR:
            self.contratos_repo.update_estado_only(
                contrato_id, self.PENDIENTE_INSTALACION
            )

        estado_programada = self._estado_programacion_id("PROGRAMADA")

        return self.instalaciones_repo.create_programacion(
            contrato_id=contrato_id,
            domicilio_id=domicilio_id,
            fecha_programacion_pinstalacion=fecha_programacion_pinstalacion,
            estado_programacion_id=estado_programada,
            tecnico_pinstalacion=tecnico_pinstalacion,
            notas_pinstalacion=notas_pinstalacion,
        )

    def get_programacion(self, programacion_id: int) -> dict:
        return self._get_programacion(programacion_id)

    def list_programaciones(
        self,
        contrato_id: Optional[int] = None,
        domicilio_id: Optional[int] = None,
        estado_programacion_id: Optional[int] = None,
        tecnico_pinstalacion: Optional[str] = None,
    ) -> list[dict]:
        return self.instalaciones_repo.list_programaciones(
            contrato_id=contrato_id,
            domicilio_id=domicilio_id,
            estado_programacion_id=estado_programacion_id,
            tecnico_pinstalacion=tecnico_pinstalacion,
        )

    def reprogramar(
        self,
        programacion_id: int,
        fecha_programacion_pinstalacion: datetime,
        tecnico_pinstalacion: Optional[str] = None,
        notas_pinstalacion: Optional[str] = None,
        motivo_reprogramacion: Optional[str] = None,
    ) -> dict:
        programacion = self._get_programacion(programacion_id)
        self._validar_programacion_en_estado(programacion, "PROGRAMADA")

        fecha_anterior = programacion["fecha_programacion_pinstalacion"]

        tecnico_final = (
            tecnico_pinstalacion
            if tecnico_pinstalacion is not None
            else programacion.get("tecnico_pinstalacion")
        )
        notas_final = (
            notas_pinstalacion
            if notas_pinstalacion is not None
            else programacion.get("notas_pinstalacion")
        )

        self.instalaciones_repo.update_programacion(
            programacion_id=programacion_id,
            fecha_programacion_pinstalacion=fecha_programacion_pinstalacion,
            tecnico_pinstalacion=tecnico_final,
            notas_pinstalacion=notas_final,
        )

        return self.instalaciones_repo.insert_reprogramacion(
            programacion_id=programacion_id,
            fecha_reprogramada_anterior=fecha_anterior,
            fecha_reprogramada_nueva=fecha_programacion_pinstalacion,
            tecnico_reprogramacion=tecnico_final,
            motivo_reprogramacion=motivo_reprogramacion,
            notas_reprogramacion=notas_final,
        )

    def list_reprogramaciones(self, programacion_id: int) -> list[dict]:
        self._get_programacion(programacion_id)
        return self.instalaciones_repo.list_reprogramaciones_by_programacion(
            programacion_id
        )

    def reintentar_instalacion(
        self,
        instalacion_id: int,
        fecha_programacion_pinstalacion: datetime,
        tecnico_pinstalacion: Optional[str] = None,
        notas_pinstalacion: Optional[str] = None,
    ) -> dict:
        instalacion = self._get_instalacion(instalacion_id)
        contrato = self._get_contrato(int(instalacion["contrato_id"]))

        self._validar_instalacion_en_estado(instalacion, "CANCELADA", "FALLIDA")

        if int(contrato["estado_contrato_id"]) != self.PENDIENTE_INSTALACION:
            raise ValueError(
                "Solo se puede reintentar si el contrato está PENDIENTE_INSTALACION."
            )

        estado_programada = self._estado_programacion_id("PROGRAMADA")

        return self.instalaciones_repo.create_programacion(
            contrato_id=int(instalacion["contrato_id"]),
            domicilio_id=int(instalacion["domicilio_id"]),
            fecha_programacion_pinstalacion=fecha_programacion_pinstalacion,
            estado_programacion_id=estado_programada,
            tecnico_pinstalacion=tecnico_pinstalacion,
            notas_pinstalacion=notas_pinstalacion,
        )

    def ejecutar_programacion(
        self,
        programacion_id: int,
        codigo_instalacion: Optional[str] = None,
        observacion_instalacion: Optional[str] = None,
        fecha_instalacion: Optional[datetime] = None,
    ) -> dict:
        programacion = self._get_programacion(programacion_id)
        self._validar_programacion_en_estado(programacion, "PROGRAMADA")

        existente = self.instalaciones_repo.get_instalacion_by_programacion(
            programacion_id
        )
        if existente:
            raise ValueError("Ya existe una instalación para esa programación.")

        contrato_id = int(programacion["contrato_id"])
        domicilio_id = int(programacion["domicilio_id"])

        contrato = self._get_contrato(contrato_id)
        if int(contrato["domicilio_id"]) != int(domicilio_id):
            raise ValueError("El domicilio_id no coincide con el contrato.")

        estado_pendiente = self._estado_instalacion_id("PENDIENTE")
        estado_prog_completada = self._estado_programacion_id("COMPLETADA")
        fecha_final = fecha_instalacion or datetime.now(timezone.utc)

        instalacion = self.instalaciones_repo.create_instalacion(
            programacion_id=programacion_id,
            contrato_id=contrato_id,
            domicilio_id=domicilio_id,
            codigo_instalacion=codigo_instalacion,
            fecha_instalacion=fecha_final,
            estado_instalacion_id=estado_pendiente,
            observacion_instalacion=observacion_instalacion,
        )

        self.instalaciones_repo.update_programacion_estado(
            programacion_id=programacion_id,
            estado_programacion_id=estado_prog_completada,
        )

        return instalacion

    # ==========================================================
    # INSTALACIONES
    # ==========================================================

    def crear_instalacion(
        self,
        programacion_id: int,
        contrato_id: int,
        domicilio_id: int,
        codigo_instalacion: Optional[str] = None,
        observacion_instalacion: Optional[str] = None,
        fecha_instalacion: Optional[datetime] = None,
    ) -> dict:
        programacion = self._get_programacion(programacion_id)
        self._validar_programacion_en_estado(programacion, "PROGRAMADA")

        if int(programacion["contrato_id"]) != int(contrato_id):
            raise ValueError("El contrato_id no coincide con la programación.")

        if int(programacion["domicilio_id"]) != int(domicilio_id):
            raise ValueError("El domicilio_id no coincide con la programación.")

        contrato = self._get_contrato(contrato_id)
        if int(contrato["domicilio_id"]) != int(domicilio_id):
            raise ValueError("El domicilio_id no coincide con el contrato.")

        return self.ejecutar_programacion(
            programacion_id=programacion_id,
            codigo_instalacion=codigo_instalacion,
            observacion_instalacion=observacion_instalacion,
            fecha_instalacion=fecha_instalacion,
        )

    def get_instalacion(self, instalacion_id: int) -> dict:
        return self._get_instalacion(instalacion_id)

    def list_instalaciones(
        self,
        contrato_id: Optional[int] = None,
        domicilio_id: Optional[int] = None,
        estado_instalacion_id: Optional[int] = None,
        programacion_id: Optional[int] = None,
    ) -> list[dict]:
        return self.instalaciones_repo.list_instalaciones(
            contrato_id=contrato_id,
            domicilio_id=domicilio_id,
            estado_instalacion_id=estado_instalacion_id,
            programacion_id=programacion_id,
        )

    def completar_instalacion(self, instalacion_id: int) -> dict:
        instalacion = self._get_instalacion(instalacion_id)
        self._validar_instalacion_en_estado(instalacion, "PENDIENTE")

        contrato = self._get_contrato(int(instalacion["contrato_id"]))
        self._validar_no_solapamiento_activo_mismo_domicilio(contrato)

        estado_completada = self._estado_instalacion_id("COMPLETADA")
        now = datetime.now(timezone.utc)

        self.instalaciones_repo.update_instalacion_estado(
            instalacion_id=instalacion_id,
            estado_instalacion_id=estado_completada,
            fecha_instalacion=now,
        )

        try:
            self.contratos_repo.update_estado_only(
                int(instalacion["contrato_id"]), self.ACTIVO
            )
        except psycopg.errors.ExclusionViolation:
            raise ValueError("Ya existe un contrato ACTIVO vigente para ese domicilio.")

        return {
            "instalacion_id": instalacion_id,
            "estado_instalacion_id": estado_completada,
            "contrato_id": int(instalacion["contrato_id"]),
            "estado_contrato_id": self.ACTIVO,
        }

    def cancelar_instalacion(self, instalacion_id: int) -> dict:
        instalacion = self._get_instalacion(instalacion_id)
        self._validar_instalacion_en_estado(instalacion, "PENDIENTE")

        estado_cancelada = self._estado_instalacion_id("CANCELADA")
        estado_prog_cancelada = self._estado_programacion_id("CANCELADA")

        self.instalaciones_repo.update_instalacion_estado(
            instalacion_id=instalacion_id,
            estado_instalacion_id=estado_cancelada,
            fecha_instalacion=None,
        )
        self.instalaciones_repo.update_programacion_estado(
            programacion_id=int(instalacion["programacion_id"]),
            estado_programacion_id=estado_prog_cancelada,
        )

        return {
            "instalacion_id": instalacion_id,
            "estado_instalacion_id": estado_cancelada,
            "contrato_id": int(instalacion["contrato_id"]),
            "estado_contrato_id": None,
        }

    def fallar_instalacion(self, instalacion_id: int) -> dict:
        instalacion = self._get_instalacion(instalacion_id)
        self._validar_instalacion_en_estado(instalacion, "PENDIENTE")

        estado_fallida = self._estado_instalacion_id("FALLIDA")
        estado_prog_fallida = self._estado_programacion_id("FALLIDA")

        self.instalaciones_repo.update_instalacion_estado(
            instalacion_id=instalacion_id,
            estado_instalacion_id=estado_fallida,
            fecha_instalacion=None,
        )
        self.instalaciones_repo.update_programacion_estado(
            programacion_id=int(instalacion["programacion_id"]),
            estado_programacion_id=estado_prog_fallida,
        )

        return {
            "instalacion_id": instalacion_id,
            "estado_instalacion_id": estado_fallida,
            "contrato_id": int(instalacion["contrato_id"]),
            "estado_contrato_id": None,
        }

    def dar_baja_instalacion(self, instalacion_id: int) -> dict:
        instalacion = self._get_instalacion(instalacion_id)
        self._validar_instalacion_en_estado(instalacion, "COMPLETADA")

        estado_cancelada = self._estado_instalacion_id("CANCELADA")
        contrato_id = int(instalacion["contrato_id"])

        self.instalaciones_repo.update_instalacion_estado(
            instalacion_id=instalacion_id,
            estado_instalacion_id=estado_cancelada,
            fecha_instalacion=None,
        )

        self.contratos_repo.update_estado_only(
            contrato_id, self.PENDIENTE_INSTALACION
        )

        return {
            "instalacion_id": instalacion_id,
            "estado_instalacion_id": estado_cancelada,
            "contrato_id": contrato_id,
            "estado_contrato_id": self.PENDIENTE_INSTALACION,
        }

    # ==========================================================
    # DETALLE INSTALACION
    # ==========================================================

    def crear_detalle_instalacion(
        self,
        instalacion_id: int,
        producto_id: int,
        descripcion_dinstalacion: Optional[str],
        cantidad_dinstalacion: float,
        unidad_dinstalacion: str,
        observacion_dinstalacion: Optional[str] = None,
    ) -> dict:
        self._get_instalacion(instalacion_id)

        return self.instalaciones_repo.create_detalle_instalacion(
            instalacion_id=instalacion_id,
            producto_id=producto_id,
            descripcion_dinstalacion=descripcion_dinstalacion,
            cantidad_dinstalacion=cantidad_dinstalacion,
            unidad_dinstalacion=unidad_dinstalacion,
            observacion_dinstalacion=observacion_dinstalacion,
        )

    def list_detalles_instalacion(self, instalacion_id: int) -> list[dict]:
        self._get_instalacion(instalacion_id)
        return self.instalaciones_repo.list_detalles_instalacion(instalacion_id)

    # ==========================================================
    # GARANTIAS
    # ==========================================================

    def crear_garantia(
        self,
        instalacion_id: int,
        contrato_id: int,
        producto_id: int,
        fecha_inicio_garantia: datetime,
        fecha_fin_garantia: Optional[datetime],
        estado_garantia_id: int,
        motivo_garantia: Optional[str] = None,
        resolucion_garantia: Optional[str] = None,
    ) -> dict:
        instalacion = self._get_instalacion(instalacion_id)

        if int(instalacion["contrato_id"]) != int(contrato_id):
            raise ValueError("El contrato_id no coincide con la instalación.")

        return self.instalaciones_repo.create_garantia(
            instalacion_id=instalacion_id,
            contrato_id=contrato_id,
            producto_id=producto_id,
            fecha_inicio_garantia=fecha_inicio_garantia,
            fecha_fin_garantia=fecha_fin_garantia,
            estado_garantia_id=estado_garantia_id,
            motivo_garantia=motivo_garantia,
            resolucion_garantia=resolucion_garantia,
        )

    def get_garantia(self, garantia_id: int) -> dict:
        garantia = self.instalaciones_repo.get_garantia_by_id(garantia_id)
        if not garantia:
            raise ValueError("Garantía no encontrada.")
        return garantia
