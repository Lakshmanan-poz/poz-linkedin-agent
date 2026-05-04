import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/ai/generate";
import { PostType } from "@/lib/types";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { topic, post_type, additional_context, slide_count } = body;

  if (!topic || !post_type) {
    return NextResponse.json({ error: "Missing required fields: topic, post_type" }, { status: 400 });
  }

  try {
    const result = await generatePost({
      topic,
      postType: post_type as PostType,
      additionalContext: additional_context,
      slideCount: typeof slide_count === "number" ? slide_count : undefined,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
