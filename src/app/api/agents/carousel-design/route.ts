import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { buildCarouselPython } from "@/lib/agents/carousel-python";
import type { DesignParams } from "@/lib/agents/carousel-python";

export async function POST(req: NextRequest) {
  try {
    const { slides, topic, hashtags, designParams } = await req.json() as {
      slides: unknown[]; topic: string; hashtags: string[]; designParams?: Partial<DesignParams>;
    };

    if (!slides || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided" }, { status: 400 });
    }

    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "E2B_API_KEY not configured" }, { status: 500 });
    }

    const pythonCode = buildCarouselPython(slides as never, topic ?? "", hashtags ?? [], designParams);

    const sandbox = await Sandbox.create({ apiKey });
    try {
      const result = await sandbox.runCode(pythonCode, { language: "python" });

      // Check for Python-level errors
      if (result.error) {
        console.error("[carousel-design] Python error:", result.error.value);
        return NextResponse.json(
          { error: "PDF generation failed", detail: result.error.value.slice(0, 400) },
          { status: 500 }
        );
      }

      const stdout = result.logs.stdout.join("");
      const stderr = result.logs.stderr.join("");

      const b64Match = stdout.match(/B64:([A-Za-z0-9+/=]+)/);
      if (!b64Match) {
        console.error("[carousel-design] No B64 output. stderr:", stderr.slice(0, 500));
        return NextResponse.json(
          { error: "PDF generation failed", detail: stderr.slice(0, 400) || "No output from Python" },
          { status: 500 }
        );
      }

      return NextResponse.json({ pdf: b64Match[1] });
    } finally {
      await sandbox.kill();
    }
  } catch (err) {
    console.error("[carousel-design] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
