import type {
  EstadoCuenta,
  EstadoPago,
  TipoMovimientoCuenta,
} from './types'

export const ESTADO_PAGO_OPTIONS: { value: EstadoPago; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'PAGADO', label: 'Pagado' },
]

export function estadoPagoColor(
  estado: EstadoPago,
): 'default' | 'success' | 'warning' | 'error' {
  switch (estado) {
    case 'PAGADO':
      return 'success'
    case 'PARCIAL':
      return 'warning'
    case 'PENDIENTE':
      return 'error'
    default:
      return 'default'
  }
}

export function estadoPagoLabel(estado: EstadoPago): string {
  switch (estado) {
    case 'PAGADO':
      return 'Pagado'
    case 'PARCIAL':
      return 'Parcial'
    case 'PENDIENTE':
      return 'Pendiente'
    default:
      return estado
  }
}

export function estadoCuentaColor(
  estado: EstadoCuenta,
): 'default' | 'success' | 'warning' | 'info' {
  switch (estado) {
    case 'AL_DIA':
      return 'success'
    case 'DEUDOR':
      return 'warning'
    case 'SALDO_A_FAVOR':
      return 'info'
    default:
      return 'default'
  }
}

export function estadoCuentaLabel(estado: EstadoCuenta): string {
  switch (estado) {
    case 'AL_DIA':
      return 'Al día'
    case 'DEUDOR':
      return 'Con deuda'
    case 'SALDO_A_FAVOR':
      return 'Saldo a favor'
    default:
      return estado
  }
}

export const TIPO_MOV_CUENTA_OPTIONS: {
  value: TipoMovimientoCuenta
  label: string
}[] = [
  { value: 'FACTURA', label: 'Factura' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'AJUSTE_D', label: 'Ajuste débito' },
  { value: 'AJUSTE_H', label: 'Ajuste haber' },
]

export function tipoMovLabel(tipo: TipoMovimientoCuenta): string {
  const opt = TIPO_MOV_CUENTA_OPTIONS.find((o) => o.value === tipo)
  return opt?.label ?? tipo
}

// Convierte (anio, mes) a etiqueta "MM/YYYY".
export function formatPeriodo(anio: number, mes: number): string {
  return `${String(mes).padStart(2, '0')}/${anio}`
}

// Formato ISO datetime para inputs <input type="datetime-local">.
// El input devuelve "YYYY-MM-DDTHH:mm" sin timezone; lo convertimos
// a ISO UTC para enviarlo al backend.
export function datetimeLocalToIso(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  // Ajuste por timezone local para que datetime-local refleje hora local.
  const offsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}
