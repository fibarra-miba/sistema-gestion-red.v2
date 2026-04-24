# app/services/precios_service.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP

from psycopg.errors import CheckViolation, ExclusionViolation, ForeignKeyViolation

from app.repositories.precios_repo import PreciosRepo
from app.repositories.promociones_repo import PromocionesRepo
from app.repositories.planes_repo import PlanesRepository


@dataclass(frozen=True)
class PricingResult:
    importe_base: Decimal
    importe_factura: Decimal
    descuento_promo: Decimal
    bonificacion: Decimal
    total: Decimal


class PricingService:
    def __init__(self, precios_repo: PreciosRepo, promo_repo: PromocionesRepo):
        self.precios_repo = precios_repo
        self.promo_repo = promo_repo

    def calcular_total(
        self,
        plan_id: int,
        fecha_emision: date,
        aplica_promocion: bool,
        promocion_id: int | None,
        bonificacion_previa,
    ) -> PricingResult:
        precio = self.precios_repo.get_precio_base_vigente(plan_id, fecha_emision)
        if not precio:
            raise ValueError("PRECIO_NO_VIGENTE")

        base = Decimal(precio["precio"]).quantize(Decimal("0.01"))
        if base <= 0:
            raise ValueError("PRECIO_NO_VIGENTE")

        descuento_promo = Decimal("0.00")
        importe_factura = base

        if aplica_promocion:
            if not promocion_id:
                raise ValueError("PROMO_INVALIDA")

            promo = self.promo_repo.get_promocion(promocion_id)
            if not promo or not self.promo_repo.promo_vigente(promo, fecha_emision):
                raise ValueError("PROMO_NO_VIGENTE")

            tipo = (promo["tipo_desc"] or "").upper()
            if tipo == "PORCENTAJE":
                pct = Decimal(str(promo["porcentaje"] or 0)).quantize(Decimal("0.01"))
                descuento_promo = (base * pct / Decimal("100")).quantize(Decimal("0.01"))
            elif tipo == "DESCUENTO_FIJO":
                descuento_promo = Decimal(str(promo["monto"] or 0)).quantize(Decimal("0.01"))
            else:
                raise ValueError("PROMO_INVALIDA")

            importe_factura = base - descuento_promo
            if importe_factura < 0:
                importe_factura = Decimal("0.00")

        bonif = Decimal(str(bonificacion_previa or 0)).quantize(Decimal("0.01"))
        if bonif < 0:
            raise ValueError("BONIFICACION_INVALIDA")

        total = importe_factura - bonif
        if total < 0:
            total = Decimal("0.00")

        return PricingResult(
            importe_base=base,
            importe_factura=importe_factura.quantize(Decimal("0.01")),
            descuento_promo=descuento_promo.quantize(Decimal("0.01")),
            bonificacion=bonif,
            total=total.quantize(Decimal("0.01")),
        )


class PreciosPlanesService:
    def __init__(self, precios_repo: PreciosRepo, planes_repo: PlanesRepository):
        self.precios_repo = precios_repo
        self.planes_repo = planes_repo

    def _validar_plan_existente(self, plan_id: int) -> dict:
        plan = self.planes_repo.get_by_id(plan_id)
        if not plan:
            raise ValueError("Plan no encontrado.")
        return plan

    def _validar_precio_existente(self, plan_id: int, precios_planes_id: int) -> dict:
        self._validar_plan_existente(plan_id)

        precio = self.precios_repo.get_by_id(precios_planes_id)
        if not precio:
            raise ValueError("Precio no encontrado.")

        if int(precio["plan_id"]) != int(plan_id):
            raise ValueError("El precio no pertenece al plan indicado.")

        return precio

    def _es_precio_futuro(self, precio: dict) -> bool:
        ahora = datetime.now(tz=precio["fecha_desde_pplanes"].tzinfo)
        return precio["fecha_desde_pplanes"] > ahora

    def _normalizar_monto(self, value) -> Decimal:
        return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def list_prices_by_plan(self, plan_id: int) -> list[dict]:
        self._validar_plan_existente(plan_id)
        return self.precios_repo.list_by_plan(plan_id)

    def create_price(
        self,
        plan_id: int,
        precio_mensual_pplanes,
        fecha_desde_pplanes: datetime,
        fecha_hasta_pplanes: datetime | None = None,
    ) -> dict:
        self._validar_plan_existente(plan_id)

        try:
            return self.precios_repo.create(
                plan_id=plan_id,
                precio_mensual_pplanes=precio_mensual_pplanes,
                fecha_desde_pplanes=fecha_desde_pplanes,
                fecha_hasta_pplanes=fecha_hasta_pplanes,
            )
        except ExclusionViolation:
            raise ValueError("Ya existe un precio solapado para ese plan en el período indicado.")
        except CheckViolation:
            raise ValueError("Las fechas o el precio informado no son válidos.")
        except ForeignKeyViolation:
            raise ValueError("El plan informado no existe.")

    def update_price(
        self,
        plan_id: int,
        precios_planes_id: int,
        data: dict,
    ) -> dict:
        precio_actual = self._validar_precio_existente(plan_id, precios_planes_id)

        if not self._es_precio_futuro(precio_actual):
            raise ValueError("Solo se pueden editar precios futuros.")

        if not data:
            return precio_actual

        payload = dict(data)

        if "precio_mensual_pplanes" in payload:
            payload["precio_mensual_pplanes"] = self._normalizar_monto(payload["precio_mensual_pplanes"])

        try:
            updated = self.precios_repo.update(precios_planes_id, payload)
        except ExclusionViolation:
            raise ValueError("Ya existe un precio solapado para ese plan en el período indicado.")
        except CheckViolation:
            raise ValueError("Las fechas o el precio informado no son válidos.")
        except ForeignKeyViolation:
            raise ValueError("El plan informado no existe.")

        if not updated:
            raise ValueError("No se pudo actualizar el precio.")

        return updated
