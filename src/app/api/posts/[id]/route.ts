import { NextRequest, NextResponse } from "next/server";
import { getPostById, updatePost, deletePost } from "@/lib/db/posts";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const post = await updatePost(Number(id), body);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = await deletePost(Number(id));
  if (!success) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
