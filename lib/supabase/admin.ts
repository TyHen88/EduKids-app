import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the service-role key. NEVER import this into
 * a Client Component — the service-role key bypasses Row Level Security and
 * must stay server-only. Used for admin user management (create/delete users),
 * e.g. parent-created child accounts in actions/family.ts.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
