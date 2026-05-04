// Standalone cleanup script — removes test data from Supabase.
// Usage: node scripts/cleanup.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from .env

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Parse .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const lines = readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = process.env[key] ?? val;
    }
  } catch {
    // .env not found — rely on existing env vars
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const TABLES = [
  "agent_catalog_chat_messages",
  "agent_catalog_chat_history",
  "agent_outputs",
  "notifications",
  "post_comments",
  "post_revisions",
  "post_status_history",
  "posts",
];

console.log("POZ — Clearing test data...\n");

for (const table of TABLES) {
  const { count, error } = await db.from(table).delete({ count: "exact" }).neq("id", 0);
  if (error) {
    console.error(`  ✗ ${table.padEnd(35)} ERROR: ${error.message}`);
  } else {
    console.log(`  ✓ ${table.padEnd(35)} ${count ?? 0} rows deleted`);
  }
}

console.log("\nDone. team_members, app_settings, prompt_templates untouched.");
