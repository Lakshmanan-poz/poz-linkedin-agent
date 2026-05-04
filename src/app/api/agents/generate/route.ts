import { NextRequest, NextResponse } from "next/server";
import { generateSkillOutput } from "@/lib/agents/generate";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { SkillId } from "@/lib/agents/types";

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { skillId, inputs } = body;

    if (!skillId || !inputs) {
      return NextResponse.json(
        { error: "skillId and inputs are required" },
        { status: 400 }
      );
    }

    const result = await generateSkillOutput({
      skillId: skillId as SkillId,
      inputs,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent generation error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
