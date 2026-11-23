"""Asistente de Telegram: sesión interna para n8n y consultas compactas.

Ver docs/asistente.md. El bot actúa como el usuario vinculado: la sesión que
emite este servicio es una sesión normal de ese usuario, así que aplican sus
permisos por rol y la auditoría lo registra a él.
"""
from __future__ import annotations

import hmac
import os
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from app.core.security import generate_session_token, hash_session_token
from app.repositories.asistente_repo import AsistenteRepository
from app.repositories.auth_repo import AuthRepository

# Los días del negocio son de Argentina (UTC-3 todo el año, sin horario de verano):
# en UTC, a las 21 h ya sería "mañana".
TZ_NEGOCIO = timezone(timedelta(hours=-3))

LIMITE_BUSQUEDA = 5
LIMITE_AGENDA = 30
DIAS_AGENDA_DEFAULT = 7
MAX_DIAS_AGENDA = 31


class AsistenteError(Exception):
    """Error de dominio con el código HTTP que corresponde."""

    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def secreto_configurado() -> str | None:
    secreto = os.getenv("ASISTENTE_SECRETO", "").strip()
    return secreto or None


def minutos_sesion() -> int:
    return int(os.getenv("ASISTENTE_SESION_MINUTOS", "30"))


class AsistenteService:
    def __init__(self, repo: AsistenteRepository, auth_repo: AuthRepository | None = None):
        self.repo = repo
        self.auth_repo = auth_repo

    # ------------------------------------------------------------------
    # Sesión interna
    # ------------------------------------------------------------------
    def emitir_sesion(
        self,
        telegram_user_id: int,
        secreto_recibido: str | None,
        via_proxy: bool,
        ip_origen: str | None,
        user_agent: str | None,
    ) -> dict[str, Any]:
        secreto = secreto_configurado()
        if secreto is None:
            raise AsistenteError(503, "Asistente deshabilitado.")
        # Todo lo que entra por Traefik trae X-Forwarded-For: este endpoint es solo
        # para la red interna (n8n → api).
        if via_proxy:
            raise AsistenteError(403, "No disponible.")
        if not secreto_recibido or not hmac.compare_digest(
            secreto_recibido.encode("utf-8"), secreto.encode("utf-8")
        ):
            raise AsistenteError(401, "Secreto inválido.")

        usuario = self.repo.get_usuario_por_telegram(telegram_user_id)
        if not usuario:
            raise AsistenteError(404, "Cuenta de Telegram no vinculada.")
        if not usuario["activo_usuario"]:
            raise AsistenteError(403, "Usuario inactivo.")
        if usuario["requiere_cambio_password_usuario"]:
            raise AsistenteError(403, "El usuario debe cambiar su contraseña en la web.")

        assert self.auth_repo is not None
        token = generate_session_token()
        expira = datetime.now(timezone.utc) + timedelta(minutes=minutos_sesion())
        self.auth_repo.create_session(
            usuario_id=usuario["usuario_id"],
            token_hash_sesion=hash_session_token(token),
            fecha_expiracion_sesion=expira,
            ip_origen_sesion=ip_origen,
            user_agent_sesion=user_agent,
        )
        self.auth_repo.insert_audit_event(
            usuario_id=usuario["usuario_id"],
            modulo_auditoria="AUTH",
            accion_auditoria="LOGIN_ASISTENTE",
            entidad_auditoria="usuarios",
            entidad_id_auditoria=str(usuario["usuario_id"]),
            detalle_auditoria=f"telegram:{telegram_user_id}",
            ip_origen_auditoria=ip_origen,
            user_agent_auditoria=user_agent,
        )
        return {
            "token": token,
            "expira": expira,
            "usuario": {
                "username": usuario["username_usuario"],
                "nombre": f'{usuario["nombre_usuario"]} {usuario["apellido_usuario"]}',
                "rol": usuario["codigo_rol"],
            },
        }

    # ------------------------------------------------------------------
    # Consultas
    # ------------------------------------------------------------------
    def buscar_clientes(self, q: str) -> dict[str, Any]:
        texto = (q or "").strip()
        if len(texto) < 2:
            raise AsistenteError(422, "La búsqueda necesita al menos 2 caracteres.")
        clientes, total = self.repo.buscar_clientes(texto, LIMITE_BUSQUEDA)
        return {"total": total, "clientes": clientes}

    def ficha_cliente(self, cliente_id: int) -> dict[str, Any]:
        ficha = self.repo.ficha_cliente(cliente_id)
        if not ficha:
            raise AsistenteError(404, "Cliente no encontrado.")
        return ficha

    def agenda(self, desde: date | None, hasta: date | None) -> dict[str, Any]:
        inicio = desde or hoy_negocio()
        fin = hasta or (inicio + timedelta(days=DIAS_AGENDA_DEFAULT - 1))
        if fin < inicio:
            raise AsistenteError(422, "'hasta' no puede ser anterior a 'desde'.")
        if (fin - inicio).days >= MAX_DIAS_AGENDA:
            raise AsistenteError(422, f"El rango máximo es de {MAX_DIAS_AGENDA} días.")
        items = self.repo.agenda(
            inicio_del_dia(inicio),
            inicio_del_dia(fin + timedelta(days=1)),
            LIMITE_AGENDA,
        )
        return {"desde": inicio, "hasta": fin, "instalaciones": items}

    def resumen(self) -> dict[str, Any]:
        hoy = inicio_del_dia(hoy_negocio())
        return self.repo.resumen(hoy, hoy + timedelta(days=DIAS_AGENDA_DEFAULT))


def hoy_negocio() -> date:
    return datetime.now(TZ_NEGOCIO).date()


def inicio_del_dia(dia: date) -> datetime:
    return datetime.combine(dia, time.min, tzinfo=TZ_NEGOCIO)

    def planes(self) -> dict[str, Any]:
        return {"planes": self.repo.planes_vigentes()}
