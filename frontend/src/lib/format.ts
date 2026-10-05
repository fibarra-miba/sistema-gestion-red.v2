// Formateos transversales del proyecto.
// Locale por defecto es-AR (sistema usado en Argentina).

const currencyARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

export function formatCurrencyARS(value: number | null | undefined): string {
  if (value == null) return '—'
  return currencyARS.format(value)
}

const dateFmt = new Intl.DateTimeFormat('es-AR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateFmt.format(d)
}

const timeFmt = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return timeFmt.format(d)
}

// Input <input type="date"> espera YYYY-MM-DD.
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

// Convierte un YYYY-MM-DD del input a ISO con hora 00:00:00Z.
// El backend acepta datetime; le damos inicio de día UTC por convención.
export function fromDateInputValue(value: string): string {
  return new Date(`${value}T00:00:00Z`).toISOString()
}

// YYYY-MM-DD de HOY en horario LOCAL (no UTC). Usar como default/tope de
// campos "no puede ser futura" — comparar contra la fecha local del
// usuario, no contra el corrimiento de toDateInputValue() (que usa UTC).
export function todayDateInputValue(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Convierte un YYYY-MM-DD del input a ISO al MEDIODÍA LOCAL, con el offset
// horario local explícito en el string (no se normaliza a UTC). Evita que
// una fecha "de hoy" se corra al día anterior/siguiente cuando el backend
// interpreta el datetime en su propia zona horaria — mediodía tiene margen
// de sobra para cualquier offset real. Usar para fechas de negocio nuevas
// (inicio/fin de contrato, fecha de instalación), no para las históricas
// que ya usan fromDateInputValue (medianoche UTC).
// Si la fecha es HOY se manda el instante actual: el mediodía de hoy, antes
// de las 12, es futuro y el backend rechaza fechas futuras.
export function fromDateInputValueLocalNoon(value: string): string {
  if (value === todayDateInputValue()) return new Date().toISOString()
  const [y, m, d] = value.split('-').map(Number)
  const noonLocal = new Date(y, m - 1, d, 12, 0, 0)
  const offsetMin = -noonLocal.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const pad = (n: number) => String(n).padStart(2, '0')
  const offsetH = pad(Math.floor(abs / 60))
  const offsetM = pad(abs % 60)
  return `${y}-${pad(m)}-${pad(d)}T12:00:00${sign}${offsetH}:${offsetM}`
}
