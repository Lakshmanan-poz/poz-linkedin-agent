import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db/posts";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
