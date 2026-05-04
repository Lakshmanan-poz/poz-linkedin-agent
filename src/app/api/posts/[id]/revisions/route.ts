import { NextRequest, NextResponse } from "next/server";
import { addRevision, getRevisions } from "@/lib/db/posts";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const revisions = await getRevisions(Number(id));
  return NextResponse.json(revisions);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { content, revised_by, revision_type } = body;

  if (!content || !revised_by) {
    return NextResponse.json({ error: "Missing required fields: content, revised_by" }, { status: 400 });
  }

  const revision = await addRevision(Number(id), content, revised_by, revision_type || "manual_edit");
  return NextResponse.json(revision, { status: 201 });
}
