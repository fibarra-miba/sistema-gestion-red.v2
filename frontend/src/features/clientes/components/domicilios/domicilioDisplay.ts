import type { DomicilioOut } from '../../types'

// Armado de la línea principal de un domicilio para mostrar en UI.
// Prioriza calle + número, si no hay cae en complejo.
export function formatDomicilioLine(d: DomicilioOut): string {
  const parts: string[] = []
  if (d.calle) parts.push(d.numero != null ? `${d.calle} ${d.numero}` : d.calle)
  if (d.complejo) parts.push(d.complejo)
  if (d.torre) parts.push(`Torre ${d.torre}`)
  if (d.piso != null) parts.push(`Piso ${d.piso}`)
  if (d.depto) parts.push(`Dto. ${d.depto}`)
  return parts.length ? parts.join(' · ') : 'Domicilio sin datos de ubicación'
}

export function formatFechaCorta(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

export function isVigente(d: DomicilioOut): boolean {
  return d.fecha_hasta_dom === null
}
