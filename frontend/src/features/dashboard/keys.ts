export const dashboardKeys = {
  all: ['dashboard'] as const,

  clientes: () => [...dashboardKeys.all, 'clientes'] as const,
  contratos: () => [...dashboardKeys.all, 'contratos'] as const,
  instalaciones: () => [...dashboardKeys.all, 'instalaciones'] as const,
  pagos: () => [...dashboardKeys.all, 'pagos'] as const,
  depositos: () => [...dashboardKeys.all, 'depositos'] as const,
}
