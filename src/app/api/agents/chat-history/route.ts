import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getChatSessions, upsertChatSession, deleteChatSession } from "@/lib/db/chat-history";

async function getUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/* ── GET /api/agents/chat-history — list all sessions for current user ─────── */
export async function GET(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sessions = await getChatSessions(payload.userId as number);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[chat-history GET] failed:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── POST /api/agents/chat-history — upsert a session ───────────────────────── */
export async function POST(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { session_id, title, messages } = body;

    if (!session_id || !title || !Array.isArray(messages)) {
      return NextResponse.json({ error: "session_id, title, and messages[] are required" }, { status: 400 });
    }

    const session = await upsertChatSession({
      session_id,
      user_id: payload.userId as number,
      title,
      messages,
    });

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error("[chat-history POST] failed:", error);
    const msg = error instanceof Error ? error.message : "Failed to save";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── DELETE /api/agents/chat-history?session_id=xxx ─────────────────────────── */
export async function DELETE(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "session_id is required" }, { status: 400 });

    const deleted = await deleteChatSession(sessionId, payload.userId as number);
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("[chat-history DELETE] failed:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
