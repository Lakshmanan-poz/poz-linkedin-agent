import { NextRequest, NextResponse } from "next/server";
import { updateTeamMember, deleteTeamMember } from "@/lib/db/team";
import { setUserPassword } from "@/lib/db/auth";
import bcrypt from "bcryptjs";

function checkAdminOrSuperAdmin(request: NextRequest) {
  const authRole = request.headers.get("x-auth-role");
  if (authRole !== "admin" && authRole !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = checkAdminOrSuperAdmin(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json();
  const { name, email, role, auth_role, password } = body;

  // Handle password change separately
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await setUserPassword(Number(id), hash);
  }

  const member = await updateTeamMember(Number(id), { name, email, role, auth_role });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = checkAdminOrSuperAdmin(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  const success = await deleteTeamMember(Number(id));
  if (!success) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
