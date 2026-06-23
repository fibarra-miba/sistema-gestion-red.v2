// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/catalogo.py y backend/app/routes/catalogos.py

export interface CatalogoItemOut {
  id: number
  descripcion: string
  descripcion_tpromo?: string | null
  descripcion_epago?: string | null
  // tipos-producto expone el código (MATERIAL / EQUIPO) para identificarlos.
  codigo?: string | null
}
