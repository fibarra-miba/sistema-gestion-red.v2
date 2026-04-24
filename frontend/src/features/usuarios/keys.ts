export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  list: () => [...usuariosKeys.lists()] as const,
  details: () => [...usuariosKeys.all, 'detail'] as const,
  detail: (usuarioId: number) => [...usuariosKeys.details(), usuarioId] as const,
  roles: () => [...usuariosKeys.all, 'roles'] as const,
}
