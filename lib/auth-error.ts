// Extracts a friendly message from a Supabase AuthError (or any error-like
// object). Supabase errors expose `.message`; this also tolerates the older
// `.errors[]` shape so existing call sites keep working.
export const authError = (err: unknown, fallback = "Something went wrong.") => {
  if (err && typeof err === "object") {
    const o = err as {
      errors?: Array<{ message?: string; longMessage?: string }>;
      message?: string;
      longMessage?: string;
    };
    const first = o.errors?.[0];
    return (
      first?.longMessage ||
      first?.message ||
      o.longMessage ||
      o.message ||
      fallback
    );
  }
  return fallback;
};
