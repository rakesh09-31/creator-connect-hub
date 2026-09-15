/**
 * Unified error extractor for OmniCraft.
 * Guarantees that "[object Object]" is NEVER returned to the user or UI.
 * Extracts meaningful messages from Error instances, Supabase PostgREST errors,
 * Supabase Storage errors, and custom API responses.
 */
export function getReadableErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (!err) return fallback;

  // 1. Primitive string
  if (typeof err === "string") {
    const trimmed = err.trim();
    if (!trimmed || trimmed === "[object Object]") return fallback;
    return trimmed;
  }

  // 2. JavaScript Error instance
  if (err instanceof Error) {
    if (err.message && err.message !== "[object Object]") {
      return err.message;
    }
  }

  // 3. Object-based errors (Supabase PostgREST, Storage, XHR, etc.)
  if (typeof err === "object") {
    const e = err as Record<string, any>;

    // Handle common PostgreSQL / Supabase error codes with user-friendly descriptions
    if (e.code === "23503") {
      return "Unable to save: Profile or user identity was not found. Please refresh and try again.";
    }
    if (e.code === "23505") {
      return "This record already exists.";
    }
    if (e.code === "42501") {
      return "Permission denied: You do not have permission to perform this action.";
    }

    // Check message field
    if (typeof e.message === "string" && e.message.trim() && e.message !== "[object Object]") {
      let msg = e.message.trim();
      if (e.details && typeof e.details === "string" && e.details.trim() && !msg.includes(e.details)) {
        msg += ` (${e.details.trim()})`;
      }
      return msg;
    }

    // Check error_description field (OAuth / Auth)
    if (typeof e.error_description === "string" && e.error_description.trim()) {
      return e.error_description.trim();
    }

    // Check details / hint
    if (typeof e.details === "string" && e.details.trim()) {
      return e.details.trim();
    }
    if (typeof e.hint === "string" && e.hint.trim()) {
      return e.hint.trim();
    }

    // Check nested error
    if (e.error) {
      return getReadableErrorMessage(e.error, fallback);
    }

    // Last resort JSON serialization
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}" && json.length < 300) {
        return json;
      }
    } catch {
      // Ignore stringify error
    }
  }

  return fallback;
}
