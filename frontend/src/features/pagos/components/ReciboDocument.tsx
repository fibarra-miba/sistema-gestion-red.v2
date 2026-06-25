import { Box, Divider, Stack, Typography } from '@mui/material'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { formatPeriodo } from '../utils'
import type { PagoDetalleOut, PagoMovimientoOut } from '../types'

interface Props {
  detalle: PagoDetalleOut
  mov: PagoMovimientoOut
  medioLabel: string
  tipoLabel: string
}

// Documento de recibo imprimible (clase .recibo-print → ver @media print en index.css).
// Sólo presentación: todos los datos vienen del detalle de pago ya cargado.
export default function ReciboDocument({ detalle, mov, medioLabel, tipoLabel }: Props) {
  const { pago, factura, cliente } = detalle
  const recibo = mov.recibo

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
        {/* Encabezado */}
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
              Comprobante de pago
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              RECIBO N° {recibo ? recibo.recibo_id : '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(recibo ? recibo.fecha_recibo : mov.fecha_pago)}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        {/* Recibí de + importe */}
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Recibí de
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {cliente.nombre_cliente} {cliente.apellido_cliente}
          </Typography>
        </Stack>

        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            La suma de
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {formatCurrencyARS(recibo ? recibo.importe_recibo : mov.monto_pago)}
          </Typography>
        </Box>

        {/* Concepto */}
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            En concepto de
          </Typography>
          <Typography variant="body1">
            Pago de servicio — Contrato #{pago.contrato_id} · Período{' '}
            {formatPeriodo(pago.periodo_anio_pago, pago.periodo_mes_pago)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Factura #{factura.factura_venta_id} · {medioLabel} · {tipoLabel}
          </Typography>
        </Stack>

        <Divider />

        {/* Pie: estado de la factura */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ flexWrap: 'wrap', justifyContent: 'space-between' }}
        >
          <Field label="Total factura" value={formatCurrencyARS(pago.total_factura)} />
          <Field label="Pagado" value={formatCurrencyARS(pago.total_pagado)} />
          <Field label="Saldo pendiente" value={formatCurrencyARS(pago.saldo_pendiente)} />
        </Stack>
      </Stack>
    </Box>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  )
}
