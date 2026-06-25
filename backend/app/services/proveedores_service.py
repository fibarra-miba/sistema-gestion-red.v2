from __future__ import annotations

from typing import List, Optional

from app.repositories.proveedores_repo import ProveedoresRepository


class ProveedoresService:
    NO_ENCONTRADO = "Proveedor no encontrado."
    ESTADO_INVALIDO = "El estado de proveedor no existe."

    def __init__(self, repo: ProveedoresRepository):
        self.repo = repo

    # ==========================================================
    # READ
    # ==========================================================

    def get_proveedor(self, proveedor_id: int) -> dict:
        proveedor = self.repo.get_by_id(proveedor_id)
        if not proveedor:
            raise ValueError(self.NO_ENCONTRADO)
        return proveedor

    def list_proveedores(
        self,
        search: Optional[str] = None,
        estado_proveedor_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        return self.repo.list(
            search=search,
            estado_proveedor_id=estado_proveedor_id,
            limit=limit,
            offset=offset,
        )

    # ==========================================================
    # WRITE
    # ==========================================================

    def create_proveedor(self, data: dict) -> dict:
        if not self.repo.exists_estado(data["estado_proveedor_id"]):
            raise ValueError(self.ESTADO_INVALIDO)
        created = self.repo.create(data)
        return self.repo.get_by_id(int(created["proveedor_id"]))

    def update_proveedor(self, proveedor_id: int, data: dict) -> dict:
        if not self.repo.get_by_id(proveedor_id):
            raise ValueError(self.NO_ENCONTRADO)
        if "estado_proveedor_id" in data and not self.repo.exists_estado(
            data["estado_proveedor_id"]
        ):
            raise ValueError(self.ESTADO_INVALIDO)
        self.repo.update(proveedor_id, data)
        return self.repo.get_by_id(proveedor_id)
