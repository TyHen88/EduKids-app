// This file is needed to support autocomplete for process.env
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // neon db uri
      DATABASE_URL: string;

      // public app url
      NEXT_PUBLIC_APP_URL: string;

      // Supabase project URL + keys (Project Settings → API)
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      // server-only; bypasses RLS — used for admin user management
      SUPABASE_SERVICE_ROLE_KEY: string;

      // admin auth user UUID(s) (separated by comma(,) and space( )). Ex: "uuid-a, uuid-b"
      ADMIN_IDS: string;

      // vercel blob read/write token (from the Vercel dashboard Blob store)
      BLOB_READ_WRITE_TOKEN: string;
    }
  }
}
