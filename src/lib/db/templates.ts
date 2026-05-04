import { getDb } from "./index";
import { PromptTemplate, PostType } from "../types";

const SELECT_COLS =
  "id, name, post_type, system_prompt, user_prompt_template, example_output, is_default, created_by, created_at, updated_at";

export async function getAllTemplates(): Promise<PromptTemplate[]> {
  const db = getDb();
  const { data, error } = await db
    .from("prompt_templates")
    .select(SELECT_COLS)
    .order("post_type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
  return (data || []) as PromptTemplate[];
}

export async function getTemplatesByType(postType: PostType): Promise<PromptTemplate[]> {
  const db = getDb();
  const { data, error } = await db
    .from("prompt_templates")
    .select(SELECT_COLS)
    .eq("post_type", postType)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to fetch templates by type: ${error.message}`);
  return (data || []) as PromptTemplate[];
}

export async function getDefaultTemplate(postType: PostType): Promise<PromptTemplate | undefined> {
  const db = getDb();
  const { data, error } = await db
    .from("prompt_templates")
    .select(SELECT_COLS)
    .eq("post_type", postType)
    .eq("is_default", 1)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch default template: ${error.message}`);
  return data as PromptTemplate | undefined;
}

export async function getTemplateById(id: number): Promise<PromptTemplate | undefined> {
  const db = getDb();
  const { data, error } = await db
    .from("prompt_templates")
    .select(SELECT_COLS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch template: ${error.message}`);
  return data as PromptTemplate | undefined;
}

export async function createTemplate(data: {
  name: string;
  post_type: PostType;
  system_prompt: string;
  user_prompt_template: string;
  example_output?: string;
  is_default?: boolean;
  created_by?: number;
}): Promise<PromptTemplate> {
  const db = getDb();
  const { data: created, error } = await db
    .from("prompt_templates")
    .insert({
      name: data.name,
      post_type: data.post_type,
      system_prompt: data.system_prompt,
      user_prompt_template: data.user_prompt_template,
      example_output: data.example_output || null,
      is_default: data.is_default ? 1 : 0,
      created_by: data.created_by || null,
    })
    .select(SELECT_COLS)
    .single();

  if (error) throw new Error(`Failed to create template: ${error.message}`);
  return created as PromptTemplate;
}

export async function updateTemplate(id: number, data: Partial<{
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  example_output: string;
  is_default: boolean;
}>): Promise<PromptTemplate | undefined> {
  const db = getDb();
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined).map(([key, value]) => {
      if (key === "is_default") return [key, value ? 1 : 0];
      return [key, value];
    })
  );

  if (Object.keys(payload).length === 0) return getTemplateById(id);

  const { data: updated, error } = await db
    .from("prompt_templates")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(SELECT_COLS)
    .maybeSingle();

  if (error) throw new Error(`Failed to update template: ${error.message}`);
  return updated as PromptTemplate | undefined;
}

export async function deleteTemplate(id: number): Promise<boolean> {
  const db = getDb();
  const { data, error } = await db.from("prompt_templates").delete().eq("id", id).select("id");
  if (error) throw new Error(`Failed to delete template: ${error.message}`);
  return (data?.length || 0) > 0;
}
