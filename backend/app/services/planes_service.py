from __future__ import annotations

from typing import List

from psycopg.errors import UniqueViolation

from app.repositories.planes_repo import PlanesRepository


class PlanesService:
    ESTADO_ACTIVO = 1
    ESTADO_INACTIVO = 2

    def __init__(self, repo: PlanesRepository):
        self.repo = repo

    # ==========================================================
    # CREATE
    # ==========================================================

    def create_plan(
        self,
        nombre_plan: str,
        velocidad_mbps_plan: int,
        descripcion_plan: str | None,
        estado_plan_id: int,
    ) -> dict:
        try:
            created = self.repo.create(
                nombre_plan,
                velocidad_mbps_plan,
                descripcion_plan,
                estado_plan_id,
            )
        except UniqueViolation:
            raise ValueError("Ya existe un plan con ese nombre.")

        comercial = self.repo.get_commercial_by_id(int(created["plan_id"]))
        return comercial if comercial else created

    # ==========================================================
    # READ
    # ==========================================================

    def get_plan(self, plan_id: int) -> dict:
        plan = self.repo.get_commercial_by_id(plan_id)
        if not plan:
            raise ValueError("Plan no encontrado.")
        return plan

    def list_planes(self) -> List[dict]:
        return self.repo.list_commercial()

    # ==========================================================
    # UPDATE
    # ==========================================================

    def update_plan(self, plan_id: int, data: dict) -> dict:
        if not self.repo.get_by_id(plan_id):
            raise ValueError("Plan no encontrado.")

        try:
            updated = self.repo.update(plan_id, data)
        except UniqueViolation:
            raise ValueError("Ya existe un plan con ese nombre.")

        if not updated:
            raise ValueError("No se pudo actualizar el plan.")

        comercial = self.repo.get_commercial_by_id(plan_id)
        return comercial if comercial else updated

    # ==========================================================
    # DELETE (lógico)
    # ==========================================================

    def delete_plan(self, plan_id: int) -> None:
        if not self.repo.get_by_id(plan_id):
            raise ValueError("Plan no encontrado.")
        self.repo.delete(plan_id)
