export const catalogosKeys = {
  all: ['catalogos'] as const,
  mediosPagos: () => [...catalogosKeys.all, 'medios-pagos'] as const,
  tiposPromo: () => [...catalogosKeys.all, 'tipos-promo'] as const,
  tiposPago: () => [...catalogosKeys.all, 'tipos-pago'] as const,
  estadosPago: () => [...catalogosKeys.all, 'estados-pago'] as const,
  tiposProducto: () => [...catalogosKeys.all, 'tipos-producto'] as const,
  estadosGarantia: () => [...catalogosKeys.all, 'estados-garantia'] as const,
}
