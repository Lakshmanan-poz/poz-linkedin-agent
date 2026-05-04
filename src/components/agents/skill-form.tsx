"use client";

import { cn } from "@/lib/utils";

interface SkillFormProps {
  skillName: string;
  skillDescription: string;
  onGenerate: () => void;
  generating: boolean;
  hasOutput: boolean;
  children: React.ReactNode;
}

export function SkillForm({
  skillName,
  skillDescription,
  onGenerate,
  generating,
  hasOutput,
  children,
}: SkillFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{skillName}</h3>
        <p className="text-sm text-muted-foreground mt-1">{skillDescription}</p>
      </div>

      <div className="grid gap-4">{children}</div>

      <button
        onClick={onGenerate}
        disabled={generating}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
          generating
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {generating ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </>
        ) : hasOutput ? (
          "Regenerate"
        ) : (
          "Generate with AI"
        )}
      </button>
    </div>
  );
}

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
