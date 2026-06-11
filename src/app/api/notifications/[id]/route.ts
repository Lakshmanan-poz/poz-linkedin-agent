import { NextRequest, NextResponse } from "next/server";
import { markAsRead, deleteNotification } from "@/lib/db/notifications";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await markAsRead(Number(id));
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteNotification(Number(id));
  return NextResponse.json({ success: true });
}
