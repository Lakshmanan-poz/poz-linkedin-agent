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

/* ─── Chat session type (minimal) ────────────────────────────────────────────── */
type SidebarChatSession = { session_id: string; title: string; last_message_at: string; messages: unknown[]; share_token?: string; is_shared?: boolean };

function fmtChatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000)     return "just now";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export function Sidebar() {
  const pathname             = usePathname();
  const { authRole, currentUser } = useUser();

  const [width,       setWidth]       = useState(DEFAULT_W);
  const [collapsed,   setCollapsed]   = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* chat history (agent-catalog page only) */
  const [chatSessions,  setChatSessions]  = useState<SidebarChatSession[]>([]);
  const [chatLoading,   setChatLoading]   = useState(false);
  const [activeChatId,  setActiveChatId]  = useState<string | null>(null);
  const [chatSearch,    setChatSearch]    = useState("");
  const [openMenuId,    setOpenMenuId]    = useState<string | null>(null);
  const [shareToast,    setShareToast]    = useState<{ type: "success" | "error" } | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [sharingId,     setSharingId]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => setUnreadCount((d?.notifications ?? []).filter((n: {is_read: boolean}) => !n.is_read).length))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const handler = () => setUnreadCount(0);
    window.addEventListener("notifications-read", handler);
    return () => window.removeEventListener("notifications-read", handler);
  }, []);

  /* load chat history when entering agent-catalog */
  useEffect(() => {
    if (pathname !== "/agent-catalog") return;
    setChatLoading(true);
    fetch("/api/agents/chat-history")
      .then(r => r.json())
      .then(d => setChatSessions(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setChatLoading(false));
  }, [pathname]);

  /* close share menu when clicking outside */
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [openMenuId]);

  async function handleShareSession(sessionId: string) {
    setSharingId(sessionId);
    setOpenMenuId(null);
    setShareToast(null);
    try {
      const res  = await fetch("/api/agents/chat-history/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (data.share_url) {
        try {
          await navigator.clipboard.writeText(data.share_url);
        } catch {
          // Clipboard blocked — show the URL directly
          window.prompt("Copy this share link:", data.share_url);
        }
        setShareToast({ type: "success" });
        setTimeout(() => setShareToast(null), 2500);
      } else {
        setShareToast({ type: "error" });
        setTimeout(() => setShareToast(null), 3500);
      }
    } catch {
      setShareToast({ type: "error" });
      setTimeout(() => setShareToast(null), 3500);
    } finally {
      setSharingId(null);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    setDeletingId(sessionId);
    try {
      await fetch(`/api/agents/chat-history?session_id=${sessionId}`, { method: "DELETE" });
      setChatSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (activeChatId === sessionId) {
        setActiveChatId(null);
        window.dispatchEvent(new CustomEvent("agent-catalog-new-chat"));
      }
    } finally {
      setDeletingId(null);
    }
  }

  /* keep in sync when agent-catalog page saves/deletes sessions */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail?.sessions)) setChatSessions(detail.sessions);
      if (detail?.activeId !== undefined) setActiveChatId(detail.activeId);
    };
    window.addEventListener("agent-catalog-sessions-updated", handler);
    return () => window.removeEventListener("agent-catalog-sessions-updated", handler);
  }, []);

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

  /* chat session groups for history panel */
  const chatSessionGroups = (() => {
    const filtered = chatSearch.trim()
      ? chatSessions.filter(s => s.title?.toLowerCase().includes(chatSearch.toLowerCase()))
      : chatSessions;
    const now = Date.now();
    const today: SidebarChatSession[] = [], week: SidebarChatSession[] = [], older: SidebarChatSession[] = [];
    filtered.forEach(s => {
      const diff = now - new Date(s.last_message_at).getTime();
      if (diff < 86_400_000)       today.push(s);
      else if (diff < 604_800_000) week.push(s);
      else                          older.push(s);
    });
    const groups: { label: string; items: SidebarChatSession[] }[] = [];
    if (today.length) groups.push({ label: "Today", items: today });
    if (week.length)  groups.push({ label: "This Week", items: week });
    if (older.length) groups.push({ label: "Older", items: older });
    return groups;
  })();

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
                        <span className="relative shrink-0" style={{ color: active ? "var(--sidebar-primary)" : "inherit" }}>
                          {iconMap[item.icon]}
                          {unreadCount > 0 && item.href === "/dashboard" && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-gray-900" />
                          )}
                        </span>
                        {showLabels && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}
                        {showLabels && unreadCount > 0 && item.href === "/dashboard" && (
                          <span className="shrink-0 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Chat history (agent-catalog only) ───────────────────────────── */}
        {pathname === "/agent-catalog" && showLabels && (
          <div className="pt-3 mx-1" style={{ borderTop: "1px solid var(--sidebar-border)" }}>

            {/* Section label */}
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}>
              Conversations
            </p>

            {/* New chat button */}
            <div className="px-2 pb-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("agent-catalog-new-chat"))}
                className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "var(--sidebar-accent)", color: "var(--sidebar-primary)", border: "1px solid var(--sidebar-border)" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                New chat
              </button>
            </div>

            {/* Search */}
            <div className="px-2 pb-2">
              <input
                value={chatSearch}
                onChange={e => setChatSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg outline-none focus:ring-1"
                style={{
                  background: "var(--sidebar-accent)",
                  color: "var(--sidebar-foreground)",
                  border: "1px solid var(--sidebar-border)",
                }}
              />
            </div>

            {/* Share toast — rendered outside scroll so it's never clipped */}
            {shareToast && (
              <div
                className="mx-2 mb-2 px-3 py-2 rounded-lg text-[11px] font-semibold text-white text-center transition-all"
                style={{ background: shareToast.type === "success" ? "#16a34a" : "#dc2626" }}
              >
                {shareToast.type === "success" ? "Link copied to clipboard!" : "Share failed — run DB migration"}
              </div>
            )}

            {/* Session list */}
            <div
              className="overflow-y-auto space-y-2 pb-3"
              style={{ maxHeight: "38vh", scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
            >
              {chatLoading && (
                <p className="text-[10px] text-center py-4" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}>Loading…</p>
              )}
              {!chatLoading && chatSessions.length === 0 && (
                <p className="text-[10px] text-center py-4 px-2 leading-relaxed" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}>
                  No chats yet. Start a conversation.
                </p>
              )}
              {!chatLoading && chatSessionGroups.map(group => (
                <div key={group.label}>
                  <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--sidebar-foreground)", opacity: 0.35 }}>
                    {group.label}
                  </p>
                  {group.items.map(s => {
                    const isActive = s.session_id === activeChatId;
                    return (
                      <div
                        key={s.session_id}
                        className="group/item relative flex items-center gap-1 rounded-lg cursor-pointer transition-all duration-100"
                        style={{
                          margin: "1px 4px",
                          background: isActive ? "var(--sidebar-accent)" : "transparent",
                          color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                          borderLeft: isActive ? "3px solid var(--sidebar-primary)" : "3px solid transparent",
                        }}
                        onClick={() => {
                          setOpenMenuId(null);
                          setActiveChatId(s.session_id);
                          window.dispatchEvent(new CustomEvent("agent-catalog-load-session", { detail: { session: s } }));
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-accent)"; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        {/* Chat icon */}
                        <div className="shrink-0 pl-2 py-2.5 opacity-40">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        </div>

                        {/* Title */}
                        <div className="flex-1 min-w-0 py-2.5 pr-1">
                          <p className="text-[12px] font-medium truncate leading-snug">{s.title ?? "Untitled"}</p>
                        </div>

                        {/* Action button — visible on hover */}
                        <div className="shrink-0 pr-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === s.session_id ? null : s.session_id);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
                            style={{ color: "var(--sidebar-foreground)" }}
                            title="More options"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                            </svg>
                          </button>
                        </div>

                        {/* Dropdown menu — ChatGPT style */}
                        {openMenuId === s.session_id && (
                          <div
                            className="absolute right-1 top-full mt-1 z-50 w-44 rounded-xl shadow-xl overflow-hidden py-1"
                            style={{ background: "var(--sidebar)", border: "1px solid var(--sidebar-border)" }}
                            onClick={e => e.stopPropagation()}
                          >
                            {/* Share */}
                            <button
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-left transition-colors"
                              style={{ color: "var(--sidebar-foreground)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "var(--sidebar-accent)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              disabled={sharingId === s.session_id}
                              onClick={() => handleShareSession(s.session_id)}
                            >
                              {sharingId === s.session_id ? (
                                <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                              )}
                              {sharingId === s.session_id ? "Generating…" : "Share & copy link"}
                            </button>

                            <div style={{ height: 1, background: "var(--sidebar-border)", margin: "2px 0" }} />

                            {/* Delete */}
                            <button
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-left text-red-500 transition-colors"
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              disabled={deletingId === s.session_id}
                              onClick={() => { setOpenMenuId(null); handleDeleteSession(s.session_id); }}
                            >
                              {deletingId === s.session_id ? (
                                <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                  <path d="M10 11v6"/><path d="M14 11v6"/>
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                              )}
                              {deletingId === s.session_id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
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
