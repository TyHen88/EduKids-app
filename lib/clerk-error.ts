// Extracts a friendly message from a Clerk error — handles both thrown
// ClerkAPIResponseError (`.errors[]`) and the Future API's `{ error }` object.
export const clerkError = (err: unknown, fallback = "Something went wrong.") => {
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
