import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  console.log("Migrating existing books to createdBy = null...");
  await db.update(schema.books).set({ createdBy: null });
  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);
