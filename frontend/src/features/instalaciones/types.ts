// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/instalacion.py y backend/app/routes/instalaciones.py

// ============================================================
// PROGRAMACION
// ============================================================

export interface ProgramacionInstalacionCreate {
  contrato_id: number
  domicilio_id: number
  fecha_programacion_pinstalacion: string
  tecnico_pinstalacion?: string | null
  notas_pinstalacion?: string | null
}

export interface ProgramacionInstalacionOut {
  programacion_id: number
  domicilio_id: number
  contrato_id: number
  fecha_programacion_pinstalacion: string
  estado_programacion_id: number
  tecnico_pinstalacion: string | null
  notas_pinstalacion: string | null
  fecha_creacion_pinstalacion: string
  // Campos opcionales de contexto. Si el backend los expone, los usamos;
  // si no, la UI cae a los ids. Ver programacionDisplayName / utils.
  nombre_contrato?: string | null
  cliente_nombre?: string | null
  cliente_apellido?: string | null
  plan_nombre?: string | null
  domicilio_resumen?: string | null
}

export interface ProgramacionInstalacionListResponse {
  items: ProgramacionInstalacionOut[]
}

export interface ListProgramacionesParams {
  contrato_id?: number
  domicilio_id?: number
  estado_programacion_id?: number
  tecnico_pinstalacion?: string
}

// ============================================================
// REPROGRAMACION
// ============================================================

export interface ReprogramarInstalacionIn {
  fecha_programacion_pinstalacion: string
  tecnico_pinstalacion?: string | null
  notas_pinstalacion?: string | null
  motivo_reprogramacion?: string | null
}

export interface ReprogramacionInstalacionOut {
  reprogramacion_id: number
  programacion_id: number
  fecha_reprogramada_anterior: string | null
  fecha_reprogramada_nueva: string
  tecnico_reprogramacion: string | null
  motivo_reprogramacion: string | null
  notas_reprogramacion: string | null
  fecha_creacion_reprogramacion: string
}

export interface ReprogramacionInstalacionListResponse {
  items: ReprogramacionInstalacionOut[]
}

// ============================================================
// INSTALACION
// ============================================================

export interface InstalacionCreate {
  programacion_id: number
  contrato_id: number
  domicilio_id: number
  codigo_instalacion?: string | null
  observacion_instalacion?: string | null
  fecha_instalacion?: string | null
}

export interface InstalacionOut {
  instalacion_id: number
  programacion_id: number
  contrato_id: number
  domicilio_id: number
  codigo_instalacion: string | null
  fecha_instalacion: string
  estado_instalacion_id: number
  observacion_instalacion: string | null
  fecha_creacion_instalacion: string
  // Campos opcionales de contexto. Si el backend los expone, los usamos;
  // si no, la UI cae a los ids. Ver instalacionDisplayName / utils.
  nombre_contrato?: string | null
  cliente_nombre?: string | null
  cliente_apellido?: string | null
  plan_nombre?: string | null
  domicilio_resumen?: string | null
}

// Corrección de datos de carga (PATCH parcial). No toca el estado ni la
// programación de origen: para eso están las acciones y el reprogramar.
export interface InstalacionUpdate {
  fecha_instalacion?: string
  codigo_instalacion?: string | null
  observacion_instalacion?: string | null
}

export interface InstalacionListResponse {
  items: InstalacionOut[]
}

export interface ListInstalacionesParams {
  contrato_id?: number
  domicilio_id?: number
  estado_instalacion_id?: number
  programacion_id?: number
}

// Respuesta común de transiciones (completar/cancelar/fallar).
export interface InstalacionAccionOut {
  instalacion_id: number
  estado_instalacion_id: number
  contrato_id: number
  estado_contrato_id: number | null
}

// Reintentar NO es una transición: crea una NUEVA programación y
// devuelve esa programación — la instalación original queda en su
// estado terminal (CANCELADA/FALLIDA).
export interface ReintentarInstalacionIn {
  fecha_programacion_pinstalacion: string
  tecnico_pinstalacion?: string | null
  notas_pinstalacion?: string | null
}

// Ejecutar una programación = crear la instalación asociada.
// El backend resuelve contrato/domicilio/programación desde la
// programación — acá sólo van datos operativos.
export interface EjecutarProgramacionIn {
  codigo_instalacion?: string | null
  observacion_instalacion?: string | null
  fecha_instalacion?: string | null
}

// ============================================================
// DETALLE INSTALACION
// ============================================================

export interface DetalleInstalacionCreate {
  producto_id: number
  descripcion_dinstalacion?: string | null
  cantidad_dinstalacion: number
  unidad_dinstalacion: string
  observacion_dinstalacion?: string | null
}

export interface DetalleInstalacionOut {
  det_instalacion_id: number
  instalacion_id: number
  producto_id: number
  descripcion_dinstalacion: string | null
  cantidad_dinstalacion: number
  unidad_dinstalacion: string
  observacion_dinstalacion: string | null
  fecha_creacion_dinstalacion: string
}

export interface DetalleInstalacionListResponse {
  items: DetalleInstalacionOut[]
}

// ============================================================
// GARANTIAS
// Espejo de backend/app/schemas/instalacion.py (GarantiaOut/Create/Update).
// ============================================================

export interface GarantiaOut {
  garantia_id: number
  instalacion_id: number
  contrato_id: number
  producto_id: number
  // Depósito reembolsable entregado por el equipo. Null en garantías
  // cargadas antes de este modelo.
  monto_garantia: number | null
  fecha_inicio_garantia: string
  fecha_fin_garantia: string | null
  estado_garantia_id: number
  motivo_garantia: string | null
  resolucion_garantia: string | null
  fecha_creacion_garantia: string
  // Enriquecido vía join.
  nombre_producto: string | null
  marca_producto: string | null
  modelo_producto: string | null
  descripcion_egarantia: string | null
  cliente_nombre: string | null
  cliente_apellido: string | null
}

export interface GarantiaListResponse {
  items: GarantiaOut[]
}

// El contrato lo deriva el backend; el estado nace ACTIVA.
export interface GarantiaCreate {
  instalacion_id: number
  producto_id: number
  monto_garantia?: number | null
  fecha_inicio_garantia?: string | null
}

// PATCH parcial (exclude_unset). Se usa para anular y para corregir
// datos de carga (monto, fechas, motivo, resolución, estado).
export interface GarantiaUpdate {
  estado_garantia_id?: number
  monto_garantia?: number | null
  fecha_inicio_garantia?: string | null
  fecha_fin_garantia?: string | null
  motivo_garantia?: string | null
  resolucion_garantia?: string | null
}

// Resumen agregado de depósitos (garantías). ACTIVA = comprometido,
// DEVUELTA = devuelto, RETENIDA = retenido.
export interface GarantiasResumen {
  comprometido: number
  cantidad_activas: number
  devuelto: number
  retenido: number
}

export interface ListGarantiasParams {
  instalacion_id?: number
  cliente_id?: number
  contrato_id?: number
  estado_garantia_id?: number
  limit?: number
  offset?: number
}
