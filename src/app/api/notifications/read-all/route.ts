import { NextRequest, NextResponse } from "next/server";
import { markAllAsRead } from "@/lib/db/notifications";

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markAllAsRead(Number(userId));
  return NextResponse.json({ success: true });
}
