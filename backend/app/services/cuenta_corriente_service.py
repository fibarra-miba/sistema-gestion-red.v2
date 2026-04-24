# app/services/cuenta_corriente_service.py

from __future__ import annotations

from decimal import Decimal

from app.repositories.cuentas_repo import CuentaRepo
from app.repositories.catalogos_repo import CatalogosRepo


class CuentaCorrienteService:
    """
    Modelo mental:
      cuenta.saldo_cuenta = DEBE - HABER
      FACTURA (D) aumenta deuda: saldo += importe
      PAGO (H) reduce deuda: saldo -= importe
    """

    def __init__(self, cuenta_repo: CuentaRepo, catalogos_repo: CatalogosRepo):
        self.cuenta_repo = cuenta_repo
        self.catalogos_repo = catalogos_repo

    def _get_or_create_cuenta(self, cliente_id: int) -> dict:
        cta = self.cuenta_repo.get_by_cliente(cliente_id)
        if cta:
            return cta

        # fallback (si onboarding no creó cuenta)
        with self.cuenta_repo.conn.cursor() as cur:
            cur.execute("SELECT estado_cuenta_id FROM estado_cuenta ORDER BY estado_cuenta_id LIMIT 1")
            row = cur.fetchone()
            if not row:
                raise ValueError("NO_HAY_ESTADO_CUENTA")
            estado_cuenta_id = int(row[0])

        return self.cuenta_repo.create(cliente_id, estado_cuenta_id)

    def aplicar_movimiento(
        self,
        cliente_id: int,
        tipo_codigo: str,  # FACTURA | PAGO | AJUSTE_D | AJUSTE_H
        importe,
        factura_venta_id: int | None,
        pago_id: int | None,
        observacion: str | None,
    ) -> dict:
        cta = self._get_or_create_cuenta(cliente_id)
        saldo = Decimal(cta["saldo_cuenta"])

        t = self.catalogos_repo.get_tipo_mov_det_cuenta(tipo_codigo)
        signo = t["signo"]

        imp = Decimal(importe)
        if imp <= 0:
            raise ValueError("IMPORTE_INVALIDO")

        if signo == "D":
            nuevo = saldo + imp
        elif signo == "H":
            nuevo = saldo - imp
        else:
            raise ValueError("SIGNO_INVALIDO")

        self.cuenta_repo.insert_detalle(
            cuenta_id=cta["cuenta_id"],
            tipo_mov_det_cuenta_id=t["id"],
            importe=imp,
            factura_venta_id=factura_venta_id,
            pago_id=pago_id,
            observacion=observacion,
        )
        self.cuenta_repo.update_saldo(cta["cuenta_id"], nuevo)
        return {"cuenta_id": cta["cuenta_id"], "saldo_resultante": nuevo}