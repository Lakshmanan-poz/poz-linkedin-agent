import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getAdminDb, getDb } from "@/lib/db";

async function getUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/* ── POST /api/agents/chat-history/share
   Body: { session_id }
   Returns: { share_token, share_url }
   Generates a unique share token for a session (owner only). ─────────────── */
export async function POST(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { session_id } = await request.json();
    if (!session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

    const db = getAdminDb() ?? getDb();

    // Verify ownership — first check session exists (works even without share columns)
    const { data: base, error: baseErr } = await db
      .from("agent_catalog_chat_history")
      .select("id")
      .eq("session_id", session_id)
      .eq("user_id", payload.userId as number)
      .single();

    if (baseErr || !base) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch existing share token (separate query — columns may not exist yet)
    let existingToken: string | null = null;
    const { data: shareRow } = await db
      .from("agent_catalog_chat_history")
      .select("share_token, is_shared")
      .eq("session_id", session_id)
      .eq("user_id", payload.userId as number)
      .single();
    if (shareRow?.share_token) existingToken = shareRow.share_token as string;

    // Reuse existing token if already shared, otherwise generate new one
    const token = existingToken ?? crypto.randomUUID();

    const { error: updateErr } = await db
      .from("agent_catalog_chat_history")
      .update({ share_token: token, is_shared: true })
      .eq("session_id", session_id)
      .eq("user_id", payload.userId as number);

    if (updateErr) {
      // Likely means share columns don't exist — tell user to run migration
      throw new Error("DB migration needed: ADD COLUMN share_token + is_shared. " + updateErr.message);
    }

    const share_url = `${request.nextUrl.origin}/share/${token}`;
    return NextResponse.json({ share_token: token, share_url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create share link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── GET /api/agents/chat-history/share?token=xxx
   Public — no auth required.
   Returns: { title, messages, created_at } for a shared session. ─────────── */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  try {
    const db = getAdminDb() ?? getDb();
    const { data, error } = await db
      .from("agent_catalog_chat_history")
      .select("title, messages, created_at, last_message_at")
      .eq("share_token", token)
      .eq("is_shared", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Shared chat not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch shared chat";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── DELETE /api/agents/chat-history/share?session_id=xxx
   Revokes sharing for a session (owner only). ────────────────────────────── */
export async function DELETE(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session_id = request.nextUrl.searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  try {
    const db = getAdminDb() ?? getDb();
    const { error } = await db
      .from("agent_catalog_chat_history")
      .update({ is_shared: false, share_token: null })
      .eq("session_id", session_id)
      .eq("user_id", payload.userId as number);

    if (error) throw new Error(error.message);
    return NextResponse.json({ revoked: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to revoke share";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
