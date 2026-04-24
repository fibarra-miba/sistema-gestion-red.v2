# /app/routes/catalogos.py

from __future__ import annotations

from fastapi import APIRouter, Depends
from psycopg import Connection

from app.services.catalogos_service import CatalogosService
from app.schemas.catalogo import CatalogoItemOut
from app.dependencies.auth import require_authenticated_user
from app.db import get_db


## router = APIRouter(prefix="/catalogos", tags=["Catalogos"])
router = APIRouter(
    prefix="/catalogos",
    tags=["Catalogos"],
    dependencies=[Depends(require_authenticated_user)],
)


@router.get("/medios-pagos", response_model=list[CatalogoItemOut])
def medios_pagos(conn: Connection = Depends(get_db)):
    service = CatalogosService(conn)
    return service.list_medios_pagos()


@router.get("/tipos-promo", response_model=list[CatalogoItemOut])
def tipos_promo(conn: Connection = Depends(get_db)):
    service = CatalogosService(conn)
    return service.list_tipos_promo()


@router.get("/tipos-pago", response_model=list[CatalogoItemOut])
def tipos_pago(conn: Connection = Depends(get_db)):
    service = CatalogosService(conn)
    return service.list_tipos_pago()


@router.get("/estados-pago", response_model=list[CatalogoItemOut])
def estados_pago(conn: Connection = Depends(get_db)):
    service = CatalogosService(conn)
    return service.list_estados_pago()
