from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=200)


class RoleInfo(BaseModel):
    rol_id: int
    codigo_rol: str
    nombre_rol: str


class CapabilitiesOut(BaseModel):
    can_manage_users: bool = False
    can_manage_planes: bool = False
    can_manage_clientes: bool = False
    can_manage_domicilios: bool = False
    can_manage_contratos: bool = False
    can_manage_instalaciones: bool = False
    can_manage_pagos: bool = False
    can_manage_productos: bool = False
    can_manage_promociones: bool = False
    can_manage_proveedores: bool = False
    can_manage_compras: bool = False
    can_manage_stock: bool = False
    can_view_stock: bool = False


class AuthMeResponse(BaseModel):
    usuario_id: int
    username_usuario: str
    email_usuario: EmailStr
    nombre_usuario: str
    apellido_usuario: str
    activo_usuario: bool
    requiere_cambio_password_usuario: bool
    ultimo_login_usuario: datetime | None = None
    rol: RoleInfo
    capabilities: CapabilitiesOut


class MessageResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=200)
    new_password: str = Field(..., min_length=8, max_length=200)
    revoke_all_sessions: bool = True
