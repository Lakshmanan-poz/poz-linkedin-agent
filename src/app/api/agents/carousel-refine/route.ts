import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSetting } from "@/lib/db/settings";
import { getOpenAIApiKey } from "@/lib/secrets";

export type DesignParams = {
  accentColor: string;
  bgColor: string;
  titleColor: string;
  blobOpacity: number;
  darkMode: boolean;
};

export const DEFAULT_DESIGN_PARAMS: DesignParams = {
  accentColor: "#009FF0",
  bgColor: "#FFFFFF",
  titleColor: "#111111",
  blobOpacity: 0.045,
  darkMode: false,
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentParams } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const storedKey = await getSetting("openai_api_key");
    const apiKey = await getOpenAIApiKey() || storedKey;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const current: DesignParams = { ...DEFAULT_DESIGN_PARAMS, ...(currentParams ?? {}) };

    const client = new OpenAI({ apiKey });
    const systemPrompt = `You are a design assistant for LinkedIn carousel slides.
Given the user's change request, return an updated DesignParams JSON object.

DesignParams schema:
- accentColor: hex string (main brand/accent color, used for badge, stat numbers, illustration elements)
- bgColor: hex string (slide background)
- titleColor: hex string (title and body text color)
- blobOpacity: number 0.02–0.12 (intensity of background glow blobs)
- darkMode: boolean (true = dark background, light text)

Rules:
- "dark" / "dark mode" / "black background" → darkMode:true, bgColor:"#0F0F12", titleColor:"#F0F0F0", blobOpacity:0.06
- "light" / "white" / "clean" → darkMode:false, bgColor:"#FFFFFF", titleColor:"#111111"
- "orange" → accentColor:"#FF6B35"
- "green" → accentColor:"#00C896"
- "purple" → accentColor:"#7C3AED"
- "red" → accentColor:"#E53E3E"
- "teal" → accentColor:"#0D9488"
- "minimal" / "less glow" → blobOpacity:0.02
- "bold" / "vibrant" / "intense" → blobOpacity:0.10
- "blue" (default) → accentColor:"#009FF0"
Return ONLY a valid JSON object. No explanation, no markdown.`;

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Current params: ${JSON.stringify(current)}\nUser request: "${prompt}"`,
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const updated = { ...current, ...JSON.parse(raw) } as DesignParams;

    // Ensure values are sane
    if (updated.darkMode && updated.bgColor === "#FFFFFF") updated.bgColor = "#0F0F12";
    if (updated.darkMode && updated.titleColor === "#111111") updated.titleColor = "#F0F0F0";

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[carousel-refine] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
