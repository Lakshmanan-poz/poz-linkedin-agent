"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useUser } from "@/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  employee: "Employee",
  admin: "Admin",
  designer: "Designer",
  superadmin: "Super Admin",
};

const roleBadgeClass: Record<string, string> = {
  employee: "bg-muted text-muted-foreground",
  admin: "bg-blue-100 text-blue-700",
  designer: "bg-purple-100 text-purple-700",
  superadmin: "bg-red-100 text-red-700",
};

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle theme"
      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {mounted ? (theme === "dark" ? <SunIcon /> : <MoonIcon />) : <MoonIcon />}
    </button>
  );
}

export function Header() {
  const router = useRouter();
  const { currentUser, authRole } = useUser();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-2">
        {currentUser && (
          <>
            <span className="text-sm font-medium">{currentUser.name}</span>
            {authRole && (
              <Badge variant="secondary" className={roleBadgeClass[authRole] || ""}>
                {roleLabels[authRole] || authRole}
              </Badge>
            )}
          </>
        )}
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
