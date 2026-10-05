import { Box, Divider, Stack, Typography } from '@mui/material'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import type { ReciboGarantiaOut } from '../types'

interface Props {
  recibo: ReciboGarantiaOut
}

// Recibo imprimible de depósito en garantía (clase .recibo-print → @media
// print en index.css). Sólo presentación del recibo guardado (snapshot al emitir).
export default function ReciboGarantiaDocument({ recibo }: Props) {
  return (
    <Box
      className="recibo-print"
      sx={{
        bgcolor: '#fff',
        color: '#000',
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
              Sistema RED
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recibo de depósito en garantía
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              N° {recibo.numero_recibo_garantia}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Emitido: {formatDate(recibo.fecha_emision_recibo_garantia)}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Recibí de
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {recibo.cliente_nombre} {recibo.cliente_apellido}
          </Typography>
        </Stack>

        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            La suma de
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {formatCurrencyARS(recibo.importe_recibo_garantia)}
          </Typography>
        </Box>

        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            En concepto de
          </Typography>
          <Typography variant="body1">Depósito en garantía — {recibo.producto_descripcion}</Typography>
          <Typography variant="body2" color="text.secondary">
            Cobrado el {formatDate(recibo.fecha_cobro_garantia)} · {recibo.medio_pago_descripcion}
            {recibo.comprobante_cobro_garantia
              ? ` · Comprobante: ${recibo.comprobante_cobro_garantia}`
              : ''}
          </Typography>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Field label="Monto de la garantía" value={formatCurrencyARS(recibo.monto_garantia)} />
          <Field label="Total cobrado" value={formatCurrencyARS(recibo.total_cobrado_al_emitir)} />
          <Field
            label="Saldo pendiente"
            value={formatCurrencyARS(recibo.saldo_pendiente_al_emitir)}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Depósito reembolsable. No constituye factura.
        </Typography>
      </Stack>
    </Box>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  )
}
