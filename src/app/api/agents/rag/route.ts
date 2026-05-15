import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getSetting } from "@/lib/db/settings";
import { getDocumentsByIds, retrieveRelevantChunks } from "@/lib/db/documents";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, doc_ids, history } = await request.json() as {
    question: string;
    doc_ids: number[];
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });
  if (!doc_ids?.length) return NextResponse.json({ error: "doc_ids is required" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY || await getSetting("openai_api_key");
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

  // Fetch document content
  const docs = await getDocumentsByIds(doc_ids);
  if (!docs.length) return NextResponse.json({ error: "No documents found" }, { status: 404 });

  // Build RAG context — retrieve relevant chunks per doc (12k chars each)
  const contextParts = docs.map((doc) => {
    const chunks = retrieveRelevantChunks(doc.content, question, 12000);
    return `--- Document: ${doc.filename} ---\n${chunks}`;
  });
  const context = contextParts.join("\n\n");

  const systemPrompt = `You are the POZ Content AI — a document Q&A assistant.

The user has uploaded ${docs.length} document${docs.length > 1 ? "s" : ""}: ${docs.map((d) => d.filename).join(", ")}.

Answer the user's question using the information from the documents below.
- Be specific and accurate. Quote or paraphrase relevant sections.
- If the document is a resume/CV, extract and present the requested details clearly (name, skills, experience, education, etc.).
- If the answer is not found in the documents, say so clearly instead of guessing.
- Format your response with clear headings or bullet points where helpful.

DOCUMENT CONTENT:
${context}`;

  const model = await getSetting("ai_model") || "gpt-4o";
  const openai = new OpenAI({ apiKey });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(history ?? []).slice(-6).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: question },
  ];

  const resp = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
  });

  const answer = resp.choices[0].message.content ?? "No answer generated.";
  return NextResponse.json({ answer, doc_count: docs.length });
}
