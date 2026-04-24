from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RolOut(BaseModel):
    rol_id: int
    codigo_rol: str
    nombre_rol: str
    descripcion_rol: str | None = None


class UsuarioOut(BaseModel):
    usuario_id: int
    rol_id: int
    codigo_rol: str
    nombre_rol: str
    username_usuario: str
    email_usuario: EmailStr
    nombre_usuario: str
    apellido_usuario: str
    activo_usuario: bool
    requiere_cambio_password_usuario: bool
    ultimo_login_usuario: datetime | None = None
    created_at: datetime
    updated_at: datetime


class UsuarioCreate(BaseModel):
    codigo_rol: str = Field(..., min_length=1, max_length=30)
    username_usuario: str = Field(..., min_length=3, max_length=50)
    email_usuario: EmailStr
    password: str = Field(..., min_length=8, max_length=200)
    nombre_usuario: str = Field(..., min_length=1, max_length=100)
    apellido_usuario: str = Field(..., min_length=1, max_length=100)
    activo_usuario: bool = True
    requiere_cambio_password_usuario: bool = False


class UsuarioUpdate(BaseModel):
    codigo_rol: str | None = Field(default=None, min_length=1, max_length=30)
    username_usuario: str | None = Field(default=None, min_length=3, max_length=50)
    email_usuario: EmailStr | None = None
    nombre_usuario: str | None = Field(default=None, min_length=1, max_length=100)
    apellido_usuario: str | None = Field(default=None, min_length=1, max_length=100)
    activo_usuario: bool | None = None
    requiere_cambio_password_usuario: bool | None = None
