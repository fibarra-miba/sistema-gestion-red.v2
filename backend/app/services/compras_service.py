from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.repositories.compras_repo import ComprasRepository
from app.services.stock_service import StockService


class ComprasService:
    """Compras como registro de gasto + impacto de stock atómico.

    El alta de una factura de compra genera, en la misma transacción, una entrada
    de stock por cada línea (recepción inmediata). La anulación pasa la factura a
    ANULADA y genera contramovimientos; se rechaza si el material ya se consumió.
    """

    PROVEEDOR_INVALIDO = "El proveedor no existe."
    PRODUCTO_INVALIDO = "Uno de los productos no existe."
    PRESENTACION_INVALIDA = "La presentación no existe o no pertenece al producto."
    NO_ENCONTRADA = "Compra no encontrada."
    YA_ANULADA = "La compra ya está anulada."

    def __init__(self, repo: ComprasRepository, stock: StockService):
        self.repo = repo
        self.stock = stock

    # ==========================================================
    # READ
    # ==========================================================

    def get_compra(self, factura_compra_id: int) -> dict:
        factura = self.repo.get_factura(factura_compra_id)
        if not factura:
            raise ValueError(self.NO_ENCONTRADA)
        factura["detalles"] = self.repo.list_detalles(factura_compra_id)
        return factura

    def list_compras(
        self,
        proveedor_id: Optional[int] = None,
        estado_factura_compra_id: Optional[int] = None,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        return self.repo.list_facturas(
            proveedor_id=proveedor_id,
            estado_factura_compra_id=estado_factura_compra_id,
            desde=desde,
            hasta=hasta,
            limit=limit,
            offset=offset,
        )

    # ==========================================================
    # CREATE
    # ==========================================================

    def create_compra(
        self,
        proveedor_id: int,
        detalles: List[dict],
        codigo_fcompras: Optional[str] = None,
        descripcion_fcompras: Optional[str] = None,
        fecha_fcompras: Optional[datetime] = None,
    ) -> dict:
        if not self.repo.exists_proveedor(proveedor_id):
            raise ValueError(self.PROVEEDOR_INVALIDO)

        # Resolver y validar cada línea antes de escribir.
        lineas = [self._resolver_linea(d) for d in detalles]
        importe_total = round(sum(l["subtotal"] for l in lineas), 2)

        estado_emitida = self.repo.get_estado_id("EMITIDA")
        factura_id = self.repo.create_factura(
            proveedor_id=proveedor_id,
            codigo_fcompras=codigo_fcompras,
            descripcion_fcompras=descripcion_fcompras,
            fecha_fcompras=fecha_fcompras,
            importe_total_fcompras=importe_total,
            estado_factura_compra_id=estado_emitida,
        )

        for l in lineas:
            det_id = self.repo.create_detalle(
                factura_compra_id=factura_id,
                producto_id=l["producto_id"],
                presentacion_id=l["presentacion_id"],
                cantidad_presentacion=l["cantidad_presentacion"],
                factor_aplicado=l["factor_aplicado"],
                cantidad_base=l["cantidad_base"],
                costo_unitario_base=l["costo_unitario_base"],
                subtotal=l["subtotal"],
            )
            self.stock.registrar_entrada_compra(
                producto_id=l["producto_id"],
                cantidad_base=l["cantidad_base"],
                costo_unitario_base=l["costo_unitario_base"],
                det_factura_compra_id=det_id,
                fecha=fecha_fcompras,
                observacion=f"Compra #{factura_id}",
            )

        return self.get_compra(factura_id)

    def _resolver_linea(self, d: dict) -> dict:
        producto_id = d["producto_id"]
        if not self.repo.exists_producto(producto_id):
            raise ValueError(self.PRODUCTO_INVALIDO)

        presentacion_id = d.get("presentacion_id")
        factor = 1.0
        if presentacion_id is not None:
            pres = self.repo.get_presentacion(presentacion_id)
            if not pres or int(pres["producto_id"]) != int(producto_id):
                raise ValueError(self.PRESENTACION_INVALIDA)
            factor = float(pres["factor_a_stock"])

        cantidad_pres = float(d["cantidad_presentacion"])
        costo_pres = float(d["costo_presentacion"])
        cantidad_base = round(cantidad_pres * factor, 2)
        costo_unitario_base = round(costo_pres / factor, 2) if factor else costo_pres
        subtotal = round(cantidad_pres * costo_pres, 2)

        return {
            "producto_id": producto_id,
            "presentacion_id": presentacion_id,
            "cantidad_presentacion": cantidad_pres,
            "factor_aplicado": factor,
            "cantidad_base": cantidad_base,
            "costo_unitario_base": costo_unitario_base,
            "subtotal": subtotal,
        }

    # ==========================================================
    # ANULAR
    # ==========================================================

    def anular_compra(self, factura_compra_id: int) -> dict:
        factura = self.repo.get_factura(factura_compra_id)
        if not factura:
            raise ValueError(self.NO_ENCONTRADA)
        if factura["descripcion_efcompra"] == "ANULADA":
            raise ValueError(self.YA_ANULADA)

        detalles = self.repo.list_detalles(factura_compra_id)
        for d in detalles:
            self.stock.reversar_entrada_compra(
                producto_id=int(d["producto_id"]),
                cantidad_base=float(d["cantidad_base"]),
                costo_unitario_base=float(d["costo_unitario_base"]),
                det_factura_compra_id=int(d["det_factura_compra_id"]),
                observacion=f"Anulación compra #{factura_compra_id}",
            )

        estado_anulada = self.repo.get_estado_id("ANULADA")
        self.repo.set_estado(factura_compra_id, estado_anulada)
        return self.get_compra(factura_compra_id)
