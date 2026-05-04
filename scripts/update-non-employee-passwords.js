// One-off script: set all employee passwords to poz@123
// Usage: node --env-file=.env scripts/update-non-employee-passwords.js

const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Hash the new password
  const passwordHash = await bcrypt.hash("poz@123", 10);

  // Fetch employees to log who is being updated
  const { data: users, error: fetchError } = await db
    .from("team_members")
    .select("id, name, auth_role")
    .eq("auth_role", "employee");

  if (fetchError) {
    console.error("Failed to fetch users:", fetchError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("No employee users found.");
    return;
  }

  console.log(`Updating passwords for ${users.length} user(s):`);
  users.forEach((u) => console.log(`  - ${u.name} (${u.auth_role})`));

  // Bulk update
  const { error: updateError } = await db
    .from("team_members")
    .update({ password_hash: passwordHash })
    .eq("auth_role", "employee");

  if (updateError) {
    console.error("Failed to update passwords:", updateError.message);
    process.exit(1);
  }

  console.log("Done. All employee passwords updated to poz@123.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
