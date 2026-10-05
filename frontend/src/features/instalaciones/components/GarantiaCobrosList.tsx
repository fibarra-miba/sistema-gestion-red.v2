import { useState } from 'react'
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import { isApiError } from '@/types/api'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { useCobrosGarantia } from '../hooks/useCobrosGarantia'
import { ESTADO_GARANTIA } from './GarantiaEstadoChip'
import RegistrarCobroGarantiaDialog from './RegistrarCobroGarantiaDialog'
import ReciboGarantiaDialog from './ReciboGarantiaDialog'
import type { GarantiaOut, ReciboGarantiaOut } from '../types'

interface Props {
  garantia: GarantiaOut
  canCobrar: boolean
}

// Lista de cobros de un depósito con "Registrar cobro" y recibo por cobro.
// Reutilizable en diálogo y en la página de detalle.
export default function GarantiaCobrosList({ garantia, canCobrar }: Props) {
  const { data: cobros, isLoading, error } = useCobrosGarantia(garantia.garantia_id)
  const [registrando, setRegistrando] = useState<GarantiaOut | null>(null)
  const [recibo, setRecibo] = useState<ReciboGarantiaOut | null>(null)

  const puedeCobrar =
    canCobrar &&
    garantia.estado_garantia_id !== ESTADO_GARANTIA.ANULADA &&
    (garantia.saldo_pendiente_cobro ?? 0) > 0

  return (
    <Stack spacing={2}>
      {puedeCobrar && (
        <Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setRegistrando(garantia)}
          >
            Registrar cobro
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error">
          {isApiError(error) ? error.detail : 'Error al cargar los cobros.'}
        </Alert>
      )}
      {isLoading && <Skeleton height={48} />}
      {!isLoading && !error && (cobros?.length ?? 0) === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Todavía no hay cobros registrados.
        </Typography>
      )}

      {cobros?.map((c) => (
        <Stack
          key={c.cobro_garantia_id}
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatCurrencyARS(c.monto_cobro_garantia)}{' '}
              <Typography component="span" variant="body2" color="text.secondary">
                · {formatDate(c.fecha_cobro_garantia)}
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {c.descripcion_medio_pago}
              {c.comprobante_cobro_garantia ? ` · ${c.comprobante_cobro_garantia}` : ''}
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<ReceiptLongOutlinedIcon />}
            onClick={() => setRecibo(c.recibo)}
          >
            Recibo
          </Button>
        </Stack>
      ))}

      <RegistrarCobroGarantiaDialog
        garantia={registrando}
        onEmitido={setRecibo}
        onClose={() => setRegistrando(null)}
      />
      <ReciboGarantiaDialog recibo={recibo} onClose={() => setRecibo(null)} />
    </Stack>
  )
}
