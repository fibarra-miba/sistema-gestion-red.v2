from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AuditEventOut(BaseModel):
    auditoria_id: int
    usuario_id: Optional[int] = None
    username_usuario: Optional[str] = None
    nombre_usuario: Optional[str] = None
    apellido_usuario: Optional[str] = None
    modulo_auditoria: str
    accion_auditoria: str
    entidad_auditoria: Optional[str] = None
    entidad_id_auditoria: Optional[str] = None
    detalle_auditoria: Optional[str] = None
    ip_origen_auditoria: Optional[str] = None
    user_agent_auditoria: Optional[str] = None
    created_at: datetime


class AuditEventListResponse(BaseModel):
    items: List[AuditEventOut]
    total: int


class AuditTiposOut(BaseModel):
    modulos: List[str]
    acciones: List[str]
