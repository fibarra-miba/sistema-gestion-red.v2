import type { PrecioPlanOut } from './types'

// Convención acordada con backend: estado_plan_id === 1 ⇒ activo.
// No existe catálogo /catalogos/estados-plan todavía; cuando se agregue,
// reemplazar esta función por lookup contra ese catálogo.
export const ESTADO_PLAN_ACTIVO = 1
export const ESTADO_PLAN_INACTIVO = 2

export function isPlanActivo(estadoPlanId: number): boolean {
  return estadoPlanId === ESTADO_PLAN_ACTIVO
}

// Regla de dominio (definida por backend):
// un precio es vigente si fecha_desde <= ahora AND (fecha_hasta es NULL o ahora <= fecha_hasta)
// Se deriva desde fechas para marcar la fila en el historial —
// no reemplaza el `precio_vigente` que calcula el backend a nivel plan.
export function isPrecioVigente(
  precio: PrecioPlanOut,
  now: Date = new Date(),
): boolean {
  const desde = new Date(precio.fecha_desde_pplanes).getTime()
  if (Number.isNaN(desde) || desde > now.getTime()) return false
  if (!precio.fecha_hasta_pplanes) return true
  const hasta = new Date(precio.fecha_hasta_pplanes).getTime()
  if (Number.isNaN(hasta)) return true
  return now.getTime() <= hasta
}

// Estado temporal de un precio. Usado para decidir qué acciones habilitar:
// solo los FUTUROS pueden editarse. Vigentes e históricos son inmutables
// (regla del backend: se corrigen con un registro nuevo, no con UPDATE).
export type PrecioEstado = 'historico' | 'vigente' | 'futuro'

export function getPrecioEstado(
  precio: PrecioPlanOut,
  now: Date = new Date(),
): PrecioEstado {
  const desde = new Date(precio.fecha_desde_pplanes).getTime()
  if (!Number.isNaN(desde) && desde > now.getTime()) return 'futuro'
  if (isPrecioVigente(precio, now)) return 'vigente'
  return 'historico'
}

export function isPrecioEditable(
  precio: PrecioPlanOut,
  now: Date = new Date(),
): boolean {
  return getPrecioEstado(precio, now) === 'futuro'
}
