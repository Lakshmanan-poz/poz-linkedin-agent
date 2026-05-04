import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getDb } from "@/lib/db/index";

// One-time cleanup route — removes all test posts, chat history, and agent outputs.
// Only callable by superadmin. Safe to leave deployed; it deletes nothing on its own.
export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session || session.authRole !== "superadmin") {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }

  const db = getDb();
  const errors: string[] = [];
  const counts: Record<string, number> = {};

  async function clearTable(table: string) {
    const { count, error } = await db.from(table).delete({ count: "exact" }).neq("id", 0);
    if (error) errors.push(`${table}: ${error.message}`);
    else counts[table] = count ?? 0;
  }

  // Order matters — clear dependents before parents
  await clearTable("agent_catalog_chat_messages");
  await clearTable("agent_catalog_chat_history");
  await clearTable("agent_outputs");
  await clearTable("notifications");
  await clearTable("post_comments");
  await clearTable("post_revisions");
  await clearTable("post_status_history");
  await clearTable("posts");

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors, deleted: counts }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: counts });
}
