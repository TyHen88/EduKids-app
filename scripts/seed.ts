import "dotenv/config";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

// ---------------------------------------------------------------------------
// Generic seed runner.  Usage:
//
//   npm run seed              list the available seeds
//   npm run seed math-kh      run scripts/seeds/math-kh.ts
//   npm run seed math-kh foo  run several, in the order given
//   npm run seed all          run every seed
//
// A seed is any file in scripts/seeds/ that default-exports a `Seed`. Adding
// one is just adding a file — no package.json edit, no new npm script.
// Files starting with "_" are ignored (shared helpers live there).
//
// The runner owns the database connection and closes it, so a seed only ever
// describes *what* to write.
// ---------------------------------------------------------------------------

export type SeedDb = ReturnType<typeof drizzle<typeof schema>>;

export type Seed = {
  /** One line, shown by `npm run seed` with no arguments. */
  description: string;
  run: (db: SeedDb) => Promise<void>;
};

const SEEDS_DIR = path.join(process.cwd(), "scripts", "seeds");

const listSeeds = () =>
  existsSync(SEEDS_DIR)
    ? readdirSync(SEEDS_DIR)
        .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
        .map((f) => f.replace(/\.ts$/, ""))
        .sort()
    : [];

const loadSeed = async (name: string): Promise<Seed> => {
  const file = path.join(SEEDS_DIR, `${name}.ts`);
  if (!existsSync(file)) throw new Error(`No such seed: "${name}" (${file})`);
  // pathToFileURL matters on Windows — a bare "C:\..." path is not a valid URL.
  const mod = (await import(pathToFileURL(file).href)) as { default?: Seed };
  if (!mod.default?.run) {
    throw new Error(`Seed "${name}" must default-export { description, run }.`);
  }
  return mod.default;
};

const main = async () => {
  const available = listSeeds();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    if (available.length === 0) {
      console.log(`No seeds found in ${SEEDS_DIR}`);
      return;
    }
    console.log("Available seeds — run one with:  npm run seed <name>\n");
    for (const name of available) {
      const { description } = await loadSeed(name);
      console.log(`  ${name.padEnd(16)} ${description}`);
    }
    return;
  }

  const names = args.includes("all") ? available : args;
  const unknown = names.filter((n) => !available.includes(n));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown seed(s): ${unknown.join(", ")}. Available: ${available.join(", ") || "(none)"}`
    );
  }

  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  try {
    for (const name of names) {
      const seed = await loadSeed(name);
      console.log(`\n▶ ${name} — ${seed.description}`);
      await seed.run(db);
    }
    console.log(`\nDone (${names.length} seed${names.length === 1 ? "" : "s"}).`);
  } finally {
    // postgres-js keeps the socket open; close it so the process exits.
    await client.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
