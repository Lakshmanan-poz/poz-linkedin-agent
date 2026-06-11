// Cron script — called by GitHub Actions every 20 minutes.
// Fetches 3 fresh topics for today's day type and saves to Supabase.
// Set these GitHub Secrets: XAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
const XAI_KEY  = process.env.XAI_API_KEY;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SECRET_KEY;

if (!XAI_KEY || !SUPA_URL || !SUPA_KEY) {
  console.error('Missing required env vars: XAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY');
  process.exit(1);
}

const DAY_TYPES = [
  { day: 'Monday',    type: 'Thought Leadership', hint: 'AI trends, business outcomes, leadership decisions, executive mindset' },
  { day: 'Tuesday',   type: 'Engagement Post',    hint: 'industry challenges, provocative questions, hot debates, controversial takes' },
  { day: 'Wednesday', type: 'Tool Spotlight',     hint: 'new AI tools, software releases, product launches, tech comparisons' },
  { day: 'Thursday',  type: 'Industry Insight',   hint: 'market news, sector updates, business intelligence, analyst reports' },
  { day: 'Friday',    type: 'Forward-Looking',    hint: 'predictions, lessons learned, future of work, strategic shifts' },
];

// Today's weekday (Mon=1 … Fri=5); fall back to Monday on weekends
const idx = new Date().getDay();
const dt  = DAY_TYPES[idx >= 1 && idx <= 5 ? idx - 1 : 0];

const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];

console.log(`[${new Date().toISOString()}] Refreshing ${dt.day} (${dt.type}) trends...`);

const prompt = `Search X/Twitter for the 3 most liked and most replied posts from the last 2 days (${since} to ${today}) about: ${dt.hint}

Rules:
- Last 2 days only (after ${since})
- Highest likes + replies first
- Real accounts: founders, executives, researchers, investors
- Must include direct post URL with status ID
Return ONLY valid JSON, no markdown:
{"trends":[{"handle":"@username","authority":"Role at Company","whatTheySaid":"post text","topic":"LinkedIn headline 10-12 words","post_url":"https://x.com/u/status/ID","posted_at":"${today}T12:00:00Z"}]}`;

const ctrl = new AbortController();
const tid  = setTimeout(() => ctrl.abort(), 30_000);

try {
  const res = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_KEY}` },
    body: JSON.stringify({
      model: 'grok-4-fast-reasoning',
      input: [{ role: 'user', content: prompt }],
      tools: [{ type: 'x_search', from_date: since, to_date: today }],
      text: { format: { type: 'json_object' } },
      temperature: 0.1,
      max_output_tokens: 1500,
    }),
    signal: ctrl.signal,
  });

  const raw  = await res.json();
  let text = raw.output_text || '';
  if (!text && Array.isArray(raw.output)) {
    const parts = [];
    for (const item of raw.output) {
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if (typeof c?.text === 'string') parts.push(c.text);
        }
      }
    }
    text = parts.join('');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) { console.log('No JSON in xAI response — skipping.'); process.exit(0); }

  const parsed = JSON.parse(jsonMatch[0]);
  const items  = (parsed.trends || []).filter(t => t.topic);
  if (!items.length) { console.log('No topics in response — skipping.'); process.exit(0); }

  const batchId = `${dt.day}-${new Date().toISOString().slice(0, 13)}`;
  const rows = items.slice(0, 3).map(t => {
    const handle = (t.handle || '').replace('@', '').toLowerCase();
    let post_url = t.post_url || '';
    if (!/x\.com\/\w+\/status\/\d+/.test(post_url)) {
      const m = text.match(new RegExp(`https://x\\.com/${handle}/status/\\d+`));
      post_url = m ? m[0] : (handle ? `https://x.com/${handle}` : '');
    }
    return {
      day: dt.day, content_type: dt.type, topic: t.topic,
      handle: t.handle || null, authority: t.authority || null,
      what_they_said: t.whatTheySaid || null,
      post_url: post_url || null, posted_at: t.posted_at || null,
      batch_id: batchId,
    };
  });

  // Insert new topics
  const ins = await fetch(`${SUPA_URL}/rest/v1/trending_cache`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!ins.ok) { console.error('Insert failed:', await ins.text()); process.exit(1); }
  console.log(`Saved ${rows.length} topics: ${rows.map(r => '"' + r.topic + '"').join(', ')}`);

  // Clean up rows older than 72 hours
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  await fetch(`${SUPA_URL}/rest/v1/trending_cache?stored_at=lt.${cutoff}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY },
  });
  console.log('Old topics cleaned up.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(err.name === 'AbortError' ? 0 : 1); // timeout is non-fatal
} finally {
  clearTimeout(tid);
}
