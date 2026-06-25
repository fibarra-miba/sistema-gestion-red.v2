from __future__ import annotations

from dataclasses import dataclass

from app.repositories.auditoria_repo import AuditRepository


class AuditModulo:
    """Módulos auditables (valor de `modulo_auditoria`)."""

    AUTH = "AUTH"
    USUARIOS = "USUARIOS"
    CLIENTES = "CLIENTES"
    DOMICILIOS = "DOMICILIOS"
    CONTRATOS = "CONTRATOS"
    INSTALACIONES = "INSTALACIONES"
    PAGOS = "PAGOS"
    PRODUCTOS = "PRODUCTOS"
    PROMOCIONES = "PROMOCIONES"
    PLANES = "PLANES"
    PRECIOS = "PRECIOS"
    PROVEEDORES = "PROVEEDORES"
    COMPRAS = "COMPRAS"
    STOCK = "STOCK"


class AuditAccion:
    """Acciones auditables (valor de `accion_auditoria`).

    Solo escrituras y transiciones de estado; las lecturas no se auditan.
    """

    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"

    # Clientes
    ONBOARDING = "ONBOARDING"

    # Contratos (transiciones)
    ACTIVATE = "ACTIVATE"
    SUSPEND = "SUSPEND"
    RESUME = "RESUME"
    CANCEL = "CANCEL"
    TERMINATE = "TERMINATE"
    CHANGE_PLAN = "CHANGE_PLAN"
    ASSIGN_PROMO = "ASSIGN_PROMO"
    REMOVE_PROMO = "REMOVE_PROMO"
    CONFIRM_TECH = "CONFIRM_TECH"

    # Instalaciones
    PROG_CREATE = "PROG_CREATE"
    REPROGRAM = "REPROGRAM"
    EXECUTE = "EXECUTE"
    COMPLETE = "COMPLETE"
    FAIL = "FAIL"
    BAJA = "BAJA"
    RETRY = "RETRY"
    DETALLE_CREATE = "DETALLE_CREATE"
    GARANTIA_CREATE = "GARANTIA_CREATE"
    GARANTIA_UPDATE = "GARANTIA_UPDATE"

    # Pagos
    GEN_INDIVIDUAL = "GEN_INDIVIDUAL"
    GEN_LOTE = "GEN_LOTE"
    MOVIMIENTO = "MOVIMIENTO"
    FACTURA_BONIFICACION = "FACTURA_BONIFICACION"

    # Compras / Stock
    COMPRA_CREATE = "COMPRA_CREATE"
    COMPRA_ANULAR = "COMPRA_ANULAR"
    STOCK_AJUSTE = "STOCK_AJUSTE"
    STOCK_DEVOLUCION = "STOCK_DEVOLUCION"


# Listas canónicas para el visor (filtros). El front las espeja vía /auditoria/tipos.
MODULOS = [
    AuditModulo.AUTH,
    AuditModulo.USUARIOS,
    AuditModulo.CLIENTES,
    AuditModulo.DOMICILIOS,
    AuditModulo.CONTRATOS,
    AuditModulo.INSTALACIONES,
    AuditModulo.PAGOS,
    AuditModulo.PRODUCTOS,
    AuditModulo.PROMOCIONES,
    AuditModulo.PLANES,
    AuditModulo.PRECIOS,
    AuditModulo.PROVEEDORES,
    AuditModulo.COMPRAS,
    AuditModulo.STOCK,
]

ACCIONES = [
    AuditAccion.CREATE,
    AuditAccion.UPDATE,
    AuditAccion.DELETE,
    AuditAccion.ONBOARDING,
    AuditAccion.ACTIVATE,
    AuditAccion.SUSPEND,
    AuditAccion.RESUME,
    AuditAccion.CANCEL,
    AuditAccion.TERMINATE,
    AuditAccion.CHANGE_PLAN,
    AuditAccion.ASSIGN_PROMO,
    AuditAccion.REMOVE_PROMO,
    AuditAccion.CONFIRM_TECH,
    AuditAccion.PROG_CREATE,
    AuditAccion.REPROGRAM,
    AuditAccion.EXECUTE,
    AuditAccion.COMPLETE,
    AuditAccion.FAIL,
    AuditAccion.BAJA,
    AuditAccion.RETRY,
    AuditAccion.DETALLE_CREATE,
    AuditAccion.GARANTIA_CREATE,
    AuditAccion.GARANTIA_UPDATE,
    AuditAccion.GEN_INDIVIDUAL,
    AuditAccion.GEN_LOTE,
    AuditAccion.MOVIMIENTO,
    AuditAccion.FACTURA_BONIFICACION,
    AuditAccion.COMPRA_CREATE,
    AuditAccion.COMPRA_ANULAR,
    AuditAccion.STOCK_AJUSTE,
    AuditAccion.STOCK_DEVOLUCION,
]


@dataclass(frozen=True)
class AuditActor:
    """Quién dispara la acción, capturado en la capa de routes."""

    usuario_id: int | None
    ip_origen: str | None
    user_agent: str | None


class Auditor:
    """Escribe eventos de auditoría ligados a un actor y una conexión.

    Se instancia por request (dependency get_auditor) y se invoca desde el route
    luego de que el service confirma la operación. El INSERT corre en la misma
    transacción: el evento commitea junto con la operación (auditoría atómica).
    """

    def __init__(self, repo: AuditRepository, actor: AuditActor):
        self.repo = repo
        self.actor = actor

    def log(
        self,
        modulo: str,
        accion: str,
        entidad: str | None = None,
        entidad_id: str | int | None = None,
        detalle: str | None = None,
    ) -> None:
        self.repo.insert_event(
            usuario_id=self.actor.usuario_id,
            modulo_auditoria=modulo,
            accion_auditoria=accion,
            entidad_auditoria=entidad,
            entidad_id_auditoria=str(entidad_id) if entidad_id is not None else None,
            detalle_auditoria=detalle,
            ip_origen_auditoria=self.actor.ip_origen,
            user_agent_auditoria=self.actor.user_agent,
        )
