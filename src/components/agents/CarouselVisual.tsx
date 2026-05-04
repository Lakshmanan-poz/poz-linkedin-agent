"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────────────── */
export type CarouselSlide = { position: number; type: string; title: string; body: string };

interface CarouselVisualProps {
  slides: CarouselSlide[];
  day?: string;
  contentType?: string;
}

/* ── Day theme map ───────────────────────────────────────────────────────────── */
const DAY_THEME: Record<string, { from: string; via: string; to: string; accent: string; dot: string }> = {
  Monday:    { from: "from-blue-950",   via: "via-indigo-900",  to: "to-slate-900",  accent: "text-blue-300",   dot: "bg-blue-400"   },
  Tuesday:   { from: "from-purple-950", via: "via-violet-900",  to: "to-slate-900",  accent: "text-purple-300", dot: "bg-purple-400" },
  Wednesday: { from: "from-orange-950", via: "via-amber-900",   to: "to-slate-900",  accent: "text-orange-300", dot: "bg-orange-400" },
  Thursday:  { from: "from-emerald-950",via: "via-teal-900",    to: "to-slate-900",  accent: "text-emerald-300",dot: "bg-emerald-400"},
  Friday:    { from: "from-rose-950",   via: "via-pink-900",    to: "to-slate-900",  accent: "text-rose-300",   dot: "bg-rose-400"   },
};
const DEFAULT_THEME = { from: "from-slate-900", via: "via-slate-800", to: "to-slate-900", accent: "text-blue-300", dot: "bg-blue-400" };

/* ── Chevron icons ───────────────────────────────────────────────────────────── */
function ChevLeft()  { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>; }
function ChevRight() { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>; }

/* ── POZ mini logo ───────────────────────────────────────────────────────────── */
function PozMini() {
  return (
    <div className="w-7 h-7 rounded-lg bg-linear-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shadow-md shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="2"  x2="12" y2="6"/>  <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="6"  y2="12"/> <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="4.93"  x2="7.76" y2="7.76"/>  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/> <line x1="16.24" y1="7.76"  x2="19.07" y2="4.93"/>
      </svg>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function CarouselVisual({ slides, day, contentType }: CarouselVisualProps) {
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir]  = useState<"left" | "right" | null>(null);

  const theme = (day && DAY_THEME[day]) ? DAY_THEME[day] : DEFAULT_THEME;
  const slide = slides[current];
  const total = slides.length;

  function go(dir: "prev" | "next") {
    setAnimDir(dir === "next" ? "left" : "right");
    setTimeout(() => {
      setCurrent((c) => dir === "next" ? Math.min(c + 1, total - 1) : Math.max(c - 1, 0));
      setAnimDir(null);
    }, 120);
  }

  if (!slide) return null;

  const isCta  = slide.position === total;
  const isHook = slide.position === 1;

  return (
    <div className="select-none">
      {/* ── Slide card (square ratio) ── */}
      <div
        className={cn(
          "relative w-full aspect-square rounded-2xl overflow-hidden bg-linear-to-br shadow-2xl",
          theme.from, theme.via, theme.to
        )}
        style={{ maxWidth: 420, margin: "0 auto" }}
      >
        {/* Decorative large number watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[200px] font-black text-white/[0.03] leading-none tabular-nums">
            {String(slide.position).padStart(2, "0")}
          </span>
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5">
          <PozMini />
          <div className="flex items-center gap-2">
            {contentType && (
              <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10", theme.accent)}>
                {slide.type}
              </span>
            )}
            <span className="text-white/40 text-xs font-mono tabular-nums">
              {String(slide.position).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-center px-8 py-16 transition-all duration-100",
            animDir === "left"  && "-translate-x-4 opacity-0",
            animDir === "right" && "translate-x-4 opacity-0"
          )}
        >
          {/* Title */}
          <p className={cn(
            "font-black leading-tight mb-5",
            "text-white",
            slide.title.length > 30 ? "text-2xl" : "text-3xl"
          )}>
            {slide.title}
          </p>

          {/* Body */}
          <p className="text-white/65 text-sm leading-relaxed font-medium">
            {slide.body}
          </p>

          {/* CTA decoration */}
          {isCta && (
            <div className={cn("mt-5 text-xs font-semibold", theme.accent)}>
              pointonezero.com
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 pb-5">
          {/* Prev button */}
          <button
            onClick={() => go("prev")}
            disabled={current === 0}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all text-white",
              current === 0 ? "opacity-0 pointer-events-none" : "bg-white/15 hover:bg-white/25"
            )}
          >
            <ChevLeft />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === current
                    ? cn("w-5 h-1.5", theme.dot)
                    : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50"
                )}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => go("next")}
            disabled={current === total - 1}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all text-white",
              current === total - 1 ? "opacity-0 pointer-events-none" : "bg-white/15 hover:bg-white/25"
            )}
          >
            <ChevRight />
          </button>
        </div>

        {/* Left/right swipe areas */}
        <div className="absolute left-0 top-12 bottom-12 w-1/4 cursor-pointer" onClick={() => current > 0 && go("prev")} />
        <div className="absolute right-0 top-12 bottom-12 w-1/4 cursor-pointer" onClick={() => current < total - 1 && go("next")} />
      </div>

      {/* ── Slide type label ── */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {slides.map((sl, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all",
              i === current
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {String(sl.position).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}
