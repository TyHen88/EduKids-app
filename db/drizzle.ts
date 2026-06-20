import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const globalForDrizzle = globalThis as unknown as {
  sql: ReturnType<typeof neon> | undefined;
};

const sql = globalForDrizzle.sql ?? neon(process.env.DATABASE_URL!);
if (process.env.NODE_ENV !== "production") globalForDrizzle.sql = sql;

const db = drizzle(sql, { schema });

export default db;
