import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserForAuth } from "@/lib/db/auth";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { identifier, password } = body;

  if (!identifier || !password) {
    return NextResponse.json({ error: "identifier and password are required" }, { status: 400 });
  }

  const user = await getUserForAuth(identifier);
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, authRole: user.auth_role });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _omit, ...safeUser } = user;

  const response = NextResponse.json({ user: safeUser });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
