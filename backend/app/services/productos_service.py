from __future__ import annotations

from typing import List, Optional

from psycopg.errors import UniqueViolation

from app.repositories.productos_repo import ProductosRepository


class ProductosService:
    DUPLICADO = "Ya existe un producto con esa combinación de nombre, marca y modelo."
    TIPO_INVALIDO = "El tipo de producto no existe o está inactivo."
    NO_ENCONTRADO = "Producto no encontrado."

    def __init__(self, repo: ProductosRepository):
        self.repo = repo

    # ==========================================================
    # READ
    # ==========================================================

    def get_producto(self, producto_id: int) -> dict:
        producto = self.repo.get_by_id(producto_id)
        if not producto:
            raise ValueError(self.NO_ENCONTRADO)
        return producto

    def list_productos(
        self,
        search: Optional[str] = None,
        solo_activos: bool = False,
        tipo_producto_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        return self.repo.list(
            search=search,
            solo_activos=solo_activos,
            tipo_producto_id=tipo_producto_id,
            limit=limit,
            offset=offset,
        )

    # ==========================================================
    # CREATE
    # ==========================================================

    def create_producto(
        self,
        nombre_producto: str,
        descripcion_producto: Optional[str],
        marca_producto: str,
        modelo_producto: str,
        tipo_producto_id: int,
        unidad_stock_producto: Optional[str] = None,
    ) -> dict:
        if not self.repo.exists_tipo_producto(tipo_producto_id):
            raise ValueError(self.TIPO_INVALIDO)

        try:
            created = self.repo.create(
                nombre_producto=nombre_producto,
                descripcion_producto=descripcion_producto,
                marca_producto=marca_producto,
                modelo_producto=modelo_producto,
                tipo_producto_id=tipo_producto_id,
                unidad_stock_producto=unidad_stock_producto,
            )
        except UniqueViolation:
            raise ValueError(self.DUPLICADO)

        return self.repo.get_by_id(int(created["producto_id"]))

    # ==========================================================
    # PRESENTACIONES
    # ==========================================================

    def list_presentaciones(self, producto_id: int) -> List[dict]:
        self.get_producto(producto_id)
        return self.repo.list_presentaciones(producto_id)

    def create_presentacion(
        self,
        producto_id: int,
        nombre_presentacion: str,
        unidad_compra_presentacion: str,
        factor_a_stock: float,
    ) -> dict:
        self.get_producto(producto_id)
        return self.repo.create_presentacion(
            producto_id=producto_id,
            nombre_presentacion=nombre_presentacion,
            unidad_compra_presentacion=unidad_compra_presentacion,
            factor_a_stock=factor_a_stock,
        )

    # ==========================================================
    # UPDATE (incluye activar/desactivar)
    # ==========================================================

    def update_producto(self, producto_id: int, data: dict) -> dict:
        if not self.repo.get_by_id(producto_id):
            raise ValueError(self.NO_ENCONTRADO)

        if "tipo_producto_id" in data and not self.repo.exists_tipo_producto(
            data["tipo_producto_id"]
        ):
            raise ValueError(self.TIPO_INVALIDO)

        try:
            self.repo.update(producto_id, data)
        except UniqueViolation:
            raise ValueError(self.DUPLICADO)

        return self.repo.get_by_id(producto_id)
