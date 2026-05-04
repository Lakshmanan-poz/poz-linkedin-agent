import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/db/posts";
import { PostStatus, PostType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const authRole = request.headers.get("x-auth-role");
  const userId = request.headers.get("x-user-id");
  const filters: { status?: PostStatus; post_type?: PostType; author_id?: number; search?: string } = {};

  if (searchParams.get("status")) filters.status = searchParams.get("status") as PostStatus;
  if (searchParams.get("post_type")) filters.post_type = searchParams.get("post_type") as PostType;
  if (searchParams.get("search")) filters.search = searchParams.get("search")!;

  // Employees can only see their own posts
  if (authRole === "employee" && userId) {
    filters.author_id = Number(userId);
  } else if (searchParams.get("author_id")) {
    filters.author_id = Number(searchParams.get("author_id"));
  }

  const posts = await getAllPosts(filters);
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const authRole = request.headers.get("x-auth-role");
  const userId = request.headers.get("x-user-id");
  const { title, content, post_type, platform, ai_prompt, ai_model, carousel_slides, hashtags, scheduled_date } = body;

  // Employees always author their own posts
  const author_id = authRole === "employee" && userId ? Number(userId) : body.author_id;

  if (!title || !content || !post_type || !author_id) {
    return NextResponse.json({ error: "Missing required fields: title, content, post_type, author_id" }, { status: 400 });
  }

  const post = await createPost({ title, content, post_type, author_id, platform, ai_prompt, ai_model, carousel_slides, hashtags, scheduled_date });
  return NextResponse.json(post, { status: 201 });
}
