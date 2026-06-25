import { http } from '@/services/http'
import type { CatalogoItemOut } from '../types'

export const catalogosService = {
  async mediosPagos(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/medios-pagos')
    return data
  },

  async tiposPromo(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/tipos-promo')
    return data
  },

  async tiposPago(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/tipos-pago')
    return data
  },

  async estadosPago(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/estados-pago')
    return data
  },

  async tiposProducto(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/tipos-producto')
    return data
  },

  async estadosGarantia(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/estados-garantia')
    return data
  },

  async estadosProveedor(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/estados-proveedor')
    return data
  },

  async tiposMovimientoStock(): Promise<CatalogoItemOut[]> {
    const { data } = await http.get<CatalogoItemOut[]>('/catalogos/tipos-movimiento-stock')
    return data
  },
}
