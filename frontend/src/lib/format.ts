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
