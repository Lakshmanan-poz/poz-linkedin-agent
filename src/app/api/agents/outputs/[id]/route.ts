import { NextRequest, NextResponse } from "next/server";
import { getOutputById, updateOutput, deleteOutput } from "@/lib/db/agent-outputs";

function checkSuperAdmin(request: NextRequest) {
  if (request.headers.get("x-auth-role") !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = checkSuperAdmin(request);
  if (forbidden) return forbidden;
  try {
    const { id } = await params;
    const output = await getOutputById(Number(id));
    if (!output) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }
    return NextResponse.json(output);
  } catch (error) {
    console.error("Error fetching output:", error);
    return NextResponse.json({ error: "Failed to fetch output" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = checkSuperAdmin(request);
  if (forbidden) return forbidden;
  try {
    const { id } = await params;
    const body = await request.json();
    const output = await updateOutput(Number(id), body);
    if (!output) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }
    return NextResponse.json(output);
  } catch (error) {
    console.error("Error updating output:", error);
    return NextResponse.json({ error: "Failed to update output" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = checkSuperAdmin(request);
  if (forbidden) return forbidden;
  try {
    const { id } = await params;
    const deleted = await deleteOutput(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting output:", error);
    return NextResponse.json({ error: "Failed to delete output" }, { status: 500 });
  }
}
