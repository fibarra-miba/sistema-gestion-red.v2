from pydantic import BaseModel, Field
from typing import Optional


class CatalogoItemOut(BaseModel):
    id: int
    descripcion: str

    # Campos opcionales específicos que algunos endpoints necesitan
    descripcion_tpromo: Optional[str] = None
    descripcion_epago: Optional[str] = None


class CatalogoTipoMovDetCuentaOut(BaseModel):
    id: int
    codigo: str
    descripcion: str
    signo: str
    activo: bool