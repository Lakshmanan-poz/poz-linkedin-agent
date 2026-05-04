import { getAdminDb, getDb } from "./index";

export interface UserDocument {
  id: number;
  filename: string;
  file_type: string;
  content: string;
  session_id?: string;
}

export async function storeDocument(doc: {
  user_id: number;
  session_id?: string;
  filename: string;
  file_type: string;
  content: string;
}): Promise<UserDocument> {
  const db = getAdminDb() ?? getDb();
  const { data, error } = await db
    .from("agent_outputs")
    .insert({
      agent_id: "rag",
      skill_id: `doc-${doc.session_id ?? "general"}`,
      title: doc.filename,
      input_params: JSON.stringify({ filename: doc.filename, file_type: doc.file_type, session_id: doc.session_id }),
      output_json: JSON.stringify({ content: doc.content }),
      created_by: doc.user_id,
    })
    .select("id, title, input_params")
    .single();
  if (error) throw new Error(error.message);
  const row = data as { id: number; title: string; input_params: string };
  const meta = JSON.parse(row.input_params) as { filename: string; file_type: string; session_id?: string };
  return { id: row.id, filename: row.title, file_type: meta.file_type, content: doc.content, session_id: meta.session_id };
}

export async function getDocumentsByIds(ids: number[]): Promise<UserDocument[]> {
  if (!ids.length) return [];
  const db = getAdminDb() ?? getDb();
  const { data, error } = await db
    .from("agent_outputs")
    .select("id, title, input_params, output_json")
    .eq("agent_id", "rag")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { id: number; title: string; input_params: string; output_json: string }) => {
    const meta = JSON.parse(row.input_params) as { filename: string; file_type: string; session_id?: string };
    const out = JSON.parse(row.output_json) as { content: string };
    return { id: row.id, filename: row.title, file_type: meta.file_type, content: out.content, session_id: meta.session_id };
  });
}

export async function deleteDocument(id: number): Promise<void> {
  const db = getAdminDb() ?? getDb();
  await db.from("agent_outputs").delete().eq("id", id).eq("agent_id", "rag");
}

/** Keyword-based chunk retrieval — no vector DB required */
export function retrieveRelevantChunks(content: string, question: string, maxChars = 12000): string {
  // Early-exit: unextractable placeholder
  if (content.startsWith("[Could not") || content.startsWith("[This PDF") || content.startsWith("[Binary")) {
    return content;
  }

  // Try double-newline split (well-formatted text)
  let paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 20);

  // PDF-style text often has single newlines only — group lines into ~8-line chunks
  if (paragraphs.length < 5) {
    const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const grouped: string[] = [];
    for (let i = 0; i < lines.length; i += 8) {
      const chunk = lines.slice(i, i + 8).join("\n").trim();
      if (chunk.length > 20) grouped.push(chunk);
    }
    if (grouped.length > paragraphs.length) paragraphs = grouped;
  }

  const stopWords = new Set([
    "what","when","where","which","that","this","from","with","have","will",
    "about","does","would","could","should","there","their","they","your",
    "tell","explain","give","show","list","describe","please","thanks",
  ]);
  const keywords = question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  if (!keywords.length || !paragraphs.length) return content.slice(0, maxChars);

  const scored = paragraphs.map((p) => ({
    text: p,
    score: keywords.filter((k) => p.toLowerCase().includes(k)).length,
  }));

  // Include all scored chunks (highest first) up to maxChars
  let result = "";
  for (const p of scored.sort((a, b) => b.score - a.score)) {
    if (result.length + p.text.length + 4 > maxChars) break;
    result += p.text + "\n\n";
  }
  return result.trim() || content.slice(0, maxChars);
}
