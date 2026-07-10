import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

// Default learner/kids video keywords. Kept intentionally learning-focused and
// child-safe (paired with safeSearch=strict + the admin channel allowlist).
// `language`: "en" | "km". Edit freely — re-running only adds what's missing.
const DEFAULT_KEYWORDS: {
  keyword: string;
  category: string;
  language: string;
}[] = [
  // English
  { keyword: "English for kids", category: "English", language: "en" },
  { keyword: "English alphabet song for children", category: "English", language: "en" },
  { keyword: "Phonics for kids", category: "English", language: "en" },
  { keyword: "Learn English words for children", category: "English", language: "en" },

  // Math
  { keyword: "Math for kids", category: "Math", language: "en" },
  { keyword: "Learn to count for children", category: "Math", language: "en" },
  { keyword: "Addition and subtraction for kids", category: "Math", language: "en" },
  { keyword: "Shapes for children", category: "Math", language: "en" },

  // Khmer
  { keyword: "Learn Khmer for kids", category: "Khmer", language: "km" },
  { keyword: "Khmer alphabet for children", category: "Khmer", language: "km" },

  // Science & general learning
  { keyword: "Science for kids", category: "Science", language: "en" },
  { keyword: "Colors for children", category: "General", language: "en" },
  { keyword: "Educational songs for kids", category: "General", language: "en" },
  { keyword: "Kids learning videos", category: "General", language: "en" },
];

async function main() {
  console.log("Seeding default video keywords...");

  // Idempotent: skip any keyword text that already exists.
  const existing = await db.query.videoKeywords.findMany({
    columns: { keyword: true, order: true },
  });
  const seen = new Set(existing.map((k) => k.keyword.trim().toLowerCase()));
  let order = existing.reduce((max, k) => Math.max(max, k.order), 0);

  const toInsert = DEFAULT_KEYWORDS.filter(
    (k) => !seen.has(k.keyword.trim().toLowerCase())
  ).map((k) => ({ ...k, order: ++order, enabled: true }));

  if (toInsert.length === 0) {
    console.log("Nothing to add — all default keywords already exist.");
  } else {
    await db.insert(schema.videoKeywords).values(toInsert);
    console.log(`Added ${toInsert.length} keyword(s):`);
    for (const k of toInsert) console.log(`  • ${k.keyword} [${k.category}]`);
  }

  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
