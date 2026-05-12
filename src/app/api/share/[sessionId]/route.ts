import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const db = getAdminDb() ?? getDb();

  const { data, error } = await db
    .from("agent_catalog_chat_history")
    .select("session_id, title, messages, last_message_at, created_at")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
