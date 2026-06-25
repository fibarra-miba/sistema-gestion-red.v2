import { Controller, useFieldArray, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { isApiError } from '@/types/api'
import { formatCurrencyARS } from '@/lib/format'
import { ProductoSelect } from '@/features/productos'
import { useProveedores } from '@/features/proveedores'
import type { CompraCreate } from '../types'
import PresentacionField from './PresentacionField'

interface LineValues {
  producto_id: number | null
  presentacion_id: number | null
  cantidad_presentacion: string
  costo_presentacion: string
}

export interface CompraFormValues {
  proveedor_id: string
  codigo_fcompras: string
  descripcion_fcompras: string
  detalles: LineValues[]
}

const EMPTY_LINE: LineValues = {
  producto_id: null,
  presentacion_id: null,
  cantidad_presentacion: '',
  costo_presentacion: '',
}

interface Props {
  onSubmit: (payload: CompraCreate) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: unknown
}

export default function CompraForm({ onSubmit, onCancel, loading, error }: Props) {
  const { data: proveedores } = useProveedores({ limit: 200 })

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompraFormValues>({
    defaultValues: {
      proveedor_id: '',
      codigo_fcompras: '',
      descripcion_fcompras: '',
      detalles: [{ ...EMPTY_LINE }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' })
  const detalles = watch('detalles')

  const total = (detalles ?? []).reduce((acc, l) => {
    const cant = Number(l.cantidad_presentacion)
    const costo = Number(l.costo_presentacion)
    if (cant > 0 && costo >= 0) return acc + cant * costo
    return acc
  }, 0)

  const errorMsg = resolveErrorMessage(error)

  const submit = async (values: CompraFormValues) => {
    const lineas = values.detalles
      .filter((l) => l.producto_id != null && Number(l.cantidad_presentacion) > 0)
      .map((l) => ({
        producto_id: l.producto_id as number,
        presentacion_id: l.presentacion_id ?? null,
        cantidad_presentacion: Number(l.cantidad_presentacion),
        costo_presentacion: Number(l.costo_presentacion),
      }))

    if (lineas.length === 0) return

    await onSubmit({
      proveedor_id: Number(values.proveedor_id),
      codigo_fcompras: values.codigo_fcompras.trim() || null,
      descripcion_fcompras: values.descripcion_fcompras.trim() || null,
      detalles: lineas,
    })
  }

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      <Stack spacing={2}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <Controller
            control={control}
            name="proveedor_id"
            rules={{ required: 'Proveedor requerido' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Proveedor"
                required
                error={!!errors.proveedor_id}
                helperText={errors.proveedor_id?.message}
              >
                {(proveedores ?? []).map((p) => (
                  <MenuItem key={p.proveedor_id} value={String(p.proveedor_id)}>
                    {p.nombre_prov}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField label="Código de factura" {...register('codigo_fcompras')} />
        </Box>

        <TextField label="Descripción" {...register('descripcion_fcompras')} />

        <Divider textAlign="left">
          <Typography variant="overline">Detalle</Typography>
        </Divider>

        <Stack spacing={1.5}>
          {fields.map((field, index) => {
            const productoId = detalles?.[index]?.producto_id ?? null
            const cant = Number(detalles?.[index]?.cantidad_presentacion)
            const costo = Number(detalles?.[index]?.costo_presentacion)
            const subtotal = cant > 0 && costo >= 0 ? cant * costo : 0

            return (
              <Paper key={field.id} variant="outlined" sx={{ p: 1.5 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', md: '2fr 1.5fr 1fr 1fr auto' },
                    alignItems: 'start',
                  }}
                >
                  <Controller
                    control={control}
                    name={`detalles.${index}.producto_id`}
                    render={({ field: f }) => (
                      <ProductoSelect
                        value={f.value}
                        onChange={(id) => f.onChange(id)}
                        size="small"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`detalles.${index}.presentacion_id`}
                    render={({ field: f }) => (
                      <PresentacionField
                        productoId={productoId}
                        value={f.value}
                        onChange={(id) => f.onChange(id)}
                        size="small"
                      />
                    )}
                  />
                  <TextField
                    size="small"
                    label="Cantidad"
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    {...register(`detalles.${index}.cantidad_presentacion`)}
                  />
                  <TextField
                    size="small"
                    label="Costo unit."
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    {...register(`detalles.${index}.costo_presentacion`)}
                  />
                  <Tooltip title="Quitar línea">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
                {subtotal > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    Subtotal: {formatCurrencyARS(subtotal)}
                  </Typography>
                )}
              </Paper>
            )
          })}

          <Button
            startIcon={<AddIcon />}
            onClick={() => append({ ...EMPTY_LINE })}
            sx={{ alignSelf: 'flex-start' }}
          >
            Agregar línea
          </Button>
        </Stack>

        <Divider />

        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Total: {formatCurrencyARS(total)}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              Registrar compra
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
