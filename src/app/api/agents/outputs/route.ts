import { NextRequest, NextResponse } from "next/server";
import { getAllOutputs, createOutput } from "@/lib/db/agent-outputs";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const params = request.nextUrl.searchParams;
    // Always scope outputs to the current user — each user sees only their own history
    const outputs = await getAllOutputs({
      agent_id: params.get("agent_id") || undefined,
      skill_id: params.get("skill_id") || undefined,
      status: params.get("status") || undefined,
      created_by: payload.userId,
      search: params.get("search") || undefined,
    });
    return NextResponse.json(outputs);
  } catch (error) {
    console.error("Error fetching agent outputs:", error);
    return NextResponse.json({ error: "Failed to fetch outputs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { agent_id, skill_id, title, input_params, output_json } = body;
    // Always use the authenticated user's ID — never trust client-supplied created_by
    const created_by = payload.userId;

    if (!agent_id || !skill_id || !title || !input_params || !output_json) {
      return NextResponse.json(
        { error: "agent_id, skill_id, title, input_params, and output_json are required" },
        { status: 400 }
      );
    }

    const output = await createOutput({
      agent_id,
      skill_id,
      title,
      input_params: typeof input_params === "string" ? input_params : JSON.stringify(input_params),
      output_json: typeof output_json === "string" ? output_json : JSON.stringify(output_json),
      created_by,
    });

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    console.error("Error creating agent output:", error);
    return NextResponse.json({ error: "Failed to create output" }, { status: 500 });
  }
}
