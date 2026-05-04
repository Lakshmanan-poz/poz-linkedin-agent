import { getDb } from "./index";
import { AgentOutput } from "../agents/types";

const OUTPUT_SELECT_COLS =
  "id, agent_id, skill_id, title, input_params, output_json, status, created_by, created_at, updated_at";

async function enrichCreatorNames(rows: AgentOutput[]): Promise<AgentOutput[]> {
  if (rows.length === 0) return rows;

  const db = getDb();
  const memberIds = Array.from(new Set(rows.map((row) => row.created_by).filter(Boolean)));
  if (memberIds.length === 0) return rows;

  const { data: members, error } = await db
    .from("team_members")
    .select("id, name")
    .in("id", memberIds);

  if (error) throw new Error(`Failed to fetch creator names: ${error.message}`);

  const nameMap = new Map((members || []).map((member) => [member.id, member.name]));
  return rows.map((row) => ({
    ...row,
    created_by_name: nameMap.get(row.created_by),
  }));
}

export async function getAllOutputs(filters?: {
  agent_id?: string;
  skill_id?: string;
  status?: string;
  created_by?: number;
  search?: string;
}): Promise<AgentOutput[]> {
  const db = getDb();
  let query = db.from("agent_outputs").select(OUTPUT_SELECT_COLS).order("created_at", { ascending: false });

  if (filters?.agent_id) query = query.eq("agent_id", filters.agent_id);
  if (filters?.skill_id) query = query.eq("skill_id", filters.skill_id);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.created_by) query = query.eq("created_by", filters.created_by);
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,output_json.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch outputs: ${error.message}`);

  return enrichCreatorNames((data || []) as AgentOutput[]);
}

export async function getOutputById(id: number): Promise<AgentOutput | undefined> {
  const db = getDb();
  const { data, error } = await db
    .from("agent_outputs")
    .select(OUTPUT_SELECT_COLS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch output: ${error.message}`);
  if (!data) return undefined;

  const [enriched] = await enrichCreatorNames([data as AgentOutput]);
  return enriched;
}

export async function createOutput(data: {
  agent_id: string;
  skill_id: string;
  title: string;
  input_params: string;
  output_json: string;
  created_by: number;
}): Promise<AgentOutput> {
  const db = getDb();
  const { data: created, error } = await db
    .from("agent_outputs")
    .insert({
      agent_id: data.agent_id,
      skill_id: data.skill_id,
      title: data.title,
      input_params: data.input_params,
      output_json: data.output_json,
      created_by: data.created_by,
    })
    .select(OUTPUT_SELECT_COLS)
    .single();

  if (error) throw new Error(`Failed to create output: ${error.message}`);
  const [enriched] = await enrichCreatorNames([created as AgentOutput]);
  return enriched;
}

export async function updateOutput(
  id: number,
  data: Partial<{ title: string; output_json: string; status: string }>
): Promise<AgentOutput | undefined> {
  const db = getDb();
  const payload = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

  if (Object.keys(payload).length === 0) return getOutputById(id);

  const { data: updated, error } = await db
    .from("agent_outputs")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(OUTPUT_SELECT_COLS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update output: ${error.message}`);
  if (!updated) return undefined;

  const [enriched] = await enrichCreatorNames([updated as AgentOutput]);
  return enriched;
}

export async function deleteOutput(id: number): Promise<boolean> {
  const db = getDb();
  const { data, error } = await db.from("agent_outputs").delete().eq("id", id).select("id");
  if (error) throw new Error(`Failed to delete output: ${error.message}`);
  return (data?.length || 0) > 0;
}
