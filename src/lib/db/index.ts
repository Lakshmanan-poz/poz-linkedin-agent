import { createClient, SupabaseClient } from "@supabase/supabase-js";

let db: SupabaseClient | null = null;
let adminDb: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  return url;
}

function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  return key;
}

export function getDb(): SupabaseClient {
  if (!db) {
    db = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return db;
}

// Service-role client — bypasses RLS, server-side only
export function getAdminDb(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) return null;
  if (!adminDb) {
    adminDb = createClient(getSupabaseUrl(), serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminDb;
}
