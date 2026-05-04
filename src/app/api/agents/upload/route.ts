import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { storeDocument } from "@/lib/db/documents";

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  // Plain text formats — read directly
  if (/\.(txt|md|csv|json|js|ts|jsx|tsx|xml|yaml|yml|html|htm)$/.test(name)) {
    return file.text();
  }

  // PDF — use pdfjs-dist/legacy (Node.js compatible, no browser APIs needed)
  if (name.endsWith(".pdf")) {
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
      const buffer = new Uint8Array(await file.arrayBuffer());
      const loadingTask = pdfjsLib.getDocument({ data: buffer, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
      const pdf = await loadingTask.promise;
      const pageTexts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ");
        if (pageText.trim()) pageTexts.push(pageText.trim());
      }
      const text = pageTexts.join("\n\n").trim();
      if (!text) {
        return `[This PDF has no extractable text (may be image-based): ${file.name}. Please export as a .txt or .docx file.]`;
      }
      return text;
    } catch (err) {
      console.error("[upload] pdf extract error:", err);
      return `[Could not extract text from PDF: ${file.name}. Try converting to .txt or .docx first.]`;
    }
  }

  // DOCX — use mammoth
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      return result.value as string;
    } catch {
      return `[Could not extract text from DOCX: ${file.name}. Try converting to .txt first.]`;
    }
  }

  // Fallback — attempt raw text read
  try {
    return await file.text();
  } catch {
    return `[Binary file ${file.name} — content not extractable as text.]`;
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const sessionId = (formData.get("session_id") as string | null) ?? undefined;

  if (files.length < 1) return NextResponse.json({ error: "At least 1 file is required" }, { status: 400 });
  if (files.length > 5) return NextResponse.json({ error: "Maximum 5 files allowed per upload" }, { status: 400 });

  const userId = Number((payload as { userId?: number }).userId ?? 0);
  const results: { id: number; filename: string; chars: number }[] = [];

  for (const file of files) {
    const rawText = await extractText(file);
    const content = rawText.slice(0, 60_000); // cap at 60k chars per doc
    const doc = await storeDocument({
      user_id: userId,
      session_id: sessionId,
      filename: file.name,
      file_type: file.type || "text/plain",
      content,
    });
    results.push({ id: doc.id, filename: file.name, chars: rawText.length });
  }

  return NextResponse.json({ documents: results });
}
