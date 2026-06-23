import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDrizzle = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

// `prepare: false` is required for Supabase's transaction pooler (pgbouncer),
// which doesn't support prepared statements. `connect_timeout` makes a pooler
// connection problem surface as an error instead of hanging the request
// forever; `idle_timeout` releases connections so we don't exhaust the pool.
const client =
  globalForDrizzle.client ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 15,
  });
if (process.env.NODE_ENV !== "production") globalForDrizzle.client = client;

const db = drizzle(client, { schema });

export default db;
