import type { ApiErrorBody } from "@/types/auth";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

export function applyApiFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  /** Ánh xạ tên trường từ máy chủ → tên field trong form (nếu khác). */
  rename?: Partial<Record<string, FieldPath<T>>>,
): boolean {
  if (typeof err !== "object" || err === null || !("response" in err)) return false;
  const data = (err as { response?: { data?: ApiErrorBody } }).response?.data;
  const fe = data?.fieldErrors;
  if (!fe || typeof fe !== "object") return false;
  let any = false;
  for (const [key, message] of Object.entries(fe)) {
    if (!message) continue;
    const field = (rename?.[key] ?? (key as FieldPath<T>)) as FieldPath<T>;
    setError(field, { type: "server", message });
    any = true;
  }
  return any;
}
