import type { AuthError } from "@supabase/supabase-js";
import type { ActionError } from "@/utils/actions/types";

export type AuthMode = "login" | "signup";

const GENERIC_MESSAGE: Record<AuthMode, string> = {
  login: "Error signing in. Please try again",
  signup: "Error creating account. Please try again",
};

/**
 * Map a Supabase auth error to a user-facing ActionError.
 *
 * - `message` is English (user-facing).
 * - `details` carries the raw Supabase error for dev logs (English).
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
      message: "Too many attempts. Please wait a few minutes",
      details: error,
    };
  }

  if (message.includes("email not confirmed")) {
    return {
      code: "unauthorized",
      message: "Please confirm your email before signing in",
      details: error,
    };
  }

  if (mode === "signup" && message.includes("already registered")) {
    return {
      code: "unauthorized",
      message:
        "This email is already registered. Sign in or use another email.",
      details: error,
    };
  }

  if (message.includes("invalid login credentials")) {
    return {
      code: "unauthorized",
      message: "Invalid email or password",
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
      message: "Connection error. Please try again",
      details: error,
    };
  }

  return {
    code: "unknown",
    message: GENERIC_MESSAGE[mode],
    details: error,
  };
}
