export const planesKeys = {
  all: ['planes'] as const,

  lists: () => [...planesKeys.all, 'list'] as const,
  list: () => [...planesKeys.lists()] as const,

  details: () => [...planesKeys.all, 'detail'] as const,
  detail: (planId: number) => [...planesKeys.details(), planId] as const,

  precios: (planId: number) => [...planesKeys.all, planId, 'precios'] as const,
}
