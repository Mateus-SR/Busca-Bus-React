export function validarEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validarSenha(value) {
  return typeof value === "string" && value.length >= 6 && /[A-Za-z]/.test(value) && /\d/.test(value);
}
