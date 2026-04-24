import {
  Autocomplete,
  TextField,
  type AutocompleteProps,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { usePlanes } from '../hooks/usePlanes'
import { isPlanActivo } from '../utils'
import type { PlanOut } from '../types'

// Select reutilizable para elegir un plan. Lo consume contratos
// (crear contrato, cambiar plan). La fuente de verdad es usePlanes —
// no duplicar este fetch en otros módulos.

interface PlanSelectProps {
  value: number | null
  onChange: (planId: number | null, plan: PlanOut | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  // Por defecto se filtran planes inactivos. Para vistas administrativas
  // que necesiten mostrar todos, pasar false.
  onlyActive?: boolean
  size?: AutocompleteProps<PlanOut, false, false, false>['size']
  fullWidth?: boolean
}

export default function PlanSelect({
  value,
  onChange,
  label = 'Plan',
  required,
  disabled,
  error,
  helperText,
  onlyActive = true,
  size,
  fullWidth = true,
}: PlanSelectProps) {
  const { data, isLoading, error: queryError } = usePlanes()

  const options = (data ?? []).filter((p) =>
    onlyActive ? isPlanActivo(p.estado_plan_id) : true,
  )

  const selected = options.find((p) => p.plan_id === value) ?? null

  const queryErrorMsg = queryError
    ? isApiError(queryError)
      ? queryError.detail
      : 'Error al cargar planes.'
    : null

  return (
    <Autocomplete<PlanOut, false, false, false>
      options={options}
      value={selected}
      onChange={(_, option) => onChange(option?.plan_id ?? null, option ?? null)}
      getOptionLabel={(p) => `${p.nombre_plan} (${p.velocidad_mbps_plan} Mbps)`}
      isOptionEqualToValue={(a, b) => a.plan_id === b.plan_id}
      loading={isLoading}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      noOptionsText={
        queryErrorMsg ?? (onlyActive ? 'Sin planes activos.' : 'Sin planes.')
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error || !!queryErrorMsg}
          helperText={queryErrorMsg ?? helperText}
        />
      )}
    />
  )
}
