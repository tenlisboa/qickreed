export type ActionErrorCode =
  | "unauthorized"
  | "not_found"
  | "db_error"
  | "validation"
  | "unknown";

export interface ActionError {
  code: ActionErrorCode;
  message: string; // user-facing, pt-BR
  details?: unknown; // logged, never shown to user
}

export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail<T>(
  code: ActionErrorCode,
  message: string,
  details?: unknown,
): ActionResult<T> {
  return { data: null, error: { code, message, details } };
}
