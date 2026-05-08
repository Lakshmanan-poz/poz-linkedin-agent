import { getDb, getAdminDb } from "./index";

const CREATE_MESSAGES_TABLE = `
CREATE TABLE IF NOT EXISTS agent_catalog_chat_messages (
  id            BIGSERIAL    PRIMARY KEY,
  message_id    TEXT         NOT NULL UNIQUE,
  session_id    TEXT         NOT NULL,
  user_id       BIGINT       NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role          TEXT         NOT NULL CHECK (role IN ('user', 'agent')),
  text          TEXT         NOT NULL DEFAULT '',
  result_type   TEXT,
  result_data   JSONB,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_catalog_chat_messages_session
  ON agent_catalog_chat_messages (session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_agent_catalog_chat_messages_user
  ON agent_catalog_chat_messages (user_id, created_at DESC);
`;

let messagesTableReady = false;

async function ensureMessagesTable(): Promise<boolean> {
  if (messagesTableReady) return true;
  const admin = getAdminDb();
  if (!admin) return false;
  try {
    const { error } = await admin.rpc("exec_sql", { sql: CREATE_MESSAGES_TABLE });
    if (!error) { messagesTableReady = true; return true; }
    // rpc may not exist — try a direct probe instead
    const probe = await admin.from("agent_catalog_chat_messages").select("id").limit(1);
    if (!probe.error) { messagesTableReady = true; return true; }
    return false;
  } catch {
    return false;
  }
}

/* ─── Types ──────────────────────────────────────────────────────────────────── */
export interface ChatSession {
  id: number;
  session_id: string;
  user_id: number;
  title: string;
  messages: unknown[];         // full message array (JSON)
  last_message_at: string;
  created_at: string;
}

export interface ChatMessageRow {
  id?: string;                  // client UUID (message_id in DB)
  role: "user" | "agent";
  text: string;
  resultType?: string | null;
  resultData?: unknown | null;
}

const SESSION_COLS = "id, session_id, user_id, title, messages, last_message_at, created_at";

/* ─── List all sessions for a user ──────────────────────────────────────────── */
export async function getChatSessions(userId: number): Promise<ChatSession[]> {
  const db = getAdminDb() ?? getDb();
  const { data, error } = await db
    .from("agent_catalog_chat_history")
    .select(SESSION_COLS)
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch chat sessions: ${error.message}`);
  return (data || []) as ChatSession[];
}

/* ─── Upsert a session (create or update by session_id) ─────────────────────── */
export async function upsertChatSession(params: {
  session_id: string;
  user_id: number;
  title: string;
  messages: unknown[];
}): Promise<ChatSession> {
  const db = getAdminDb() ?? getDb();
  const { data, error } = await db
    .from("agent_catalog_chat_history")
    .upsert(
      {
        session_id:       params.session_id,
        user_id:          params.user_id,
        title:            params.title,
        messages:         params.messages,
        last_message_at:  new Date().toISOString(),
      },
      { onConflict: "session_id" }
    )
    .select(SESSION_COLS)
    .single();

  if (error) throw new Error(`Failed to upsert chat session: ${error.message}`);

  // Also write each individual message into the granular messages table.
  // onConflict on message_id keeps this idempotent — re-saving the session
  // (on every edit) will no-op rows already persisted and only insert new ones.
  const rows = (params.messages as ChatMessageRow[])
    .filter((m) => m && m.id && (m.role === "user" || m.role === "agent"))
    .map((m) => ({
      message_id:  m.id,
      session_id:  params.session_id,
      user_id:     params.user_id,
      role:        m.role,
      text:        m.text ?? "",
      result_type: m.resultType ?? null,
      result_data: m.resultData ?? null,
    }));
  if (rows.length > 0) {
    const tableReady = await ensureMessagesTable();
    if (tableReady) {
      const { error: msgErr } = await db
        .from("agent_catalog_chat_messages")
        .upsert(rows, { onConflict: "message_id" });
      if (msgErr) {
        console.warn("Failed to persist chat messages:", msgErr.message);
      }
    }
  }

  return data as ChatSession;
}

/* ─── Delete a session ───────────────────────────────────────────────────────── */
export async function deleteChatSession(sessionId: string, userId: number): Promise<boolean> {
  const db = getAdminDb() ?? getDb();
  const { data, error } = await db
    .from("agent_catalog_chat_history")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId)   // guard: only owner can delete
    .select("id");

  if (error) throw new Error(`Failed to delete chat session: ${error.message}`);
  return (data?.length || 0) > 0;
}
