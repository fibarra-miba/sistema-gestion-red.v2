import type { InstalacionOut, ProgramacionInstalacionOut } from './types'

// IDs de estado. Fuente: backend/test/sql/010_seed.sql.
// El orden del seed es la fuente de verdad.

export const ESTADO_INSTALACION = {
  PENDIENTE: 1,
  COMPLETADA: 2,
  CANCELADA: 3,
  FALLIDA: 4,
} as const

export type EstadoInstalacionId =
  (typeof ESTADO_INSTALACION)[keyof typeof ESTADO_INSTALACION]

export const ESTADO_INSTALACION_OPTIONS: {
  id: EstadoInstalacionId
  label: string
}[] = [
  { id: ESTADO_INSTALACION.PENDIENTE, label: 'Pendiente' },
  { id: ESTADO_INSTALACION.COMPLETADA, label: 'Completada' },
  { id: ESTADO_INSTALACION.CANCELADA, label: 'Cancelada' },
  { id: ESTADO_INSTALACION.FALLIDA, label: 'Fallida' },
]

export function estadoInstalacionLabel(estadoId: number): string {
  return (
    ESTADO_INSTALACION_OPTIONS.find((o) => o.id === estadoId)?.label ??
    `Estado #${estadoId}`
  )
}

export function estadoInstalacionColor(
  estadoId: number,
): 'default' | 'success' | 'warning' | 'info' | 'error' {
  switch (estadoId) {
    case ESTADO_INSTALACION.COMPLETADA:
      return 'success'
    case ESTADO_INSTALACION.PENDIENTE:
      return 'info'
    case ESTADO_INSTALACION.CANCELADA:
      return 'default'
    case ESTADO_INSTALACION.FALLIDA:
      return 'error'
    default:
      return 'default'
  }
}

export const ESTADO_PROGRAMACION = {
  PROGRAMADA: 1,
  COMPLETADA: 2,
  CANCELADA: 3,
  FALLIDA: 4,
} as const

export type EstadoProgramacionId =
  (typeof ESTADO_PROGRAMACION)[keyof typeof ESTADO_PROGRAMACION]

export const ESTADO_PROGRAMACION_OPTIONS: {
  id: EstadoProgramacionId
  label: string
}[] = [
  { id: ESTADO_PROGRAMACION.PROGRAMADA, label: 'Programada' },
  { id: ESTADO_PROGRAMACION.COMPLETADA, label: 'Completada' },
  { id: ESTADO_PROGRAMACION.CANCELADA, label: 'Cancelada' },
  { id: ESTADO_PROGRAMACION.FALLIDA, label: 'Fallida' },
]

export function estadoProgramacionLabel(estadoId: number): string {
  return (
    ESTADO_PROGRAMACION_OPTIONS.find((o) => o.id === estadoId)?.label ??
    `Estado #${estadoId}`
  )
}

export function estadoProgramacionColor(
  estadoId: number,
): 'default' | 'success' | 'warning' | 'info' | 'error' {
  switch (estadoId) {
    case ESTADO_PROGRAMACION.PROGRAMADA:
      return 'info'
    case ESTADO_PROGRAMACION.COMPLETADA:
      return 'success'
    case ESTADO_PROGRAMACION.CANCELADA:
      return 'default'
    case ESTADO_PROGRAMACION.FALLIDA:
      return 'error'
    default:
      return 'default'
  }
}

// Matriz de acciones permitidas por estado de instalación.
// Reglas duras (no modificar — vienen del backend):
//  - completar / cancelar / fallar → sólo si PENDIENTE.
//  - reintentar → sólo si CANCELADA o FALLIDA (crea NUEVA programación).
//  - darBaja → sólo si COMPLETADA (devuelve el contrato a PENDIENTE_INSTALACION).
export interface InstalacionActionFlags {
  canCompletar: boolean
  canCancelar: boolean
  canFallar: boolean
  canReintentar: boolean
  canDarBaja: boolean
}

export function instalacionActions(
  estadoId: number,
): InstalacionActionFlags {
  switch (estadoId) {
    case ESTADO_INSTALACION.PENDIENTE:
      return {
        canCompletar: true,
        canCancelar: true,
        canFallar: true,
        canReintentar: false,
        canDarBaja: false,
      }
    case ESTADO_INSTALACION.CANCELADA:
    case ESTADO_INSTALACION.FALLIDA:
      return {
        canCompletar: false,
        canCancelar: false,
        canFallar: false,
        canReintentar: true,
        canDarBaja: false,
      }
    case ESTADO_INSTALACION.COMPLETADA:
      // Desde una instalación COMPLETADA se puede dar de baja la
      // instalación; el backend devuelve el contrato a
      // PENDIENTE_INSTALACION para permitir una nueva programación.
      return {
        canCompletar: false,
        canCancelar: false,
        canFallar: false,
        canReintentar: false,
        canDarBaja: true,
      }
    default:
      return {
        canCompletar: false,
        canCancelar: false,
        canFallar: false,
        canReintentar: false,
        canDarBaja: false,
      }
  }
}

// Formato compacto para mostrar fecha + hora local (la programación
// incluye hora, la instalación también). No usar formatDate() aquí,
// pierde la hora.
const dateTimeFmt = new Intl.DateTimeFormat('es-AR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateTimeFmt.format(d)
}

// Convierte ISO → valor para <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
export function toDateTimeInputValue(
  iso: string | null | undefined,
): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Convierte un datetime-local (sin tz) a ISO UTC.
export function fromDateTimeInputValue(value: string): string {
  // `new Date('YYYY-MM-DDTHH:mm')` lo interpreta como hora local — correcto.
  return new Date(value).toISOString()
}

// Labels ricos para instalación / programación. Si el backend envía
// datos de contexto (nombre_contrato, plan, cliente, domicilio),
// los usamos; si no, se cae a ids con prefijos legibles. Esto deja
// la UI lista para cuando el backend enriquezca la respuesta, sin
// romper el display actual.

function clienteLabel(apellido?: string | null, nombre?: string | null): string {
  return [apellido, nombre].filter(Boolean).join(', ')
}

export function contratoLabelFromFields(fields: {
  contrato_id: number
  nombre_contrato?: string | null
  plan_nombre?: string | null
  cliente_apellido?: string | null
  cliente_nombre?: string | null
}): string {
  if (fields.nombre_contrato && fields.nombre_contrato.trim()) {
    return fields.nombre_contrato.trim()
  }
  const cliente = clienteLabel(fields.cliente_apellido, fields.cliente_nombre)
  if (fields.plan_nombre && cliente) return `${fields.plan_nombre} · ${cliente}`
  if (fields.plan_nombre) return fields.plan_nombre
  if (cliente) return cliente
  return `Contrato #${fields.contrato_id}`
}

export function domicilioLabelFromFields(
  domicilioId: number,
  resumen?: string | null,
): string {
  if (resumen && resumen.trim()) return resumen.trim()
  return `Domicilio #${domicilioId}`
}

export function instalacionContratoLabel(i: InstalacionOut): string {
  return contratoLabelFromFields(i)
}

export function instalacionDomicilioLabel(i: InstalacionOut): string {
  return domicilioLabelFromFields(i.domicilio_id, i.domicilio_resumen)
}

export function programacionContratoLabel(p: ProgramacionInstalacionOut): string {
  return contratoLabelFromFields(p)
}

export function programacionDomicilioLabel(
  p: ProgramacionInstalacionOut,
): string {
  return domicilioLabelFromFields(p.domicilio_id, p.domicilio_resumen)
}
