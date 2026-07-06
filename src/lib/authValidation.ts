export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Não foi possível concluir a operação.";

  const normalized = error.message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("user already registered")) return "Este e-mail já está cadastrado.";
  if (normalized.includes("token has expired") || normalized.includes("otp expired")) {
    return "O código expirou. Solicite um novo código.";
  }
  if (normalized.includes("supabase não configurado")) return error.message;
  return "Não foi possível concluir a operação. Tente novamente.";
}
