import { getDb } from "./index";
import { TeamMember, AuthRole } from "../types";

const SELECT_COLS = "id, name, email, role, auth_role, created_at";

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const db = getDb();
  const { data, error } = await db
    .from("team_members")
    .select(SELECT_COLS)
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return (data || []) as TeamMember[];
}

export async function getTeamMemberById(id: number): Promise<TeamMember | undefined> {
  const db = getDb();
  const { data, error } = await db
    .from("team_members")
    .select(SELECT_COLS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch team member: ${error.message}`);
  return data as TeamMember | undefined;
}

export async function createTeamMember(data: {
  name: string;
  email?: string;
  role?: string;
  auth_role?: AuthRole;
  password_hash?: string;
}): Promise<TeamMember> {
  const db = getDb();
  const { data: created, error } = await db
    .from("team_members")
    .insert({
      name: data.name,
      email: data.email || null,
      role: data.role || "member",
      auth_role: data.auth_role || "employee",
      password_hash: data.password_hash || null,
    })
    .select(SELECT_COLS)
    .single();

  if (error) throw new Error(`Failed to create team member: ${error.message}`);
  return created as TeamMember;
}

export async function updateTeamMember(
  id: number,
  data: Partial<{ name: string; email: string; role: string; auth_role: AuthRole }>
): Promise<TeamMember | undefined> {
  const db = getDb();
  const payload = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

  if (Object.keys(payload).length === 0) return getTeamMemberById(id);

  const { data: updated, error } = await db
    .from("team_members")
    .update(payload)
    .eq("id", id)
    .select(SELECT_COLS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update team member: ${error.message}`);
  return updated as TeamMember | undefined;
}

export async function deleteTeamMember(id: number): Promise<boolean> {
  const db = getDb();
  const { data, error } = await db.from("team_members").delete().eq("id", id).select("id");
  if (error) throw new Error(`Failed to delete team member: ${error.message}`);
  return (data?.length || 0) > 0;
}
