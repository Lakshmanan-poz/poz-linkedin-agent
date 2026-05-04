import { NextRequest, NextResponse } from "next/server";
import { getNotificationsByUserId, createNotification, getUnreadCount } from "@/lib/db/notifications";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsByUserId(Number(userId)),
    getUnreadCount(Number(userId)),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, type, post_id, message, created_by } = body;

  if (!user_id || !message) {
    return NextResponse.json({ error: "Missing required fields: user_id, message" }, { status: 400 });
  }

  const notification = await createNotification({ user_id, type: type || "info", post_id, message, created_by });
  return NextResponse.json(notification, { status: 201 });
}
