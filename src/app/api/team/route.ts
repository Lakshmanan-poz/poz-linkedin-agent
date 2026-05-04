import { NextRequest, NextResponse } from "next/server";
import { getAllTeamMembers, createTeamMember } from "@/lib/db/team";
import bcrypt from "bcryptjs";

export async function GET() {
  const members = await getAllTeamMembers();
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const authRole = request.headers.get("x-auth-role");
  if (authRole !== "admin" && authRole !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, role, auth_role, password } = body;

  if (!name) {
    return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
  }

  let password_hash: string | undefined;
  if (password) {
    password_hash = await bcrypt.hash(password, 10);
  }

  const member = await createTeamMember({ name, email, role, auth_role, password_hash });
  return NextResponse.json(member, { status: 201 });
}
