import { getDb } from "./index";
import { TeamMember, AuthRole } from "../types";

export type TeamMemberWithHash = TeamMember & { password_hash: string | null };

export async function getUserForAuth(identifier: string): Promise<TeamMemberWithHash | null> {
  const db = getDb();
  const { data, error } = await db
    .from("team_members")
    .select("id, name, email, role, auth_role, password_hash, created_at")
    .or(`email.eq.${identifier},name.ilike.${identifier}`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch auth user: ${error.message}`);
  return (data as TeamMemberWithHash) || null;
}

export async function getSessionUser(id: number): Promise<TeamMember | null> {
  const db = getDb();
  const { data, error } = await db
    .from("team_members")
    .select("id, name, email, role, auth_role, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch session user: ${error.message}`);
  return (data as TeamMember) || null;
}

export async function updateUserAuthRole(userId: number, authRole: AuthRole): Promise<void> {
  const db = getDb();
  const { error } = await db.from("team_members").update({ auth_role: authRole }).eq("id", userId);
  if (error) throw new Error(`Failed to update auth role: ${error.message}`);
}

export async function setUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from("team_members").update({ password_hash: passwordHash }).eq("id", userId);
  if (error) throw new Error(`Failed to set user password: ${error.message}`);
}
