# POZ Social Media Agent

AI-powered LinkedIn content platform for Point One Zero — combines post creation, marketing agents, and carousel generation with the full POZ design system.

---

## Quick Start

### Prerequisites
- Node.js 18+
- An Anthropic API key (`ANTHROPIC_API_KEY`) for carousel generation
- An OpenAI API key (`OPENAI_API_KEY`) for post generation and agent skills

### Installation

```bash
# Clone
git clone https://github.com/migavel-poz/POZ-Agent.git
cd POZ-Agent

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your keys to .env.local:
#   OPENAI_API_KEY=sk-...
#   ANTHROPIC_API_KEY=sk-ant-...
```

### Running

```bash
npm run dev
# App available at http://localhost:3000
# SQLite database auto-created at ./data/social-media-agent.db
# Default team members and templates are seeded on first run
```

If port 3000 is already in use:

```bash
# Use a different port
npx next dev --port 3001

# Or kill the process using port 3000 (Windows PowerShell)
$pid = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }
```

---

## Features

### Post Creation Pipeline
3-step wizard — choose type → enter topic → AI generates → preview & edit → save draft. Supports 4 post formats: Problem-Solution, Educational, Execution/Build, Carousel. Full editorial workflow: Draft → In Review → Ready for Design → With Designer → Ready to Publish → Published.

### LinkedIn Carousel Generator
On the Agent Catalog page, select any agent skill → a 5-slide POZ-branded carousel is generated automatically using Claude claude-sonnet-4-6. Each slide follows the POZ design system (Bebas Neue + Inter, three canvases: Ink #050517, White #FFFFFF, Blue #009FF0). Slides are cached in localStorage by content hash to prevent re-generation on revisit. Download as PDF with one click.

### Marketing AI Agents
Three specialized agents (18 skills total):
- **Agent 1.1** — Content & Authority (content calendar, post generation, AEO/SEO, repurposing, analytics)
- **Agent 1.2** — Thought Leadership (POV framing, deep research, argument structuring, long-form, council review, executive summary)
- **Agent 1.3** — Market Intelligence (competitor profiles, signal scanning, trend radar, AEO audit, opportunity mapping, briefing packs)

Nine skills use OpenAI Responses API with real-time web search.

### Service Catalog
Gap analysis dashboard mapping 7 function areas, 27 planned agents, and 149 skills with status tracking (Exists, Planned, Missing, Partial).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | GPT-4o for post generation and 18 agent skills |
| `ANTHROPIC_API_KEY` | Yes | Claude claude-sonnet-4-6 for carousel HTML generation |

The OpenAI key can also be set via the Settings page (stored in the database, overrides env var).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite via better-sqlite3 (WAL mode) |
| AI — Posts & Agents | OpenAI SDK (GPT-4o, Responses API) |
| AI — Carousel | Anthropic SDK (claude-sonnet-4-6) |
| PDF Export | html-to-image + jsPDF (browser-side) |
| Fonts | Bebas Neue + Inter via Google Fonts |
| Notifications | Sonner |
| Theming | next-themes |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — loads Bebas Neue + Inter globally
│   ├── agent-catalog/page.tsx        # Carousel generator, PDF download
│   ├── agents/[agentId]/page.tsx     # Agent skill forms + outputs
│   ├── posts/                        # Post list, creation wizard, detail
│   ├── dashboard/                    # KPI dashboard
│   └── api/
│       ├── agents/carousel-html/     # Claude carousel HTML generator
│       ├── agents/generate/          # OpenAI skill generation
│       ├── generate/                 # OpenAI post generation
│       └── posts/                    # Post CRUD + status + revisions
│
├── components/
│   ├── layout/                       # Sidebar, header
│   ├── ui/                           # shadcn/ui components
│   └── agents/skills/                # 18 skill form components
│
└── lib/
    ├── db/                           # SQLite — schema, CRUD modules
    ├── ai/generate.ts                # Post generation
    └── agents/                       # Agent types, constants, generate

Point One Zero Design System/         # Brand reference (fonts, colors, layout rules)
public/carousel-sample.html           # 5-slide POZ carousel reference
data/social-media-agent.db            # SQLite database (auto-created)
```

---

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for the full reference — API endpoints, database schema, agent skill input/output specs, and workflow diagrams.
