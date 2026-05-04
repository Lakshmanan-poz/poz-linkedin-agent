import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/db/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const user = await getSessionUser(payload.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
