import { NextRequest, NextResponse } from "next/server";
import { getPostsByWeek } from "@/lib/db/posts";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const authRole = request.headers.get("x-auth-role");
  const userId = request.headers.get("x-user-id");

  const authorId = authRole === "employee" && userId ? Number(userId) : undefined;

  const week = searchParams.get("week");

  if (!week) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const weekStart = monday.toISOString().split("T")[0];
    const posts = await getPostsByWeek(weekStart, authorId);
    return NextResponse.json({ weekStart, posts });
  }

  const posts = await getPostsByWeek(week, authorId);
  return NextResponse.json({ weekStart: week, posts });
}
