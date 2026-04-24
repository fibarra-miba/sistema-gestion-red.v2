import {
  Autocomplete,
  TextField,
  type AutocompleteProps,
} from '@mui/material'
import { isApiError } from '@/types/api'
import {
  useContratos,
  contratoDisplayName,
  type ContractCommercialOut,
} from '@/features/contratos'

// Select de contrato apoyado en GET /contratos (sin filtros — el backend
// devuelve todos). Si el listado crece, se puede sumar filtros.

interface Props {
  value: number | null
  onChange: (
    contratoId: number | null,
    contrato: ContractCommercialOut | null,
  ) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  size?: AutocompleteProps<
    ContractCommercialOut,
    false,
    false,
    false
  >['size']
  fullWidth?: boolean
  // Solo contratos ACTIVOS / SUSPENDIDOS son cobrables. Si el caller
  // quiere filtrar, lo recibe vía este prop.
  estadoContratoId?: number
}

export default function ContratoSelect({
  value,
  onChange,
  label = 'Contrato',
  required,
  disabled,
  error,
  helperText,
  size,
  fullWidth = true,
  estadoContratoId,
}: Props) {
  const { data, isLoading, error: queryError } = useContratos(
    estadoContratoId != null ? { estado_contrato_id: estadoContratoId } : {},
  )

  const options = data ?? []
  const selected = options.find((c) => c.contrato_id === value) ?? null

  const queryErrorMsg = queryError
    ? isApiError(queryError)
      ? queryError.detail
      : 'Error al cargar contratos.'
    : null

  return (
    <Autocomplete<ContractCommercialOut, false, false, false>
      options={options}
      value={selected}
      onChange={(_, option) =>
        onChange(option?.contrato_id ?? null, option ?? null)
      }
      getOptionLabel={(c) => `#${c.contrato_id} · ${contratoDisplayName(c)}`}
      isOptionEqualToValue={(a, b) => a.contrato_id === b.contrato_id}
      loading={isLoading}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      noOptionsText={queryErrorMsg ?? 'Sin contratos.'}
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
