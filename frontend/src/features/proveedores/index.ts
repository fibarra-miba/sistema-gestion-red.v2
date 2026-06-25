export * from './types'
export { proveedoresKeys } from './keys'
export { proveedoresService } from './services/proveedoresService'

export { useProveedores } from './hooks/useProveedores'
export { useCreateProveedor } from './hooks/useCreateProveedor'
export { useUpdateProveedor } from './hooks/useUpdateProveedor'

export { default as ProveedorTable } from './components/ProveedorTable'
export { default as ProveedoresFilterBar } from './components/ProveedoresFilterBar'
export { default as ProveedorForm } from './components/ProveedorForm'
export type { ProveedorFormValues } from './components/ProveedorForm'
