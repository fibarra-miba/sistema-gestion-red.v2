import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import { Chip, Divider, Paper, Stack, Typography } from '@mui/material'

import KpiCard from '@/components/ui/KpiCard'
import { formatTime } from '@/lib/format'
import { useResumenInstalaciones } from '../hooks/useResumenInstalaciones'
import KpiGridState from './KpiGridState'
import SectionShell from './SectionShell'

export default function InstalacionesSection() {
  const { data, isLoading, isError } = useResumenInstalaciones()

  return (
    <SectionShell title="Instalaciones" to="/instalaciones" toLabel="Ver instalaciones">
      <KpiGridState isLoading={isLoading} isError={isError} skeletonCount={3}>
        <KpiCard
          label="Programadas hoy"
          value={data?.programadas_hoy ?? 0}
          color="info"
          to="/instalaciones"
          icon={<TodayOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Pendientes"
          value={data?.pendientes ?? 0}
          to="/instalaciones"
          icon={<BuildOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Fallidas"
          value={data?.fallidas ?? 0}
          color="error"
          to="/instalaciones"
          icon={<ErrorOutlineOutlinedIcon fontSize="small" />}
        />
      </KpiGridState>

      {data && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Agenda de hoy
          </Typography>
          {data.agenda_hoy.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin instalaciones programadas para hoy.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={1}>
              {data.agenda_hoy.map((item) => (
                <Stack
                  key={item.programacion_id}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: 'center', minWidth: 0 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, width: 48, flexShrink: 0 }}
                    >
                      {formatTime(item.fecha_programacion)}
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {item.nombre_cliente} {item.apellido_cliente}
                    </Typography>
                  </Stack>
                  {item.tecnico && (
                    <Chip size="small" label={item.tecnico} variant="outlined" sx={{ flexShrink: 0 }} />
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </SectionShell>
  )
}
