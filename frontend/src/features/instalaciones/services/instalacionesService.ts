import { http } from '@/services/http'
import type {
  DetalleInstalacionCreate,
  DetalleInstalacionListResponse,
  DetalleInstalacionOut,
  EjecutarProgramacionIn,
  GarantiaCreate,
  GarantiaListResponse,
  GarantiaOut,
  GarantiaUpdate,
  InstalacionAccionOut,
  InstalacionCreate,
  InstalacionListResponse,
  InstalacionOut,
  ListGarantiasParams,
  ListInstalacionesParams,
  ListProgramacionesParams,
  ProgramacionInstalacionCreate,
  ProgramacionInstalacionListResponse,
  ProgramacionInstalacionOut,
  ReintentarInstalacionIn,
  ReprogramacionInstalacionListResponse,
  ReprogramacionInstalacionOut,
  ReprogramarInstalacionIn,
} from '../types'

export const instalacionesService = {
  // ----- Instalaciones -----
  async list(
    params: ListInstalacionesParams = {},
  ): Promise<InstalacionOut[]> {
    const { data } = await http.get<InstalacionListResponse>('/instalaciones', {
      params,
    })
    return data.items
  },

  async get(instalacionId: number): Promise<InstalacionOut> {
    const { data } = await http.get<InstalacionOut>(
      `/instalaciones/${instalacionId}`,
    )
    return data
  },

  async create(payload: InstalacionCreate): Promise<InstalacionOut> {
    const { data } = await http.post<InstalacionOut>('/instalaciones', payload)
    return data
  },

  async completar(instalacionId: number): Promise<InstalacionAccionOut> {
    const { data } = await http.post<InstalacionAccionOut>(
      `/instalaciones/${instalacionId}/completar`,
    )
    return data
  },

  async cancelar(instalacionId: number): Promise<InstalacionAccionOut> {
    const { data } = await http.post<InstalacionAccionOut>(
      `/instalaciones/${instalacionId}/cancelar`,
    )
    return data
  },

  async fallar(instalacionId: number): Promise<InstalacionAccionOut> {
    const { data } = await http.post<InstalacionAccionOut>(
      `/instalaciones/${instalacionId}/fallar`,
    )
    return data
  },

  // Baja de una instalación COMPLETADA → el backend devuelve el
  // contrato a PENDIENTE_INSTALACION para permitir rehacerla.
  async darBaja(instalacionId: number): Promise<InstalacionAccionOut> {
    const { data } = await http.post<InstalacionAccionOut>(
      `/instalaciones/${instalacionId}/dar-baja`,
    )
    return data
  },

  // Devuelve la NUEVA programación creada por el reintento.
  async reintentar(
    instalacionId: number,
    payload: ReintentarInstalacionIn,
  ): Promise<ProgramacionInstalacionOut> {
    const { data } = await http.post<ProgramacionInstalacionOut>(
      `/instalaciones/${instalacionId}/reintentar`,
      payload,
    )
    return data
  },

  // ----- Detalles (materiales) -----
  async listDetalles(
    instalacionId: number,
  ): Promise<DetalleInstalacionOut[]> {
    const { data } = await http.get<DetalleInstalacionListResponse>(
      `/instalaciones/${instalacionId}/detalles`,
    )
    return data.items
  },

  async createDetalle(
    instalacionId: number,
    payload: DetalleInstalacionCreate,
  ): Promise<DetalleInstalacionOut> {
    const { data } = await http.post<DetalleInstalacionOut>(
      `/instalaciones/${instalacionId}/detalles`,
      payload,
    )
    return data
  },

  // ----- Garantías -----
  async listGarantias(
    params: ListGarantiasParams = {},
  ): Promise<GarantiaOut[]> {
    const { data } = await http.get<GarantiaListResponse>(
      '/instalaciones/garantias',
      { params },
    )
    return data.items
  },

  async createGarantia(payload: GarantiaCreate): Promise<GarantiaOut> {
    const { data } = await http.post<GarantiaOut>(
      '/instalaciones/garantias',
      payload,
    )
    return data
  },

  async updateGarantia(
    garantiaId: number,
    payload: GarantiaUpdate,
  ): Promise<GarantiaOut> {
    const { data } = await http.patch<GarantiaOut>(
      `/instalaciones/garantias/${garantiaId}`,
      payload,
    )
    return data
  },

  // ----- Programaciones -----
  async listProgramaciones(
    params: ListProgramacionesParams = {},
  ): Promise<ProgramacionInstalacionOut[]> {
    const { data } = await http.get<ProgramacionInstalacionListResponse>(
      '/instalaciones/programaciones-instalacion',
      { params },
    )
    return data.items
  },

  async getProgramacion(
    programacionId: number,
  ): Promise<ProgramacionInstalacionOut> {
    const { data } = await http.get<ProgramacionInstalacionOut>(
      `/instalaciones/programaciones-instalacion/${programacionId}`,
    )
    return data
  },

  async createProgramacion(
    payload: ProgramacionInstalacionCreate,
  ): Promise<ProgramacionInstalacionOut> {
    const { data } = await http.post<ProgramacionInstalacionOut>(
      '/instalaciones/programaciones-instalacion',
      payload,
    )
    return data
  },

  async reprogramar(
    programacionId: number,
    payload: ReprogramarInstalacionIn,
  ): Promise<ReprogramacionInstalacionOut> {
    const { data } = await http.post<ReprogramacionInstalacionOut>(
      `/instalaciones/programaciones-instalacion/${programacionId}/reprogramar`,
      payload,
    )
    return data
  },

  // Ejecuta una programación → crea la instalación asociada.
  // El backend resuelve contrato/domicilio/programación desde la
  // programación; sólo enviamos datos operativos.
  async ejecutarProgramacion(
    programacionId: number,
    payload: EjecutarProgramacionIn,
  ): Promise<InstalacionOut> {
    const { data } = await http.post<InstalacionOut>(
      `/instalaciones/programaciones-instalacion/${programacionId}/ejecutar`,
      payload,
    )
    return data
  },

  async listReprogramaciones(
    programacionId: number,
  ): Promise<ReprogramacionInstalacionOut[]> {
    const { data } = await http.get<ReprogramacionInstalacionListResponse>(
      `/instalaciones/programaciones-instalacion/${programacionId}/reprogramaciones`,
    )
    return data.items
  },
}
