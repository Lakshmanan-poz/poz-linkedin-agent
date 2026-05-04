import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, setMultipleSettings } from "@/lib/db/settings";

function checkSuperAdmin(request: NextRequest) {
  const authRole = request.headers.get("x-auth-role");
  if (authRole !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const forbidden = checkSuperAdmin(request);
  if (forbidden) return forbidden;
  const settings = await getAllSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const forbidden = checkSuperAdmin(request);
  if (forbidden) return forbidden;
  const body = await request.json();
  await setMultipleSettings(body);
  const settings = await getAllSettings();
  return NextResponse.json(settings);
}
