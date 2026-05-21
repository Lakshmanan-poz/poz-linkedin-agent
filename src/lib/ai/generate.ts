import OpenAI from "openai";
import { PostType } from "../types";
import { getDefaultTemplate } from "../db/templates";
import { getSetting } from "../db/settings";
import { POZ_BRAND_GUIDELINES } from "../agents/poz-brand";
import { getOpenAIApiKey } from "../secrets";

export interface GeneratedPost {
  title: string;
  hook: string;
  body: string;
  callToAction: string;
  hashtags: string[];
  fullPost: string;
}

export interface GeneratedCarousel {
  title: string;
  slides: { slideNumber: number; headline: string; bodyText: string; visualSuggestion: string }[];
  closingSlide: { headline: string; callToAction: string };
  captionText: string;
  hashtags: string[];
}

async function buildPrompt(topic: string, postType: PostType, additionalContext?: string) {
  const [template, brandNameSetting, brandVoiceSetting] = await Promise.all([
    getDefaultTemplate(postType),
    getSetting("brand_name"),
    getSetting("brand_voice"),
  ]);

  const brandName = brandNameSetting || "POZ";
  const brandVoice = brandVoiceSetting || "";

  let systemPrompt = template?.system_prompt || getDefaultSystemPrompt(postType);
  if (brandVoice) {
    systemPrompt = `Brand: ${brandName}\nBrand Voice: ${brandVoice}\n\n${systemPrompt}`;
  }
  systemPrompt = `${POZ_BRAND_GUIDELINES}\n\n${systemPrompt}`;

  let userPrompt = `Write a LinkedIn post about: ${topic}`;
  if (additionalContext) {
    userPrompt += `\n\nAdditional context: ${additionalContext}`;
  }

  return { systemPrompt, userPrompt };
}

function getDefaultSystemPrompt(postType: PostType): string {
  const base = `You are the LinkedIn content strategist for Point One Zero (POZ).
Follow the POZ brand guidelines above exactly. Short declarative sentences. No emojis except one at end of caption Line 1 if using the Revelation frame.
No hype language. Every claim must name a specific mechanism. First hashtag is always #PointOneZero.
Target 200-300 words for posts. Respond ONLY with valid JSON.`;

  const typeInstructions: Record<PostType, string> = {
    problem_solution: "Structure: open with a State Change or Contrast opener → name the specific problem → present the POZ perspective → close with a direct question CTA.",
    educational: "Structure: open with a Revelation frame → one contrarian insight → mechanism breakdown → specific takeaway → direct question CTA.",
    execution: "Structure: open with the unexpected outcome → one line of context → what shifted → the transferable lesson → direct question CTA.",
    carousel: "Create slide-by-slide content. Each slide: title 4-6 words (never a question), body 10-15 words (one sentence expanding the title). Never bullet fragments.",
  };

  return `${base}\n\n${typeInstructions[postType]}`;
}

export async function generatePost(params: {
  topic: string;
  postType: PostType;
  additionalContext?: string;
  slideCount?: number;
}): Promise<GeneratedPost | GeneratedCarousel> {
  const apiKey = await getOpenAIApiKey() || (await getSetting("openai_api_key"));
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const model = (await getSetting("default_model")) || "gpt-4o";
  const openai = new OpenAI({ apiKey });
  const { systemPrompt, userPrompt } = await buildPrompt(params.topic, params.postType, params.additionalContext);

  if (params.postType === "carousel") {
    const slideCount = params.slideCount && params.slideCount >= 3 ? params.slideCount : 8;
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt + `\n\nGenerate exactly ${slideCount} slides. Respond with a JSON object containing: title, slides (array of exactly ${slideCount} items: {slideNumber, headline, bodyText, visualSuggestion}), closingSlide ({headline, callToAction}), captionText, hashtags (array of strings).` },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}") as GeneratedCarousel;
  }

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt + "\n\nRespond with a JSON object containing: title (short internal label), hook (first 2 lines), body (main content), callToAction (closing CTA), hashtags (array of strings), fullPost (complete assembled post)." },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || "{}") as GeneratedPost;
}
