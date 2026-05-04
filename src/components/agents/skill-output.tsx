"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SkillOutputProps {
  output: Record<string, unknown>;
  onSave: (title: string) => void;
  saving: boolean;
  saved: boolean;
  children: React.ReactNode;
}

export function SkillOutput({
  output,
  onSave,
  saving,
  saved,
  children,
}: SkillOutputProps) {
  const [title, setTitle] = useState("");

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    toast.success("Copied JSON to clipboard");
  };

  return (
    <div className="space-y-4 border-t pt-6 mt-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Generated Output
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={copyJson}
            className="text-xs px-3 py-1.5 border rounded-md hover:bg-accent transition-colors"
          >
            Copy JSON
          </button>
        </div>
      </div>

      {/* Skill-specific output rendering */}
      <div className="space-y-4">{children}</div>

      {/* Save section */}
      {!saved && (
        <div className="flex items-center gap-3 border-t pt-4 mt-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this output a title..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => onSave(title || "Untitled Output")}
            disabled={saving}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              saving
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {saving ? "Saving..." : "Save Output"}
          </button>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 border-t pt-4 mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Output saved successfully
        </div>
      )}
    </div>
  );
}

// Reusable output display helpers
export function OutputSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <h5 className="text-sm font-semibold mb-2">{title}</h5>
      {children}
    </div>
  );
}

export function OutputList({ items, color }: { items: string[]; color?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className={cn("text-sm flex items-start gap-2", color)}>
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function OutputBadge({
  label,
  color,
}: {
  label: string;
  color: "red" | "green" | "yellow" | "blue" | "gray" | "purple";
}) {
  const colors = {
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", colors[color])}>
      {label}
    </span>
  );
}

export function OutputCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border rounded-lg p-4", className)}>
      {title && <h5 className="text-sm font-semibold mb-2">{title}</h5>}
      {children}
    </div>
  );
}
