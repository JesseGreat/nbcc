import type { ZodError } from "zod";

/** Standard return shape for server actions used by forms. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined>; code?: string };

export function fromZodError(error: ZodError): { ok: false; error: string; fieldErrors: Record<string, string[] | undefined> } {
  return { ok: false, error: "Please check the highlighted fields.", fieldErrors: error.flatten().fieldErrors };
}

export function fail(error: string, code?: string): { ok: false; error: string; code?: string } {
  return { ok: false, error, code };
}
