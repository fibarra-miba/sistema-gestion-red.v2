from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.repositories.stock_repo import StockRepository


class StockService:
    """Stock por cantidades + costo PMP móvil (promedio ponderado).

    Reglas:
    - El saldo de un producto es SUM(signo · cantidad) sobre sus movimientos.
    - Las entradas por compra se valorizan al costo de la compra; el resto de los
      movimientos se valorizan al PMP vigente (valor_en_stock / cantidad_en_stock).
    - No se admite stock negativo: las salidas/ajustes negativos se rechazan si
      dejarían el saldo por debajo de cero.
    - Cada movimiento toma pg_advisory_xact_lock(producto_id) para serializar
      lecturas+escrituras del mismo producto dentro de la transacción.
    """

    # Códigos de tipo_movimiento_stock (espejo del catálogo 005).
    ENTRADA_COMPRA = "ENTRADA_COMPRA"
    SALIDA_INSTALACION = "SALIDA_INSTALACION"
    AJUSTE_POSITIVO = "AJUSTE_POSITIVO"
    AJUSTE_NEGATIVO = "AJUSTE_NEGATIVO"
    DEVOLUCION = "DEVOLUCION"

    PRODUCTO_NO_ENCONTRADO = "Producto no encontrado."
    CANTIDAD_INVALIDA = "La cantidad debe ser mayor a cero."

    def __init__(self, repo: StockRepository):
        self.repo = repo

    # ==========================================================
    # READ
    # ==========================================================

    def existencias(
        self,
        search: Optional[str] = None,
        tipo_producto_id: Optional[int] = None,
        solo_con_stock: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        rows = self.repo.existencias(
            search=search,
            tipo_producto_id=tipo_producto_id,
            solo_con_stock=solo_con_stock,
            limit=limit,
            offset=offset,
        )
        for r in rows:
            cantidad = float(r["cantidad"])
            valor = float(r["valor"])
            r["cantidad"] = cantidad
            r["valor"] = valor
            r["costo_promedio"] = round(valor / cantidad, 2) if cantidad > 0 else 0.0
        return rows

    def saldo(self, producto_id: int) -> dict:
        self._get_producto(producto_id)
        s = self.repo.get_saldo(producto_id)
        cantidad = s["cantidad"]
        valor = s["valor"]
        return {
            "producto_id": producto_id,
            "cantidad": cantidad,
            "valor": valor,
            "costo_promedio": round(valor / cantidad, 2) if cantidad > 0 else 0.0,
        }

    def kardex(self, producto_id: int, limit: int = 100, offset: int = 0) -> List[dict]:
        self._get_producto(producto_id)
        return self.repo.kardex(producto_id, limit=limit, offset=offset)

    # ==========================================================
    # MOVIMIENTOS PÚBLICOS
    # ==========================================================

    def registrar_entrada_compra(
        self,
        producto_id: int,
        cantidad_base: float,
        costo_unitario_base: float,
        det_factura_compra_id: Optional[int],
        fecha: Optional[datetime] = None,
        observacion: Optional[str] = None,
    ) -> dict:
        return self._registrar(
            producto_id=producto_id,
            cantidad=cantidad_base,
            tipo_codigo=self.ENTRADA_COMPRA,
            costo_unitario=costo_unitario_base,
            fecha=fecha,
            observacion=observacion,
            det_factura_compra_id=det_factura_compra_id,
        )

    def registrar_salida_instalacion(
        self,
        producto_id: int,
        cantidad_base: float,
        det_instalacion_id: int,
        fecha: Optional[datetime] = None,
        observacion: Optional[str] = None,
    ) -> dict:
        return self._registrar(
            producto_id=producto_id,
            cantidad=cantidad_base,
            tipo_codigo=self.SALIDA_INSTALACION,
            costo_unitario=None,  # PMP vigente
            fecha=fecha,
            observacion=observacion,
            det_instalacion_id=det_instalacion_id,
        )

    def registrar_ajuste(
        self,
        producto_id: int,
        cantidad: float,
        positivo: bool,
        motivo: str,
        fecha: Optional[datetime] = None,
    ) -> dict:
        tipo = self.AJUSTE_POSITIVO if positivo else self.AJUSTE_NEGATIVO
        return self._registrar(
            producto_id=producto_id,
            cantidad=cantidad,
            tipo_codigo=tipo,
            costo_unitario=None,  # PMP vigente
            fecha=fecha,
            observacion=motivo,
        )

    def registrar_devolucion(
        self,
        producto_id: int,
        cantidad: float,
        motivo: str,
        det_instalacion_id: Optional[int] = None,
        fecha: Optional[datetime] = None,
    ) -> dict:
        return self._registrar(
            producto_id=producto_id,
            cantidad=cantidad,
            tipo_codigo=self.DEVOLUCION,
            costo_unitario=None,  # PMP vigente
            fecha=fecha,
            observacion=motivo,
            det_instalacion_id=det_instalacion_id,
        )

    def reversar_entrada_compra(
        self,
        producto_id: int,
        cantidad_base: float,
        costo_unitario_base: float,
        det_factura_compra_id: Optional[int],
        observacion: Optional[str] = None,
    ) -> dict:
        """Contramovimiento de una entrada por compra (anulación).

        Sale exactamente la cantidad y el costo con que entró, de modo que la
        línea de compra deja de aportar al stock. Se rechaza si ya se consumió.
        """
        return self._registrar(
            producto_id=producto_id,
            cantidad=cantidad_base,
            tipo_codigo=self.AJUSTE_NEGATIVO,
            costo_unitario=costo_unitario_base,
            observacion=observacion,
            det_factura_compra_id=det_factura_compra_id,
        )

    # ==========================================================
    # NÚCLEO
    # ==========================================================

    def _registrar(
        self,
        producto_id: int,
        cantidad: float,
        tipo_codigo: str,
        costo_unitario: Optional[float],
        fecha: Optional[datetime] = None,
        observacion: Optional[str] = None,
        det_instalacion_id: Optional[int] = None,
        det_factura_compra_id: Optional[int] = None,
    ) -> dict:
        if cantidad is None or float(cantidad) <= 0:
            raise ValueError(self.CANTIDAD_INVALIDA)

        self._get_producto(producto_id)
        tipo = self.repo.get_tipo_mov(tipo_codigo)

        # Lock + lectura de saldo bajo el lock (consistencia PMP / no-negativo).
        self.repo.lock_producto(producto_id)
        saldo = self.repo.get_saldo(producto_id)
        disponible = saldo["cantidad"]

        if costo_unitario is None:
            costo_unitario = (
                round(saldo["valor"] / disponible, 2) if disponible > 0 else 0.0
            )

        if tipo["signo_tmstock"] == "-" and disponible < float(cantidad):
            raise ValueError(self._stock_insuficiente(producto_id, disponible, cantidad))

        return self.repo.insert_movimiento(
            producto_id=producto_id,
            cantidad_base=cantidad,
            tipo_mov_id=int(tipo["tipo_mov_id"]),
            costo_unitario=costo_unitario,
            fecha=fecha,
            observacion=observacion,
            det_instalacion_id=det_instalacion_id,
            det_factura_compra_id=det_factura_compra_id,
        )

    def _get_producto(self, producto_id: int) -> dict:
        producto = self.repo.get_producto(producto_id)
        if not producto:
            raise ValueError(self.PRODUCTO_NO_ENCONTRADO)
        return producto

    @staticmethod
    def _stock_insuficiente(producto_id: int, disponible: float, solicitado: float) -> str:
        return (
            f"Stock insuficiente para el producto {producto_id}: "
            f"disponible {disponible}, solicitado {solicitado}."
        )
