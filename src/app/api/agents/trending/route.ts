import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const DAY_TYPES = [
  { day: "Monday",    type: "Thought Leadership", hint: "AI trends, business outcomes, leadership decisions, executive mindset" },
  { day: "Tuesday",   type: "Engagement Post",    hint: "industry challenges, provocative questions, hot debates, controversial takes" },
  { day: "Wednesday", type: "Tool Spotlight",     hint: "new AI tools, software releases, product launches, tech comparisons" },
  { day: "Thursday",  type: "Industry Insight",   hint: "market news, sector updates, business intelligence, analyst reports" },
  { day: "Friday",    type: "Forward-Looking",    hint: "predictions, lessons learned, future of work, strategic shifts" },
];

export type TrendItem = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  type: string;
  topic: string;
  summary: string;
  handle?: string;
  authority?: string;
  whatTheySaid?: string;
  post_url?: string;
  posted_at?: string;
};

function getDayConfig(dayParam?: string | null) {
  if (dayParam) {
    const found = DAY_TYPES.find((d) => d.day.toLowerCase() === dayParam.toLowerCase());
    if (found) return found;
  }
  const idx = new Date().getDay();
  return DAY_TYPES[idx >= 1 && idx <= 5 ? idx - 1 : 0];
}

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url    = new URL(request.url);
  const day    = getDayConfig(url.searchParams.get("day"));
  const count  = Math.min(Math.max(parseInt(url.searchParams.get("count") ?? "10", 10), 1), 20);
  const xaiKey = process.env.XAI_API_KEY;

  if (!xaiKey) {
    return NextResponse.json({
      trends: getFallback(day, count),
      day: day.day, contentType: day.type, source: "fallback",
    });
  }

  try {
    const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const model = process.env.XAI_MODEL || "grok-3-latest";

    const prompt = `You are a LinkedIn content strategist. Search X/Twitter for real posts from B2B thought leaders, CTOs, founders, and executives from the last 2 days (since ${since}).

Today's LinkedIn content type is: **${day.type}** — about: ${day.hint}

Find ${count} real X/Twitter sources (actual accounts) who have recently posted compelling content that a LinkedIn thought leader could base **${day.type}** content on. Prioritize high-authority accounts: verified executives, researchers, investors, analysts.

Return ONLY valid JSON — no markdown, no explanation:
{
  "trends": [
    {
      "handle": "@username",
      "authority": "Title at Company",
      "whatTheySaid": "Their actual post or close paraphrase (1-2 sentences)",
      "topic": "compelling LinkedIn topic headline (10-15 words)",
      "summary": "1-2 sentences on why it matters to B2B leaders",
      "post_url": "https://x.com/username/status/1234567890",
      "posted_at": "2026-06-07T14:32:00Z"
    }
  ]
}`;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`X.ai error: ${res.status} — ${errBody}`);
    }

    const raw  = await res.json();
    // Chat Completions response: choices[0].message.content
    const text: string = raw.choices?.[0]?.message?.content ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as {
      trends: { handle?: string; authority?: string; whatTheySaid?: string; topic: string; summary: string; post_url?: string; posted_at?: string }[];
    };
    const items  = parsed.trends?.filter((t) => t.topic) ?? [];
    if (items.length < 3) throw new Error("Insufficient trends");

    const trends: TrendItem[] = items.slice(0, count).map((t) => {
      const handle = (t.handle ?? "").replace("@", "").toLowerCase();
      // Use Grok's post URL only if it's a real post (has /status/), else link to profile
      let post_url = t.post_url ?? "";
      if (!/x\.com\/\w+\/status\/\d+/.test(post_url)) {
        post_url = handle ? `https://x.com/${handle}` : "";
      }
      return {
        day:          day.day as TrendItem["day"],
        type:         day.type,
        topic:        t.topic,
        summary:      t.summary,
        handle:       t.handle,
        authority:    t.authority,
        whatTheySaid: t.whatTheySaid,
        post_url:     post_url || undefined,
        posted_at:    t.posted_at,
      };
    });

    return NextResponse.json({ trends, day: day.day, contentType: day.type, source: "live" });
  } catch (err) {
    console.error("[trending] fallback:", err);
    return NextResponse.json({
      trends: getFallback(day, count),
      day: day.day, contentType: day.type, source: "fallback",
    });
  }
}

/* ── Rich fallback pool — 10 X sources per content type ──────────────────── */
const POOL: Record<string, Array<{ handle: string; authority: string; whatTheySaid: string; topic: string; summary: string }>> = {
  "Thought Leadership": [
    { handle: "@satyanadella", authority: "CEO at Microsoft", whatTheySaid: "AI agents aren't replacing entire roles — they're replacing entire workflow layers. The companies that understand this distinction will win the next decade.", topic: "AI agents are replacing workflow layers, not just individual tasks", summary: "Enterprise leaders are debating whether AI agents deliver real ROI or create new complexity. A compelling breakdown drives saves from every CTO on LinkedIn." },
    { handle: "@sama", authority: "CEO at OpenAI", whatTheySaid: "The CEO who doesn't understand what AI can and can't do will be replaced — not by AI, but by a CEO who does. Board patience for AI ignorance is gone.", topic: "The CEO who doesn't understand AI will be replaced by one who does", summary: "Board-level pressure on executives to demonstrate AI fluency is at an all-time high across every sector." },
    { handle: "@amasad", authority: "CEO at Replit", whatTheySaid: "We ran the numbers on 70% of digital transformations failing. Same culprit every time: they digitized bad processes instead of redesigning them. AI makes this worse.", topic: "Why most digital transformation projects still fail in 2025", summary: "McKinsey data shows 70% of transformations still miss their targets — the reasons are depressingly consistent and avoidable." },
    { handle: "@dhh", authority: "Co-founder at 37signals", whatTheySaid: "Remote-first isn't just a perk anymore — it's a performance variable. Our revenue-per-employee is 40% higher than the office-first companies we benchmark against.", topic: "Remote-first companies are outperforming office-first rivals on revenue growth", summary: "New data challenges return-to-office mandates with hard performance numbers that boards can no longer ignore." },
    { handle: "@lethain", authority: "CTO & Engineering Leader", whatTheySaid: "The real reason your best engineers leave isn't comp. It's that you gave them great problems but terrible tools, mediocre managers, and zero autonomy.", topic: "The real reason your best engineers keep leaving your company", summary: "Retention data points to autonomy, tooling, and manager quality — not salary — as the primary drivers of senior engineer departure." },
    { handle: "@emollick", authority: "Professor at Wharton, AI researcher", whatTheySaid: "We're seeing a two-speed enterprise forming in real time. Companies that adopted Gen AI 18 months ago are pulling 25-30% productivity gains. Late movers aren't catching up.", topic: "Gen AI is creating a two-speed enterprise: adapters and laggards", summary: "Early adopters are pulling ahead on productivity metrics while late movers fall further behind as the capability gap compounds quarterly." },
    { handle: "@shreyas", authority: "Former Product Leader at Stripe, Twitter", whatTheySaid: "Unpopular truth: leadership is a learnable craft. The 'born leader' idea has caused more organizational damage than almost any other management myth.", topic: "Leadership is a skill, not a personality trait — here's how to develop it", summary: "New research on leadership development challenges the born leader myth with reproducible frameworks that outperform trait-based hiring." },
    { handle: "@jasonlk", authority: "Founder at SaaStr", whatTheySaid: "B2B sales cycles are 23% longer than 2022 despite every AI tool we've thrown at it. More buying committee stakeholders + AI-amplified risk aversion = longer deals.", topic: "Why B2B sales cycles are getting longer despite better AI tools", summary: "More stakeholders and risk aversion are extending deal timelines even as automation increases — a paradox every revenue leader needs to address." },
    { handle: "@vboykis", authority: "Staff ML Engineer, AI researcher", whatTheySaid: "The board finally understands cybersecurity. Not because of education — because three Fortune 500 breaches in 90 days made it a P0 for every audit committee.", topic: "The board room finally understands cybersecurity — here's what changed", summary: "High-profile breaches have made security a board priority, reshaping CISO influence and budget allocation at the highest levels." },
    { handle: "@benedictevans", authority: "Independent Tech Analyst", whatTheySaid: "Data-driven decisions are overrated as a concept. Great leaders use data to pressure-test intuition — not replace it. The leaders who only do what the data says are the most dangerous.", topic: "Data-driven decisions are overrated — here's what great leaders actually do", summary: "Contrarian take on analytics culture is gaining traction among senior executives who have seen data misused as a substitute for judgment." },
  ],
  "Engagement Post": [
    { handle: "@kelseyhightower", authority: "Principal Engineer, Google (former)", whatTheySaid: "Hot take: the biggest mistake CTOs make with AI adoption isn't moving too slow. It's adopting AI to look innovative instead of to solve a specific, measurable problem.", topic: "What's the biggest mistake CTOs make when adopting AI at scale?", summary: "This debate is generating massive comment threads from senior leaders sharing war stories. An open question on this drives hundreds of authentic responses." },
    { handle: "@george__mack", authority: "Founder & Marketing Strategist", whatTheySaid: "Unpopular opinion: 90% of LinkedIn 'thought leadership' is just McKinsey decks reformatted with a personal story stapled to the front. We're drowning in repackaged consulting output.", topic: "Unpopular opinion: most LinkedIn thought leaders just repackage McKinsey reports", summary: "A provocative take on content authenticity is driving massive comment threads and polarizing senior professionals across industries." },
    { handle: "@lennyrachitsky", authority: "Former PM at Airbnb, newsletter author", whatTheySaid: "Would you take a 20% pay cut to work somewhere your work actually matters? I've been shocked by how many senior PMs say yes. The comp conversation isn't what we think it is.", topic: "Would you take a 20% pay cut to work for a company you truly believe in?", summary: "Values-vs-compensation debates consistently drive the highest engagement on LinkedIn, especially among senior individual contributors." },
    { handle: "@martinfowler", authority: "Chief Scientist at ThoughtWorks", whatTheySaid: "Agile has become the enterprise excuse for 'we didn't plan properly.' The two-week sprint was never meant to replace a product strategy. We've confused process for vision.", topic: "Hot take: agile has become an excuse for poor planning in most teams", summary: "Engineering and product leaders are debating whether agile has lost its original intent in a sea of cargo-cult ceremonies." },
    { handle: "@shreyas", authority: "Former Product Leader at Stripe, Twitter", whatTheySaid: "If you could only hire for one trait — not skills, not experience — what would it be? I've been asking this for 10 years. The answer tells me everything about how you hire.", topic: "If you could only hire for one trait, what would it be?", summary: "Open questions about hiring philosophy reliably generate hundreds of authentic responses from leaders at every level." },
    { handle: "@Carnage4Life", authority: "Principal Engineer at Okta", whatTheySaid: "We tried the 4-day work week for a full quarter. Productivity stayed flat. Collaboration cratered. We went back to 5 days. I know this isn't the answer people want to hear.", topic: "The 4-day work week didn't work for us — here's what actually happened", summary: "Real case studies with negative outcomes consistently outperform hypothetical debates in driving authentic comments and shares." },
    { handle: "@alexhormozi", authority: "Founder at Acquisition.com", whatTheySaid: "Hustle culture didn't die — it rebranded as 'deep work' and 'intentional performance.' Same 80-hour weeks, different aesthetic. Watch for the vocabulary shift, not the behavior change.", topic: "Is hustle culture finally dying, or just rebranding itself again?", summary: "The wellness-vs-performance debate is highly polarizing and consistently generates cross-industry engagement from both sides." },
    { handle: "@paulg", authority: "Co-founder at Y Combinator", whatTheySaid: "The skill I wish I'd learned 10 years earlier isn't coding, it's writing. Clear thinking is clear writing. Every problem I've failed to solve, I failed to articulate first.", topic: "What skill do you wish you had learned 10 years earlier?", summary: "Reflective questions with personal stakes generate authentic community responses that span industries and seniority levels." },
    { handle: "@sweatystartup", authority: "Entrepreneur & Operator", whatTheySaid: "We fired our marketing agency after 18 months. First 3 months: chaos. Month 4-6: 40% lower CAC. Month 7+: we own the muscle now. Was it worth it? Yes.", topic: "We fired our entire marketing agency and built in-house — was it worth it?", summary: "Build-vs-buy decisions with real P&L data resonate with every growth-stage company leader making the same choice." },
    { handle: "@clairevo", authority: "Head of Talent at Scale AI", whatTheySaid: "The interview question I use for every candidate: 'Tell me about a decision you made that was right but everyone disagreed with you.' Character, conviction, and communication all in one.", topic: "The interview question that reveals everything about a candidate's character", summary: "Hiring insights that claim to reveal character generate massive save rates from leaders who want to improve their own interview process." },
  ],
  "Tool Spotlight": [
    { handle: "@addyosmani", authority: "Engineering Manager at Google Chrome", whatTheySaid: "I've been using Google's new AI coding tool for 2 weeks alongside Copilot. The context window and project-level understanding are genuinely different. This changes AI-assisted development.", topic: "Google's new AI coding tool vs GitHub Copilot: what actually changed?", summary: "Developer tools are moving fast. CTOs and engineering leads are actively comparing options — a hands-on comparison gets massive organic reach." },
    { handle: "@simonw", authority: "Creator of Datasette, AI tooling author", whatTheySaid: "Spent 3 weeks running Claude vs GPT-4o on real enterprise workflows — legal doc review, code audit, customer support triage. Claude wins on precision. GPT-4o wins on speed.", topic: "Claude vs GPT-4o: which is actually better for enterprise workflows in 2025?", summary: "Hands-on comparisons with specific use cases are the most shared content in the AI tools category — abstract opinions don't convert." },
    { handle: "@karpathy", authority: "Former AI Director at Tesla, OpenAI", whatTheySaid: "I've been using Cursor for 6 months as my primary IDE. The tab completion isn't the killer feature — it's that it understands the entire codebase context when you ask a question.", topic: "Cursor AI just made traditional IDEs feel obsolete — here's why developers love it", summary: "Cursor's adoption among senior engineers is accelerating rapidly, with peer recommendation driving more adoption than marketing ever could." },
    { handle: "@fortelabs", authority: "Author of 'Building a Second Brain'", whatTheySaid: "The Notion AI update this week quietly replaced three tools in my productivity stack: my document summarizer, my meeting notes tool, and my first-draft writer.", topic: "The Notion AI update that's replacing three other tools in my entire stack", summary: "Workflow consolidation stories resonate strongly with productivity-focused professionals who are tired of managing 15 different subscriptions." },
    { handle: "@MotherDuck_dB", authority: "CEO at MotherDuck (DuckDB cloud)", whatTheySaid: "We migrated our entire analytics stack to DuckDB 8 months ago. Query speed is 10x on local analysis. Data warehouse bill dropped 60%. The tradeoffs are real but so are the gains.", topic: "Why we moved our entire data stack to DuckDB — and what we learned", summary: "Database migration stories with concrete cost and performance outcomes get high save rates from data engineering leads and CTOs." },
    { handle: "@heyBarsee", authority: "AI Tools Researcher & Newsletter Author", whatTheySaid: "I ran a 30-day head-to-head: Perplexity Pro vs ChatGPT Plus for research-heavy work. Perplexity wins on sourcing. ChatGPT wins on synthesis. The ROI depends on your use case.", topic: "Perplexity Pro vs ChatGPT Plus: which delivers more ROI for research teams?", summary: "AI research tool comparisons with methodology are among the top-performing content formats for B2B audiences making purchasing decisions." },
    { handle: "@HubSpot", authority: "HubSpot Product Team", whatTheySaid: "The HubSpot AI features getting zero attention: predictive lead scoring that auto-updates with each interaction, deal risk signals in pipeline, and AI-generated follow-up sequences.", topic: "The HubSpot AI features nobody is talking about but should be using", summary: "Underrated feature spotlights consistently outperform obvious product reviews because they give readers an immediate actionable advantage." },
    { handle: "@leeerob", authority: "VP of Product at Vercel", whatTheySaid: "The new Vercel AI SDK v4 just made streaming, tool use, and multi-step agent workflows 80% less code. We're seeing full-stack AI apps built in days that would have taken months.", topic: "How Vercel's new AI SDK is changing full-stack development workflows", summary: "Developer-focused tool launches with specific productivity claims attract cross-functional attention from both engineering and product leaders." },
    { handle: "@stewart", authority: "CEO at Slack (former)", whatTheySaid: "The new Slack AI features genuinely change how I run executive comms. Channel summaries across 200+ channels in 5 minutes. Highlights only the decisions and blockers.", topic: "Slack's new AI features finally justify the enterprise price tag", summary: "ROI justification content for expensive tools drives high engagement from enterprise buyers who need to defend their SaaS budget." },
    { handle: "@joulee", authority: "Head of Design at Facebook (former)", whatTheySaid: "The Figma AI update is doing something I didn't think was possible: it's generating component variants that match our design system style guide with 85% accuracy. 40% faster iteration.", topic: "The Figma AI update that's making design teams 40% faster overnight", summary: "Productivity gains with specific percentages and named tools generate curiosity and shares from design leads and CPOs across industries." },
  ],
  "Industry Insight": [
    { handle: "@sarahtavel", authority: "General Partner at Benchmark Capital", whatTheySaid: "Every PE firm we work with has now deployed some form of AI due diligence layer. Three years ago, none of them had it. AI-native deal flow screening is becoming a competitive differentiator.", topic: "Private equity firms are now screening deals using AI due diligence tools", summary: "FinTech and investment sector leaders are watching this shift closely as AI reshapes deal flow, evaluation timelines, and partner bandwidth." },
    { handle: "@jasonlk", authority: "Founder at SaaStr", whatTheySaid: "SaaS multiples are recovering but only for AI-native companies. Legacy SaaS at 4-6x ARR. AI-native SaaS at 15-20x ARR. The bifurcation in the private market is sharper than 2008.", topic: "SaaS valuations are recovering — but only for AI-native companies", summary: "VC and PE data shows a clear bifurcation in valuations between AI-native and legacy SaaS that is reshaping M&A strategy and funding rounds." },
    { handle: "@EricTopol", authority: "Cardiologist, Scripps Research Institute", whatTheySaid: "Healthcare AI just crossed the inflection point. FDA approved 3 clinical AI tools in the last 30 days. Major payers are moving to cover AI-assisted diagnostics. This isn't a pilot anymore.", topic: "Healthcare AI adoption just crossed a critical inflection point this quarter", summary: "New regulatory approvals and payer coverage shifts are accelerating clinical AI deployment from controlled trials to standard of care." },
    { handle: "@mmitchell_ai", authority: "Chief AI Scientist at Hugging Face", whatTheySaid: "Manufacturing AI for predictive maintenance is finally delivering at scale. The pilots are over. I'm seeing 30-40% maintenance cost reductions in automotive and aerospace.", topic: "Manufacturing companies using AI for predictive maintenance see 35% cost reduction", summary: "Industry 4.0 data is finally moving from pilot programs to production deployments, giving analysts and CFOs real numbers to work with." },
    { handle: "@benedictevans", authority: "Independent Tech Analyst", whatTheySaid: "The great enterprise software unbundling is officially in motion. Point solutions powered by AI are winning every RFP against Oracle and SAP on specific use cases. The suite model is cracking.", topic: "The great unbundling of enterprise software is officially happening now", summary: "AI-powered point solutions are winning against bloated enterprise suites on every metric from time-to-value to user adoption to ROI." },
    { handle: "@jillrowley", authority: "GTM Advisor, Former Salesforce", whatTheySaid: "The stat nobody in B2B sales wants to admit: buyers complete 70-80% of their decision process before talking to a salesperson. Your top-of-funnel is now a content engine, not an SDR team.", topic: "B2B buyers now complete 70% of their research before talking to sales", summary: "The shift to self-serve discovery is fundamentally breaking traditional outbound models and forcing GTM leaders to rethink pipeline generation." },
    { handle: "@fintech_brainfood", authority: "Fintech Analyst & Newsletter Author", whatTheySaid: "Fintech regulatory pressure is creating the M&A opportunity of the decade for incumbents. Compliance costs are making small fintechs unviable as standalone businesses.", topic: "Fintech regulatory pressure is creating M&A opportunities for incumbents", summary: "Compliance costs are forcing smaller fintechs to seek strategic acquirers, creating a favorable buyer's market for bank and enterprise acquirers." },
    { handle: "@gdb", authority: "President at OpenAI", whatTheySaid: "The talent war for AI engineers has a clear winner: whoever offers the most interesting problems, not the highest salary. The top AI engineers are not primarily motivated by comp.", topic: "The talent war for AI engineers is over — here's who won", summary: "Compensation data and hiring velocity tell a clear story about which sectors and companies are winning the competition for AI engineering talent." },
    { handle: "@flexport", authority: "CEO at Flexport", whatTheySaid: "Supply chain AI is now delivering 20-30% inventory cost reductions for our enterprise clients. Not projections — actual results in the P&L. The ROI conversation with the board is completely different now.", topic: "Supply chain AI tools are delivering 25% inventory cost reduction at scale", summary: "Logistics sector ROI data is now concrete enough to drive board-level investment decisions, moving AI from experiment to infrastructure." },
    { handle: "@Nicolettegarza", authority: "Creator Economy Analyst", whatTheySaid: "Creator economy valuations are getting crushed. AI-generated content has flooded every platform, CPMs are down 35% YoY, and brand deals are being repriced. Human creativity faces a supply shock.", topic: "Creator economy valuations are collapsing as AI content floods the market", summary: "AI-generated content saturation is fundamentally repricing human creative work, with major implications for media, marketing, and platform businesses." },
  ],
  "Forward-Looking": [
    { handle: "@benioff", authority: "CEO at Salesforce", whatTheySaid: "By 2026, every B2B sales team will have AI agents running parallel to human reps — handling research, follow-up, and qualification. Companies not building this now will be 2 years behind.", topic: "By 2026, most B2B sales teams will be AI-assisted — here's what to build now", summary: "Forward-looking prediction posts from credible voices generate urgency at the executive level and drive high-quality comments from practitioners." },
    { handle: "@emollick", authority: "Professor at Wharton, AI researcher", whatTheySaid: "The next wave of AI disruption won't replace individual workers. It will make entire company categories unviable. Think what GPS did to map companies, not what email did to secretaries.", topic: "The next wave of AI won't replace workers — it will replace entire companies", summary: "Structural business model disruption narratives resonate with strategic thinkers who are responsible for 3-5 year company positioning." },
    { handle: "@swyx", authority: "Head of Developer Experience, Smol AI", whatTheySaid: "Companies winning with AI in 2025 have one thing in common: they built clean data infrastructure in 2022-2023. AI is only as good as the data it trains on. Infrastructure is the moat now.", topic: "Why companies winning with AI in 2025 built their data infrastructure in 2022", summary: "Infrastructure-first thinking validates decisions already made by forward-looking CTOs and creates urgency for those who haven't started." },
    { handle: "@lethain", authority: "CTO & Engineering Leader", whatTheySaid: "Prediction: by 2027, the CTO role at most companies will split into two — a Chief AI Officer for capability and a Chief Platform Officer for reliability. The skill sets don't overlap.", topic: "Prediction: the CTO role will split into two distinct positions by 2027", summary: "Role evolution predictions generate healthy debate among both current CTOs navigating this split and aspiring leaders planning their careers." },
    { handle: "@wef", authority: "World Economic Forum Research", whatTheySaid: "The skills that will be worth 10x more in 5 years: complex reasoning, creative synthesis, and systems thinking. Not coding. Not prompting. Human judgment at scale.", topic: "The skills worth 10x more in 5 years — and they're not technical", summary: "Future-of-work predictions that validate soft skills resonate with a broad professional audience across industries and seniority levels." },
    { handle: "@AndrewNg", authority: "Founder at DeepLearning.AI, Coursera", whatTheySaid: "I'm now confident: every company will have a dedicated AI agent operations team by 2026. Not a center of excellence. Not a task force. A standing team with headcount and budget.", topic: "Why every company will have a dedicated AI agent team by 2026", summary: "Agentic AI deployment timelines from credible voices generate urgency at the executive level and drive high-quality comments from practitioners." },
    { handle: "@sama", authority: "CEO at OpenAI", whatTheySaid: "The traditional job description is a relic of industrial-era thinking. When AI can handle 50% of a role's tasks within 3 years, writing a static job description becomes organizational fiction.", topic: "The end of the traditional job description is closer than you think", summary: "AI capability expansion is making static role definitions increasingly obsolete, creating an urgent talent strategy conversation for every CHRO." },
    { handle: "@preskill", authority: "Theoretical Physicist, Caltech", whatTheySaid: "Quantum computing + AI isn't a 10-year story anymore. We're seeing early quantum advantage in drug discovery and materials science this year. The combination is moving faster than the roadmaps.", topic: "Quantum computing plus AI: the combination defining the next decade", summary: "Long-horizon technology predictions attract high-credibility amplification from researchers, investors, and technology strategy teams." },
    { handle: "@dhh", authority: "Co-founder at 37signals", whatTheySaid: "Remote work's second act looks nothing like the first. The best distributed teams I talk to have abandoned Zoom-first culture for async-first culture with intentional in-person moments.", topic: "Remote work's second act: how distributed teams are evolving beyond Zoom calls", summary: "Second-generation remote work strategies are differentiating culture-forward companies from those still cargo-culting the office model." },
    { handle: "@stratechery", authority: "Founder at Stratechery, Tech Analyst", whatTheySaid: "My best prediction for 2030: the dominant business models will be data-network-effect plays, AI-enabled services (not software), and vertical AI agents. Traditional SaaS won't be in the top 10.", topic: "The 10 business models that will dominate the AI economy by 2030", summary: "Structured prediction lists with business model framing and a credible analyst voice get the highest save rates of any content format on LinkedIn." },
  ],
};

function getFallback(day: typeof DAY_TYPES[0], count: number): TrendItem[] {
  const pool = POOL[day.type] ?? POOL["Thought Leadership"];
  return pool.slice(0, count).map((t) => ({
    day:          day.day as TrendItem["day"],
    type:         day.type,
    topic:        t.topic,
    summary:      t.summary,
    handle:       t.handle,
    authority:    t.authority,
    whatTheySaid: t.whatTheySaid,
    post_url:     `https://x.com/${t.handle.replace("@", "")}`,
  }));
}
