import { http } from '@/services/http'
import type {
  ContractActionResponse,
  ContractAssignPromo,
  ContractChangePlan,
  ContractCommercialListResponse,
  ContractCommercialOut,
  ContractConfirmTechnicalCondition,
  ContractConfirmTechnicalConditionResponse,
  ContractCreate,
  ContractOut,
  ListContratosParams,
} from '../types'

export const contratosService = {
  async list(
    params: ListContratosParams = {},
  ): Promise<ContractCommercialOut[]> {
    const { data } = await http.get<ContractCommercialListResponse>(
      '/contratos',
      { params },
    )
    return data.items
  },

  async get(contratoId: number): Promise<ContractCommercialOut> {
    const { data } = await http.get<ContractCommercialOut>(
      `/contratos/${contratoId}`,
    )
    return data
  },

  async create(payload: ContractCreate): Promise<ContractOut> {
    const { data } = await http.post<ContractOut>('/contratos', payload)
    return data
  },

  async activate(contratoId: number): Promise<ContractActionResponse> {
    const { data } = await http.post<ContractActionResponse>(
      `/contratos/${contratoId}/activate`,
    )
    return data
  },

  async suspend(contratoId: number): Promise<ContractActionResponse> {
    const { data } = await http.post<ContractActionResponse>(
      `/contratos/${contratoId}/suspend`,
    )
    return data
  },

  async resume(contratoId: number): Promise<ContractActionResponse> {
    const { data } = await http.post<ContractActionResponse>(
      `/contratos/${contratoId}/resume`,
    )
    return data
  },

  async cancel(contratoId: number): Promise<ContractActionResponse> {
    const { data } = await http.post<ContractActionResponse>(
      `/contratos/${contratoId}/cancel`,
    )
    return data
  },

  async terminate(contratoId: number): Promise<ContractActionResponse> {
    const { data } = await http.post<ContractActionResponse>(
      `/contratos/${contratoId}/terminate`,
    )
    return data
  },

  // change-plan NO muta el contrato existente: cierra el original y
  // crea uno nuevo con el nuevo plan. Devuelve el contrato nuevo (raw).
  async changePlan(
    contratoId: number,
    payload: ContractChangePlan,
  ): Promise<ContractOut> {
    const { data } = await http.post<ContractOut>(
      `/contratos/${contratoId}/change-plan`,
      payload,
    )
    return data
  },

  async asignarPromocion(
    contratoId: number,
    payload: ContractAssignPromo,
  ): Promise<ContractOut> {
    const { data } = await http.post<ContractOut>(
      `/contratos/${contratoId}/asignar-promocion`,
      payload,
    )
    return data
  },

  async quitarPromocion(contratoId: number): Promise<ContractOut> {
    const { data } = await http.post<ContractOut>(
      `/contratos/${contratoId}/quitar-promocion`,
    )
    return data
  },

  async confirmarCondicionTecnica(
    contratoId: number,
    payload: ContractConfirmTechnicalCondition,
  ): Promise<ContractConfirmTechnicalConditionResponse> {
    const { data } = await http.post<ContractConfirmTechnicalConditionResponse>(
      `/contratos/${contratoId}/confirmar-condicion-tecnica`,
      payload,
    )
    return data
  },
}
