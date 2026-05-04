"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/user-provider";
import { AuthRole } from "@/lib/types";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const MIN_W     = 56;
const DEFAULT_W = 252;
const MAX_W     = 320;
const LABEL_MIN = 130;

const LS_WIDTH     = "poz-sidebar-width";
const LS_COLLAPSED = "poz-sidebar-collapsed";

/* ─── Nav config ─────────────────────────────────────────────────────────────── */
type NavItem    = { href: string; label: string; icon: string; roles: AuthRole[] };
type NavSection = { title?: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard",     label: "Dashboard",      icon: "BarChart3",      roles: ["admin", "superadmin"] },
      { href: "/dashboard",     label: "My Dashboard",   icon: "BarChart3",      roles: ["employee", "designer"] },
      { href: "/design",        label: "Design Queue",   icon: "Palette",        roles: ["designer"] },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/agent-catalog", label: "Agent Catalog",  icon: "Layers",         roles: ["employee", "designer", "admin", "superadmin"] },
      { href: "/posts",         label: "My Posts",       icon: "FileText",       roles: ["employee"] },
      { href: "/posts",         label: "All Posts",      icon: "FileText",       roles: ["admin", "superadmin"] },
      { href: "/posts/new",     label: "Create Post",    icon: "PlusCircle",     roles: ["employee", "admin", "superadmin"] },
      { href: "/content-status",label: "Content Status", icon: "ClipboardList",  roles: ["employee", "admin", "superadmin"] },
    ],
  },
  {
    title: "Workflow",
    items: [
      { href: "/review",        label: "Review Queue",   icon: "ClipboardCheck", roles: ["admin", "superadmin"] },
      { href: "/calendar",      label: "Calendar",       icon: "Calendar",       roles: ["employee", "admin", "superadmin", "designer"] },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/team",          label: "Team",           icon: "Users",          roles: ["admin", "superadmin"] },
      { href: "/agents",        label: "Agents",         icon: "Bot",            roles: ["superadmin"] },
      { href: "/settings",      label: "Settings",       icon: "Settings",       roles: ["superadmin"] },
    ],
  },
];

const EXACT_MATCH_ROUTES = new Set(["/dashboard", "/design", "/review", "/posts", "/posts/new", "/content-status"]);

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
const iconMap: Record<string, React.ReactNode> = {
  BarChart3:      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  FileText:       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
  PlusCircle:     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
  Calendar:       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
  Layout:         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  Users:          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bot:            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
  Layers:         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
  Settings:       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  ClipboardCheck: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>,
  ClipboardList:  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  Palette:        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
};

/* ─── Toggle icons ───────────────────────────────────────────────────────────── */
function IcoPanelOpen() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>;
}
function IcoPanelClose() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>;
}

/* ─── POZ logo ───────────────────────────────────────────────────────────────── */
function PozLogo({ size = 30 }: { size?: number }) {
  return (
    <div
      className="rounded-xl bg-linear-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shadow-lg shrink-0"
      style={{ width: size, height: size }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.44} height={size * 0.44} viewBox="0 0 24 24"
        fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="2"  x2="12" y2="6"/>  <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="6"  y2="12"/>  <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="4.93"  x2="7.76" y2="7.76"/>  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="4.93"  y1="19.07" x2="7.76"  y2="16.24"/> <line x1="16.24" y1="7.76"  x2="19.07" y2="4.93"/>
      </svg>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export function Sidebar() {
  const pathname             = usePathname();
  const { authRole, currentUser } = useUser();

  const [width,     setWidth]     = useState(DEFAULT_W);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    const storedW = localStorage.getItem(LS_WIDTH);
    const storedC = localStorage.getItem(LS_COLLAPSED);
    if (storedW) setWidth(Math.max(MIN_W, Math.min(MAX_W, parseInt(storedW, 10))));
    if (storedC === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  useEffect(() => { if (mounted) localStorage.setItem(LS_WIDTH, String(width)); }, [width, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem(LS_COLLAPSED, String(collapsed)); }, [collapsed, mounted]);

  /* Drag-to-resize */
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startW   = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    const newW  = Math.max(MIN_W, Math.min(MAX_W, startW.current + delta));
    setWidth(newW);
    setCollapsed(newW <= MIN_W + 10);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor     = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup",   onMouseUp);
  }, [onMouseMove]);

  function onHandleMouseDown(e: React.MouseEvent) {
    dragging.current    = true;
    startX.current      = e.clientX;
    startW.current      = collapsed ? MIN_W : width;
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
    e.preventDefault();
  }

  function toggle() {
    if (collapsed) { setCollapsed(false); setWidth(DEFAULT_W); }
    else           { setCollapsed(true);  setWidth(MIN_W); }
  }

  const effectiveWidth = collapsed ? MIN_W : width;
  const showLabels     = !collapsed && effectiveWidth >= LABEL_MIN;

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleLabel: Record<string, string> = {
    superadmin: "Super Admin", admin: "Admin",
    employee: "Employee", designer: "Designer",
  };

  return (
    <aside
      className="relative flex flex-col h-full overflow-hidden select-none transition-[width] duration-200"
      style={{
        width: effectiveWidth, minWidth: effectiveWidth, maxWidth: effectiveWidth,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
      suppressHydrationWarning
    >

      {/* ── Logo / Header ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center shrink-0 overflow-hidden",
          showLabels ? "gap-3 px-4 py-[18px]" : "flex-col gap-2 px-0 py-4"
        )}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <PozLogo size={32} />

        {showLabels && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-bold tracking-tight truncate leading-tight" style={{ color: "var(--sidebar-accent-foreground)" }}>
              POZ Social
            </p>
            <p className="text-[10px] font-medium truncate leading-tight" style={{ color: "var(--sidebar-foreground)" }}>
              AI Content Platform
            </p>
          </div>
        )}

        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "shrink-0 flex items-center justify-center rounded-lg transition-all duration-150",
            showLabels ? "w-7 h-7" : "w-8 h-8 mt-1"
          )}
          style={{ color: "var(--sidebar-foreground)", opacity: 0.55 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.55")}
        >
          {collapsed ? <IcoPanelOpen /> : <IcoPanelClose />}
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4">
        {NAV_SECTIONS.map((section, si) => {
          const visible = section.items.filter(
            (item) => authRole && item.roles.includes(authRole)
          );
          if (visible.length === 0) return null;

          return (
            <div key={si}>
              {/* Section label */}
              {section.title && showLabels && (
                <p
                  className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}
                >
                  {section.title}
                </p>
              )}
              {section.title && !showLabels && si > 0 && (
                <div className="mx-auto w-6 mb-2" style={{ borderTop: "1px solid var(--sidebar-border)" }} />
              )}

              <div className="space-y-0.5">
                {visible.map((item) => {
                  const active = EXACT_MATCH_ROUTES.has(item.href)
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <div
                      key={`${item.href}-${item.label}`}
                      className={cn("relative", showLabels ? "px-3" : "px-2")}
                    >
                      {/* Active left indicator */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: "var(--sidebar-primary)" }}
                        />
                      )}
                      <Link
                        href={item.href}
                        title={!showLabels ? item.label : undefined}
                        className={cn(
                          "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
                          showLabels ? "gap-2.5 px-2.5 py-[7px]" : "justify-center p-2.5"
                        )}
                        style={
                          active
                            ? {
                                background: "var(--sidebar-accent)",
                                color: "var(--sidebar-accent-foreground)",
                                fontWeight: 600,
                              }
                            : {
                                color: "var(--sidebar-foreground)",
                              }
                        }
                        onMouseEnter={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = "var(--sidebar-accent)";
                            (e.currentTarget as HTMLElement).style.color = "var(--sidebar-accent-foreground)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = "var(--sidebar-foreground)";
                          }
                        }}
                      >
                        <span
                          className="shrink-0"
                          style={{ color: active ? "var(--sidebar-primary)" : "inherit" }}
                        >
                          {iconMap[item.icon]}
                        </span>
                        {showLabels && <span className="truncate">{item.label}</span>}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User profile footer ────────────────────────────────────────────── */}
      {currentUser && (
        <div
          className="shrink-0 px-3 py-3 overflow-hidden"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <div
            className={cn(
              "flex items-center rounded-lg px-2 py-2 gap-2.5 overflow-hidden",
              showLabels ? "" : "justify-center"
            )}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm"
              style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}
            >
              {initials}
            </div>

            {showLabels && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: "var(--sidebar-accent-foreground)" }}>
                  {currentUser.name}
                </p>
                <p className="text-[10px] truncate leading-tight capitalize" style={{ color: "var(--sidebar-foreground)", opacity: 0.6 }}>
                  {roleLabel[authRole ?? ""] ?? authRole}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Resize handle ─────────────────────────────────────────────────── */}
      <div
        onMouseDown={onHandleMouseDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize z-50 opacity-0 hover:opacity-100 transition-opacity duration-150"
        style={{ background: "var(--sidebar-primary)" }}
        title="Drag to resize"
      />
    </aside>
  );
}
