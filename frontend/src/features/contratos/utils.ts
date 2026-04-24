import type { ContractCommercialOut } from './types'

// Nombre visible del contrato.
//  - Si el backend manda `nombre_contrato`, ese es el label del negocio.
//  - Si no, derivamos algo más útil que "Contrato #3": usamos el plan y
//    el apellido del cliente como identificación comercial.
// El #id sigue vivo como referencia técnica (caption/tooltip).
export function contratoDisplayName(c: ContractCommercialOut): string {
  if (c.nombre_contrato && c.nombre_contrato.trim()) {
    return c.nombre_contrato.trim()
  }
  const cliente = [c.cliente_apellido, c.cliente_nombre]
    .filter(Boolean)
    .join(', ')
  if (c.plan_nombre && cliente) return `${c.plan_nombre} · ${cliente}`
  if (c.plan_nombre) return c.plan_nombre
  if (cliente) return cliente
  return `Contrato #${c.contrato_id}`
}

// IDs de estado_contrato. Fuente: backend/test/sql/010_seed.sql.
// El orden del seed es la fuente de verdad de los ids.
export const ESTADO_CONTRATO = {
  BORRADOR: 1,
  PENDIENTE_INSTALACION: 2,
  ACTIVO: 3,
  SUSPENDIDO: 4,
  BAJA: 5,
  CANCELADO: 6,
} as const

export type EstadoContratoId =
  (typeof ESTADO_CONTRATO)[keyof typeof ESTADO_CONTRATO]

export const ESTADO_CONTRATO_OPTIONS: { id: EstadoContratoId; label: string }[] = [
  { id: ESTADO_CONTRATO.BORRADOR, label: 'Borrador' },
  { id: ESTADO_CONTRATO.PENDIENTE_INSTALACION, label: 'Pendiente de instalación' },
  { id: ESTADO_CONTRATO.ACTIVO, label: 'Activo' },
  { id: ESTADO_CONTRATO.SUSPENDIDO, label: 'Suspendido' },
  { id: ESTADO_CONTRATO.BAJA, label: 'Baja' },
  { id: ESTADO_CONTRATO.CANCELADO, label: 'Cancelado' },
]

// Color MUI por estado — mantener consistente entre chip, tabla y detalle.
export function estadoContratoColor(
  estadoId: number,
): 'default' | 'success' | 'warning' | 'info' | 'error' {
  switch (estadoId) {
    case ESTADO_CONTRATO.ACTIVO:
      return 'success'
    case ESTADO_CONTRATO.SUSPENDIDO:
      return 'warning'
    case ESTADO_CONTRATO.PENDIENTE_INSTALACION:
    case ESTADO_CONTRATO.BORRADOR:
      return 'info'
    case ESTADO_CONTRATO.BAJA:
    case ESTADO_CONTRATO.CANCELADO:
      return 'error'
    default:
      return 'default'
  }
}

// Matriz de acciones permitidas por estado. Fuente:
// CLAUDE.md §7 + prompt (reglas de negocio obligatorias).
// Si el backend rechaza igual lo mostramos como error, pero la UI
// no debe ofrecer acciones inválidas.
export interface ContratoActionFlags {
  canActivate: boolean
  canSuspend: boolean
  canResume: boolean
  canTerminate: boolean  // baja
  canCancel: boolean
  canChangePlan: boolean
  canConfirmarTecnica: boolean
}

export function contratoActions(estadoId: number): ContratoActionFlags {
  switch (estadoId) {
    case ESTADO_CONTRATO.BORRADOR:
      return {
        canActivate: true,
        canSuspend: false,
        canResume: false,
        canTerminate: false,
        canCancel: true,
        canChangePlan: false,
        canConfirmarTecnica: true,
      }
    case ESTADO_CONTRATO.PENDIENTE_INSTALACION:
      return {
        canActivate: true,
        canSuspend: false,
        canResume: false,
        canTerminate: false,
        canCancel: true,
        canChangePlan: false,
        canConfirmarTecnica: true,
      }
    case ESTADO_CONTRATO.ACTIVO:
      return {
        canActivate: false,
        canSuspend: true,
        canResume: false,
        canTerminate: true,
        canCancel: false,
        canChangePlan: true,
        canConfirmarTecnica: false,
      }
    case ESTADO_CONTRATO.SUSPENDIDO:
      return {
        canActivate: false,
        canSuspend: false,
        canResume: true,
        canTerminate: true,
        canCancel: false,
        canChangePlan: false,
        canConfirmarTecnica: false,
      }
    default:
      // BAJA / CANCELADO: estados terminales
      return {
        canActivate: false,
        canSuspend: false,
        canResume: false,
        canTerminate: false,
        canCancel: false,
        canChangePlan: false,
        canConfirmarTecnica: false,
      }
  }
}
