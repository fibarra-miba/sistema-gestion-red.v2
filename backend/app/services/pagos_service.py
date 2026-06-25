from __future__ import annotations

from datetime import date, datetime, time, timezone
from decimal import Decimal

from fastapi import HTTPException

from app.repositories import clientes_repo
from app.repositories.catalogos_repo import CatalogosRepo
from app.repositories.contratos_repo import ContractRepository
from app.repositories.pagos_repo import PagosRepo
from app.repositories.precios_repo import PreciosRepo
from app.repositories.promociones_repo import PromocionesRepo
from app.repositories.cuentas_repo import CuentaRepo
from app.services.precios_service import PricingService
from app.services.cuenta_corriente_service import CuentaCorrienteService


def _as_dt(d: date | None) -> datetime | None:
    if d is None:
        return None
    return datetime.combine(d, time.min, tzinfo=timezone.utc)


class PagosService:
    def __init__(
        self,
        contratos_repo: ContractRepository,
        pagos_repo: PagosRepo,
        catalogos_repo: CatalogosRepo,
        precios_repo: PreciosRepo,
        promo_repo: PromocionesRepo,
        cuenta_repo: CuentaRepo,
    ):
        self.contratos_repo = contratos_repo
        self.pagos_repo = pagos_repo
        self.catalogos_repo = catalogos_repo
        self.pricing = PricingService(precios_repo, promo_repo)
        self.cc = CuentaCorrienteService(cuenta_repo, catalogos_repo)

    def resumen(self) -> dict:
        return self.pagos_repo.resumen()

    def _es_contrato_cobrable(self, contrato_id: int, fecha_referencia: datetime) -> bool:
        contratos = self.contratos_repo.list_contratos_cobrables(fecha_referencia)
        return any(int(c["contrato_id"]) == int(contrato_id) for c in contratos)

    def _calcular_estado_pago(self, total_pagado: Decimal, total_factura: Decimal) -> str:
        if total_pagado == Decimal("0.00"):
            return "PENDIENTE"
        if total_pagado < total_factura:
            return "PARCIAL"
        return "PAGADO"

    def _sync_estado_pago(self, pago_id: int, total_pagado: Decimal, total_factura: Decimal) -> str:
        estado = self._calcular_estado_pago(total_pagado, total_factura)
        estado_id = self.catalogos_repo.get_estado_pago_id(estado)
        self.pagos_repo.update_estado_pago(pago_id, estado_id)
        return estado

    def generar_periodo_individual(
        self,
        contrato_id: int,
        periodo_anio_pago: int,
        periodo_mes_pago: int,
        fecha_emision: date,
        fecha_vencimiento: date | None,
        bonificacion_previa,
    ) -> dict:
        contrato = self.contratos_repo.get_contrato(contrato_id)
        if not contrato:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")

        if not self._es_contrato_cobrable(contrato_id, datetime.now(timezone.utc)):
            raise HTTPException(status_code=422, detail="Contrato no cobrable")

        if not self.contratos_repo.validar_no_periodo_anterior_inicio(
            contrato["fecha_inicio"], periodo_anio_pago, periodo_mes_pago
        ):
            raise HTTPException(status_code=422, detail="Período anterior al inicio del contrato")

        if self.pagos_repo.pago_periodo_existe(contrato_id, periodo_anio_pago, periodo_mes_pago):
            raise HTTPException(status_code=409, detail="Pago del período ya existe")

        try:
            pr = self.pricing.calcular_total(
                plan_id=contrato["plan_id"],
                fecha_emision=fecha_emision,
                aplica_promocion=bool(contrato["aplica_promocion"]),
                promocion_id=contrato["promocion_id"],
                bonificacion_previa=bonificacion_previa,
            )
        except ValueError as e:
            if str(e) == "PRECIO_NO_VIGENTE":
                raise HTTPException(status_code=422, detail="Precio base no vigente")
            if str(e) == "PROMO_NO_VIGENTE":
                raise HTTPException(status_code=422, detail="Promoción no vigente")
            raise HTTPException(status_code=422, detail=f"Pricing inválido: {e}")

        estado_fact_id = self.catalogos_repo.get_estado_factura_venta_id("EMITIDA")
        estado_pago_pend_id = self.catalogos_repo.get_estado_pago_id("PENDIENTE")

        concepto = f"Servicio Internet {periodo_mes_pago:02d}/{periodo_anio_pago}"

        factura_id = self.pagos_repo.insert_factura_venta(
            cliente_id=contrato["cliente_id"],
            estado_factura_venta_id=estado_fact_id,
            concepto=concepto,
            fecha_emision=_as_dt(fecha_emision) or datetime.now(timezone.utc),
            fecha_vencimiento=_as_dt(fecha_vencimiento),
            importe_base=pr.importe_factura,
            bonificacion=pr.bonificacion,
            total=pr.total,
        )

        pago_id = self.pagos_repo.insert_pago(
            contrato_id=contrato_id,
            factura_venta_id=factura_id,
            periodo_anio_pago=periodo_anio_pago,
            periodo_mes_pago=periodo_mes_pago,
            estado_pago_id=estado_pago_pend_id,
        )

        saldo = self.cc.aplicar_movimiento(
            cliente_id=contrato["cliente_id"],
            tipo_codigo="FACTURA",
            importe=pr.total,
            factura_venta_id=factura_id,
            pago_id=None,
            observacion=f"Factura período {periodo_mes_pago:02d}/{periodo_anio_pago}",
        )

        total_pagado = Decimal("0.00")
        saldo_pend = Decimal(pr.total)
        estado_sync = self._sync_estado_pago(pago_id, total_pagado, Decimal(pr.total))

        return {
            "pago_id": pago_id,
            "contrato_id": contrato_id,
            "factura_venta_id": factura_id,
            "periodo_anio_pago": periodo_anio_pago,
            "periodo_mes_pago": periodo_mes_pago,
            "estado": estado_sync,
            "total_factura": Decimal(pr.total),
            "total_pagado": total_pagado,
            "saldo_pendiente": saldo_pend,
            "excedente_credito": Decimal("0.00"),
            "saldo_cuenta_resultante": Decimal(saldo["saldo_resultante"]),
        }

    def generar_lote(
        self,
        periodo_anio_pago: int,
        periodo_mes_pago: int,
        fecha_emision: date,
        fecha_vencimiento: date | None,
        bonificacion_default,
    ) -> dict:
        contratos = self.contratos_repo.list_contratos_cobrables(datetime.now(timezone.utc))
        creados = 0
        omitidos = 0
        errores: list[dict] = []

        for c in contratos:
            try:
                with self.pagos_repo.conn.transaction():
                    if self.pagos_repo.pago_periodo_existe(
                        c["contrato_id"], periodo_anio_pago, periodo_mes_pago
                    ):
                        omitidos += 1
                        continue

                    self.generar_periodo_individual(
                        contrato_id=c["contrato_id"],
                        periodo_anio_pago=periodo_anio_pago,
                        periodo_mes_pago=periodo_mes_pago,
                        fecha_emision=fecha_emision,
                        fecha_vencimiento=fecha_vencimiento,
                        bonificacion_previa=bonificacion_default,
                    )
                    creados += 1

            except HTTPException as he:
                errores.append(
                    {
                        "contrato_id": c["contrato_id"],
                        "error": he.detail,
                        "status_code": he.status_code,
                    }
                )
            except Exception as e:
                errores.append(
                    {"contrato_id": c["contrato_id"], "error": str(e), "status_code": 500}
                )

        return {
            "creados": creados,
            "omitidos_existentes": omitidos,
            "errores": errores,
        }

    def registrar_movimiento_pago(
        self,
        pago_id: int,
        fecha_pago: datetime,
        monto,
        medio_pago_id: int,
        tipo_pago_id: int,
        observacion: str | None,
        comprobantes: list[dict] | None,
    ) -> dict:
        pago = self.pagos_repo.get_pago(pago_id)
        if not pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado")

        monto = Decimal(monto)
        if monto <= Decimal("0.00"):
            raise HTTPException(status_code=422, detail="El monto del pago debe ser mayor a 0")

        if not self.catalogos_repo.exists_medio_pago(medio_pago_id):
            raise HTTPException(status_code=422, detail="medio_pago_id inválido")

        if not self.catalogos_repo.exists_tipo_pago(tipo_pago_id):
            raise HTTPException(status_code=422, detail="tipo_pago_id inválido")

        pago_mov_id = self.pagos_repo.insert_pago_movimiento(
            pago_id=pago_id,
            fecha_pago=fecha_pago,
            monto=monto,
            medio_pago_id=medio_pago_id,
            tipo_pago_id=tipo_pago_id,
        )

        comp_out = []
        first_comprobante_url = None
        if comprobantes:
            for idx, c in enumerate(comprobantes):
                cid = self.pagos_repo.insert_comprobante(
                    pago_mov_id=pago_mov_id,
                    url=c["url"],
                    mime=c.get("mime"),
                    hash_=c.get("hash"),
                )
                if idx == 0:
                    first_comprobante_url = c["url"]

                comp_out.append(
                    {
                        "pago_comprobante_id": cid,
                        "comprobante_url": c["url"],
                        "comprobante_mime": c.get("mime"),
                        "comprobante_hash": c.get("hash"),
                        "comprobante_created_at": datetime.now(timezone.utc),
                    }
                )

        saldo = self.cc.aplicar_movimiento(
            cliente_id=pago["cliente_id"],
            tipo_codigo="PAGO",
            importe=monto,
            factura_venta_id=None,
            pago_id=pago_id,
            observacion=observacion,
        )

        recibo_id = self.pagos_repo.insert_recibo(
            pago_mov_id=pago_mov_id,
            comprobante_transferencia=first_comprobante_url,
            recepcion_transferencia=True,
            importe_recibo=monto,
            fecha_recibo=fecha_pago,
        )
        self.pagos_repo.insert_detalle_recibo(
            recibo_id=recibo_id,
            factura_venta_id=pago["factura_venta_id"],
        )

        total_pagado = Decimal(self.pagos_repo.sum_movimientos_pago(pago_id))
        total_factura = Decimal(pago["total"])

        estado = self._sync_estado_pago(pago_id, total_pagado, total_factura)

        saldo_pend = total_factura - total_pagado
        if saldo_pend < 0:
            saldo_pend = Decimal("0.00")

        excedente = total_pagado - total_factura
        if excedente < 0:
            excedente = Decimal("0.00")

        return {
            "pago_id": pago_id,
            "estado": estado,
            "total_factura": total_factura,
            "total_pagado": total_pagado,
            "saldo_pendiente": saldo_pend,
            "excedente_credito": excedente,
            "movimiento": {
                "pago_mov_id": pago_mov_id,
                "pago_id": pago_id,
                "fecha_pago": fecha_pago,
                "monto_pago": monto,
                "medio_pago_id": medio_pago_id,
                "tipo_pago_id": tipo_pago_id,
                "comprobantes": comp_out,
                "recibo": {
                    "recibo_id": recibo_id,
                    "pago_mov_id": pago_mov_id,
                    "comprobante_transferencia_recibo": first_comprobante_url,
                    "recepcion_transferencia_recibo": True,
                    "importe_recibo": monto,
                    "fecha_recibo": fecha_pago,
                },
            },
            "saldo_cuenta_resultante": Decimal(saldo["saldo_resultante"]),
        }

    def get_pago_detalle(self, pago_id: int) -> dict:
        pago = self.pagos_repo.get_pago(pago_id)
        if not pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado")

        total_pagado = Decimal(self.pagos_repo.sum_movimientos_pago(pago_id))
        total_factura = Decimal(pago["total"])
        estado_sync = self._sync_estado_pago(pago_id, total_pagado, total_factura)

        saldo_pend = total_factura - total_pagado
        if saldo_pend < 0:
            saldo_pend = Decimal("0.00")

        excedente = total_pagado - total_factura
        if excedente < 0:
            excedente = Decimal("0.00")

        movs = self.pagos_repo.list_movimientos(pago_id)
        for m in movs:
            m["comprobantes"] = self.pagos_repo.list_comprobantes_by_mov(m["pago_mov_id"])
            m["recibo"] = self.pagos_repo.get_recibo_by_movimiento(m["pago_mov_id"])

        cta = self.cc._get_or_create_cuenta(pago["cliente_id"])

        cliente = clientes_repo.get_cliente_by_id(self.pagos_repo.conn, pago["cliente_id"])

        return {
            "pago": {
                "pago_id": pago["pago_id"],
                "contrato_id": pago["contrato_id"],
                "factura_venta_id": pago["factura_venta_id"],
                "periodo_anio_pago": pago["periodo_anio_pago"],
                "periodo_mes_pago": pago["periodo_mes_pago"],
                "estado": estado_sync,
                "total_factura": total_factura,
                "total_pagado": total_pagado,
                "saldo_pendiente": saldo_pend,
                "excedente_credito": excedente,
            },
            "cliente": {
                "cliente_id": pago["cliente_id"],
                "nombre_cliente": cliente["nombre_cliente"],
                "apellido_cliente": cliente["apellido_cliente"],
            },
            "factura": {
                "factura_venta_id": pago["factura_venta_id"],
                "cliente_id": pago["cliente_id"],
                "fecha_emision": pago["fecha_emision"],
                "fecha_vencimiento": pago["fecha_vencimiento"],
                "importe_base": Decimal(pago["importe_base"]),
                "bonificacion": Decimal(pago["bonificacion"]),
                "total": total_factura,
            },
            "movimientos": movs,
            "saldo_cuenta_resultante": Decimal(cta["saldo_cuenta"]),
        }

    def patch_factura_bonificacion(self, factura_venta_id: int, bonificacion_nueva) -> dict:
        fac = self.pagos_repo.get_factura(factura_venta_id)
        if not fac:
            raise HTTPException(status_code=404, detail="Factura no encontrada")

        if self.pagos_repo.factura_tiene_movimientos(factura_venta_id):
            raise HTTPException(
                status_code=422,
                detail="No se puede modificar la bonificación de una factura con pagos registrados",
            )

        base = Decimal(fac["importe_base"])
        total_old = Decimal(fac["total"])
        bonif_new = Decimal(bonificacion_nueva)

        if bonif_new < Decimal("0.00"):
            raise HTTPException(status_code=422, detail="La bonificación no puede ser negativa")

        total_new = base - bonif_new
        if total_new < Decimal("0.00"):
            total_new = Decimal("0.00")

        diff = total_new - total_old

        with self.pagos_repo.conn.transaction():
            self.pagos_repo.update_factura_bonificacion(factura_venta_id, bonif_new, total_new)

            if diff != 0:
                tipo_codigo = "AJUSTE_D" if diff > 0 else "AJUSTE_H"
                importe = diff if diff > 0 else -diff

                saldo = self.cc.aplicar_movimiento(
                    cliente_id=fac["cliente_id"],
                    tipo_codigo=tipo_codigo,
                    importe=importe,
                    factura_venta_id=factura_venta_id,
                    pago_id=None,
                    observacion=f"Ajuste bonificación factura {factura_venta_id}",
                )
            else:
                saldo = self.cc._get_or_create_cuenta(fac["cliente_id"])
                saldo = {"saldo_resultante": Decimal(saldo["saldo_cuenta"])}

        return {
            "factura_venta_id": factura_venta_id,
            "total_old": total_old,
            "total_new": total_new,
            "diff": diff,
            "saldo_cuenta_resultante": Decimal(saldo["saldo_resultante"]),
        }

    def list_pagos_contrato(self, contrato_id: int, anio, mes, estado, limit, offset) -> list[dict]:
        items = self.pagos_repo.list_pagos_by_contrato(contrato_id, anio, mes, estado, limit, offset)
        out = []

        for it in items:
            total_factura = Decimal(it["total_factura"])
            total_pagado = Decimal(it["total_pagado"])

            estado_sync = self._sync_estado_pago(it["pago_id"], total_pagado, total_factura)

            if estado is not None and estado_sync != estado:
                continue

            saldo_pend = total_factura - total_pagado
            if saldo_pend < 0:
                saldo_pend = Decimal("0.00")

            excedente = total_pagado - total_factura
            if excedente < 0:
                excedente = Decimal("0.00")

            out.append(
                {
                    "pago_id": it["pago_id"],
                    "periodo_anio_pago": it["periodo_anio_pago"],
                    "periodo_mes_pago": it["periodo_mes_pago"],
                    "estado": estado_sync,
                    "total_factura": total_factura,
                    "total_pagado": total_pagado,
                    "saldo_pendiente": saldo_pend,
                    "excedente_credito": excedente,
                    "fecha_emision": it["fecha_emision"],
                    "fecha_vencimiento": it["fecha_vencimiento"],
                }
            )

        return out

    def get_cuenta_cliente(self, cliente_id: int) -> dict:
        cta = self.cc._get_or_create_cuenta(cliente_id)
        saldo = Decimal(cta["saldo_cuenta"])
        deuda = saldo if saldo > 0 else Decimal("0.00")
        credito = -saldo if saldo < 0 else Decimal("0.00")
        estado_calc = "DEUDOR" if saldo > 0 else ("AL_DIA" if saldo == 0 else "SALDO_A_FAVOR")
        return {
            "cliente_id": cliente_id,
            "saldo_cuenta": saldo,
            "deuda_actual": deuda,
            "credito_actual": credito,
            "estado_calculado": estado_calc,
        }
