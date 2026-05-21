import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getSetting } from "@/lib/db/settings";
import { getOpenAIApiKey } from "@/lib/secrets";

export const maxDuration = 30;

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

const SYSTEM = `You are the POZ Content AI — a direct, intent-first LinkedIn content assistant for Point One Zero (POZ).

CORE RULES:
1. INTENT FIRST — analyze the user's latest message. Identify exactly what they want.
2. NO FORCED WORKFLOW — never ask the user to select options or choose numbers if they gave a clear request.
3. DIRECT RESPONSE — if the user wants content, route to the correct action immediately. Do not redirect.
4. CONTEXT-AWARE — follow all user conditions strictly: "today" means current trends, "AI SaaS" means that domain.
5. FALLBACK — only use "reply" if the request is genuinely unclear. Always prefer generating over asking.

Available actions:
- "daily-content"   → user wants a LinkedIn post or carousel about a topic
- "weekly-calendar" → user wants a weekly LinkedIn content plan or calendar
- "content-refiner" → user wants to audit, refine, rate, or improve content they pasted
- "trending"        → user wants trending topics from X/Twitter
- "topic-analysis"  → user wants to research, understand, analyse, or deep-dive into a topic (NOT create a post)
- "reply"           → genuinely unclear or conversational — answer helpfully and suggest what they can do

Routing rules (strict):
- Any mention of post / carousel / content / caption / write / generate / create → "daily-content"
- Any mention of week / calendar / schedule / plan → "weekly-calendar"
- User pastes text and asks to audit / refine / rate / improve / fix / rewrite → "content-refiner"
- Any mention of trends / trending / popular / what's hot / today's topics / AI updates → "trending"
- User asks to analyse / research / explain / deep-dive / understand / give insights on a topic → "topic-analysis"
- Greeting / question / unclear → "reply"

For carousel requests: always set isCarousel = true and slideCount = 8 (default) unless user specifies a number.
Do NOT ask the user how many slides — always default to 8.

For topic-analysis: provide structured research insights, X signals, and key findings as the "text" field.

Respond ONLY with valid JSON. No markdown, no code fences.

{ "action": "daily-content", "topic": "<extracted topic>", "isCarousel": true|false, "slideCount": 8 }
{ "action": "weekly-calendar", "theme": "<theme or null>" }
{ "action": "content-refiner", "hasContent": true|false }
{ "action": "trending", "count": 5 }
{ "action": "topic-analysis", "text": "<structured topic insights, key signals, and findings>" }
{ "action": "reply", "text": "<helpful response — specific, structured, suggest next step>" }`;

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { message, history } = await request.json() as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

    const apiKey = await getOpenAIApiKey() || await getSetting("openai_api_key");
    if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

    const model = await getSetting("ai_model") || "gpt-4o";
    const openai = new OpenAI({ apiKey });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM },
      ...(history ?? []).slice(-6).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const resp = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    }, { signal: AbortSignal.timeout(25_000) });

    const raw = resp.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[agents/chat] error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
