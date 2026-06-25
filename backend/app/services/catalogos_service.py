from __future__ import annotations

from psycopg import Connection

from app.repositories.catalogos_repo import CatalogosRepo


class CatalogosService:

    def __init__(self, conn: Connection):
        self.repo = CatalogosRepo(conn)

    def list_medios_pagos(self):
        return self.repo.list_medios_pagos()

    def list_tipos_promo(self):
        return self.repo.list_tipos_promo()

    def list_tipos_pago(self):
        return self.repo.list_tipos_pago()

    def list_estados_pago(self):
        return self.repo.list_estados_pago()

    def list_tipos_producto(self):
        return self.repo.list_tipos_producto()

    def list_estados_garantia(self):
        return self.repo.list_estados_garantia()

    def list_estados_proveedor(self):
        return self.repo.list_estados_proveedor()

    def list_tipos_movimiento_stock(self):
        return self.repo.list_tipos_movimiento_stock()