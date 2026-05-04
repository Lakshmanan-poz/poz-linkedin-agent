import { getDb } from "./index";

export async function getSetting(key: string): Promise<string | undefined> {
  const db = getDb();
  const { data, error } = await db
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch setting ${key}: ${error.message}`);
  return data?.value;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = getDb();
  const { data, error } = await db.from("app_settings").select("key, value");

  if (error) throw new Error(`Failed to fetch settings: ${error.message}`);
  return Object.fromEntries((data || []).map((row) => [row.key, row.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("app_settings").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) throw new Error(`Failed to set setting ${key}: ${error.message}`);
}

export async function setMultipleSettings(settings: Record<string, string>): Promise<void> {
  const db = getDb();
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return;

  const { error } = await db.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(`Failed to set settings: ${error.message}`);
}
