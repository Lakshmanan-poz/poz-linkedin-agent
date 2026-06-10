"use client";

const CONTENT_CALENDAR = [
  {
    day: "Monday",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    type: "Thought Leadership",
    focus: "Break down an AI trend and connect it to business outcomes.",
  },
  {
    day: "Tuesday",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    type: "Engagement Post",
    focus: "Ask a thought-provoking question about a challenge in your target industry.",
  },
  {
    day: "Wednesday",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
    type: "Tool Spotlight",
    focus: "Analyze a new AI tool (e.g. Google Stitch vs Figma) with your team's expert perspective.",
  },
  {
    day: "Thursday",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    type: "Industry Insight",
    focus: "Share updates relevant to sectors your clients operate in.",
  },
  {
    day: "Friday",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    type: "Forward-Looking",
    focus: "Share a prediction or lesson learned from your work this week.",
  },
];

export default function CalendarPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto py-8 px-4">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Weekly Content Calendar</h2>
        <p className="text-sm text-muted-foreground mt-1">Monday to Friday</p>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Post <span className="font-semibold text-foreground">twice a week minimum</span>, up to five times for maximum reach.
          Each post should feel like it comes from your team&apos;s lived experience — not a news feed.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[140px_1fr] bg-primary text-primary-foreground">
          <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest">Day</div>
          <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest border-l border-primary-foreground/20">Content Focus</div>
        </div>

        {/* Rows */}
        {CONTENT_CALENDAR.map((row, i) => (
          <div
            key={row.day}
            className={`grid grid-cols-[140px_1fr] border-t border-border transition-colors hover:bg-muted/40 ${i % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
          >
            {/* Day cell */}
            <div className={`px-5 py-4 flex flex-col gap-1.5 border-r border-border ${row.bg}`}>
              <span className={`text-sm font-bold ${row.color}`}>{row.day}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${row.badge}`}>
                {row.type}
              </span>
            </div>

            {/* Focus cell */}
            <div className="px-5 py-4 flex items-center">
              <p className="text-sm text-foreground leading-relaxed">{row.focus}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
