// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/cliente.py y backend/app/schemas/domicilio.py

// ============================================================
// CLIENTES
// ============================================================

// Contrato asimétrico del backend:
// - GET devuelve las columnas sufijadas con `_cliente` (para desambiguar
//   entre tablas; p. ej. `nombre_cliente` vs `nombre_plan`).
// - POST/PUT aceptan nombres limpios (sin sufijo).
// No uniformar aquí: respetar exactamente lo que expone el backend.
export interface ClienteOut {
  cliente_id: number
  nombre_cliente: string
  apellido_cliente: string
  dni_cliente: string
  telefono_cliente: string
  email_cliente: string | null
  fecha_alta_cliente: string | null
  estado_cliente_id: number
  observacion_cliente: string | null
}

export interface ClienteCreate {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email?: string | null
  estado_cliente_id: number
  observaciones?: string | null
}

export interface ClienteUpdate {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email?: string | null
  observaciones?: string | null
}

export interface ListClientesParams {
  limit?: number
  offset?: number
  search?: string
}

// ============================================================
// DOMICILIOS
// ============================================================

export interface DomicilioOut {
  domicilio_id: number
  cliente_id: number
  complejo: string | null
  piso: number | null
  depto: string | null
  calle: string | null
  numero: number | null
  referencias: string | null
  fecha_desde_dom: string
  fecha_hasta_dom: string | null
  estado_domicilio_id: number
}

// Usar SIEMPRE estado_domicilio_id. El backend acepta el alias
// estado_domicilio por compatibilidad con tests, pero no lo usamos.
export interface DomicilioCreate {
  complejo?: string | null
  piso?: number | null
  depto?: string | null
  calle?: string | null
  numero?: number | null
  referencias?: string | null
  fecha_desde_dom?: string | null
  fecha_hasta_dom?: string | null
  estado_domicilio_id: number
}
