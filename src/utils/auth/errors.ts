import type { AuthError } from "@supabase/supabase-js";
import type { ActionError } from "@/utils/actions/types";

export type AuthMode = "login" | "signup";

const GENERIC_MESSAGE: Record<AuthMode, string> = {
  login: "Erro ao fazer login. Tente novamente",
  signup: "Erro ao criar conta. Tente novamente",
};

/**
 * Map a Supabase auth error to a user-facing ActionError.
 *
 * - `message` is pt-BR (user-facing, AD-004).
 * - `details` carries the raw Supabase error for dev logs (English, AD-004).
 *
 * "User not found" is intentionally NOT surfaced separately — GoTrue folds it
 * into "Invalid login credentials" to prevent user enumeration; we preserve
 * that and map both cases to the same message.
 */
export function mapAuthError(error: AuthError, mode: AuthMode): ActionError {
  const message = error.message?.toLowerCase() ?? "";

  if (error.status === 429 || message.includes("too many requests")) {
    return {
      code: "unknown",
      message: "Muitas tentativas. Aguarde alguns minutos",
      details: error,
    };
  }

  if (message.includes("email not confirmed")) {
    return {
      code: "unauthorized",
      message: "Por favor, confirme seu email antes de fazer login",
      details: error,
    };
  }

  if (mode === "signup" && message.includes("already registered")) {
    return {
      code: "unauthorized",
      message: "Este email já está cadastrado. Faça login ou use outro email.",
      details: error,
    };
  }

  if (message.includes("invalid login credentials")) {
    return {
      code: "unauthorized",
      message: "Email ou senha inválidos",
      details: error,
    };
  }

  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("fetch")
  ) {
    return {
      code: "unknown",
      message: "Erro de conexão. Tente novamente",
      details: error,
    };
  }

  return {
    code: "unknown",
    message: GENERIC_MESSAGE[mode],
    details: error,
  };
}
