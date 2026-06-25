// Espejo exacto del JSON que exponen los endpoints /resumen del backend.
// Fuente: backend/app/schemas/{cliente,contrato,instalacion,pago}.py

export interface ClientesResumen {
  total: number
  activos: number
  inactivos: number
}

export interface ContratosResumen {
  total: number
  // Claves = descripciones del catálogo estado_contrato (ACTIVO, SUSPENDIDO, ...).
  por_estado: Record<string, number>
}

export interface InstalacionAgendaItem {
  programacion_id: number
  contrato_id: number
  fecha_programacion: string
  tecnico: string | null
  nombre_cliente: string
  apellido_cliente: string
}

export interface InstalacionesResumen {
  pendientes: number
  fallidas: number
  programadas_hoy: number
  agenda_hoy: InstalacionAgendaItem[]
}

export interface TopMorosoItem {
  cliente_id: number
  nombre_cliente: string
  apellido_cliente: string
  saldo_cuenta: number
}

export interface PagosResumen {
  deudores_count: number
  monto_adeudado: number
  facturado_mes: number
  pagos_pendientes_mes: number
  pagos_parciales_mes: number
  top_morosos: TopMorosoItem[]
}
