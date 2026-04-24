// Política de contraseñas reflejando exactamente la del backend:
// - al menos 8 caracteres
// - una mayúscula, una minúscula, un número
export const PASSWORD_POLICY = {
  minLength: 8,
  helperText: 'Mínimo 8 caracteres, con mayúscula, minúscula y número.',
}

export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_POLICY.minLength) {
    return `La contraseña debe tener al menos ${PASSWORD_POLICY.minLength} caracteres.`
  }
  if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una letra mayúscula.'
  if (!/[a-z]/.test(value)) return 'Debe incluir al menos una letra minúscula.'
  if (!/[0-9]/.test(value)) return 'Debe incluir al menos un número.'
  return null
}
