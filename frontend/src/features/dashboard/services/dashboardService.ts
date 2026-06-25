import { http } from '@/services/http'
import type {
  ClientesResumen,
  ContratosResumen,
  InstalacionesResumen,
  PagosResumen,
} from '../types'

// Único consumidor de los endpoints /resumen por dominio.
// La feature dashboard es composición de lectura: no participa de las
// invalidaciones de los dominios, por eso centraliza acá sus llamadas.
export const dashboardService = {
  async clientes(): Promise<ClientesResumen> {
    const { data } = await http.get<ClientesResumen>('/clientes/resumen')
    return data
  },

  async contratos(): Promise<ContratosResumen> {
    const { data } = await http.get<ContratosResumen>('/contratos/resumen')
    return data
  },

  async instalaciones(): Promise<InstalacionesResumen> {
    const { data } = await http.get<InstalacionesResumen>('/instalaciones/resumen')
    return data
  },

  async pagos(): Promise<PagosResumen> {
    const { data } = await http.get<PagosResumen>('/pagos/resumen')
    return data
  },
}
