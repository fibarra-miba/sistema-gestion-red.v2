# app/services/promociones_service.py

from __future__ import annotations

from typing import List, Optional

from psycopg.errors import CheckViolation, ForeignKeyViolation

from app.repositories.promociones_repo import PromocionesRepo


class PromocionesService:
    NO_ENCONTRADA = "Promoción no encontrada."
    TIPO_INVALIDO = "tipo_promo_id inválido (1=PORCENTAJE, 2=DESCUENTO_FIJO)."
    INCONSISTENTE = (
        "PORCENTAJE requiere porcentaje_descuento (sin monto); "
        "DESCUENTO_FIJO requiere monto_descuento (sin porcentaje)."
    )
    FECHAS = "fecha_vigencia_hasta_promo debe ser posterior a fecha_vigencia_desde_promo."

    TIPO_PORCENTAJE = 1
    TIPO_DESCUENTO_FIJO = 2

    def __init__(self, repo: PromocionesRepo):
        self.repo = repo

    # ==========================================================
    # VALIDACIÓN (espeja chk_promociones_tipo_consistente y chk_promociones_fechas)
    # ==========================================================

    def _validar_consistencia(self, tipo_promo_id, porcentaje, monto, desde, hasta) -> None:
        if int(tipo_promo_id) == self.TIPO_PORCENTAJE:
            if porcentaje is None or monto is not None:
                raise ValueError(self.INCONSISTENTE)
        elif int(tipo_promo_id) == self.TIPO_DESCUENTO_FIJO:
            if monto is None or porcentaje is not None:
                raise ValueError(self.INCONSISTENTE)
        else:
            # El CHECK de la DB solo admite tipos 1 y 2.
            raise ValueError(self.TIPO_INVALIDO)

        if desde is not None and hasta is not None and hasta <= desde:
            raise ValueError(self.FECHAS)

    # ==========================================================
    # READ
    # ==========================================================

    def get_promocion(self, promocion_id: int) -> dict:
        promo = self.repo.get_full(promocion_id)
        if not promo:
            raise ValueError(self.NO_ENCONTRADA)
        return promo

    def list_promociones(
        self,
        activo: Optional[bool] = None,
        tipo_promo_id: Optional[int] = None,
        vigentes: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        return self.repo.list(
            activo=activo,
            tipo_promo_id=tipo_promo_id,
            vigentes=vigentes,
            limit=limit,
            offset=offset,
        )

    # ==========================================================
    # CREATE
    # ==========================================================

    def create_promocion(self, data: dict) -> dict:
        self._validar_consistencia(
            data["tipo_promo_id"],
            data.get("porcentaje_descuento"),
            data.get("monto_descuento"),
            data.get("fecha_vigencia_desde_promo"),
            data.get("fecha_vigencia_hasta_promo"),
        )
        try:
            created = self.repo.create(data)
        except (CheckViolation, ForeignKeyViolation):
            # Backstop: cualquier inconsistencia que el validador no haya cazado.
            raise ValueError(self.INCONSISTENTE)

        return self.repo.get_full(created["promocion_id"])

    # ==========================================================
    # UPDATE
    # ==========================================================

    def update_promocion(self, promocion_id: int, data: dict) -> dict:
        current = self.repo.get_full(promocion_id)
        if not current:
            raise ValueError(self.NO_ENCONTRADA)

        # Estado final tras aplicar el patch parcial, para validar consistencia.
        def merged(key):
            return data[key] if key in data else current.get(key)

        self._validar_consistencia(
            merged("tipo_promo_id"),
            merged("porcentaje_descuento"),
            merged("monto_descuento"),
            merged("fecha_vigencia_desde_promo"),
            merged("fecha_vigencia_hasta_promo"),
        )

        try:
            self.repo.update(promocion_id, data)
        except (CheckViolation, ForeignKeyViolation):
            raise ValueError(self.INCONSISTENTE)

        return self.repo.get_full(promocion_id)
