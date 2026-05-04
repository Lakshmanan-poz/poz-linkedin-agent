"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@/providers/user-provider";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      const authRole = data.user?.auth_role;
      await refreshUser();
      router.push(authRole === "employee" ? "/posts" : "/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center p-14 overflow-hidden select-none"
        style={{ background: "linear-gradient(145deg, #001e3c 0%, #003366 45%, #005599 75%, #0077bb 100%)" }}
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        />

        {/* Glow blobs */}
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #00AAEC, transparent 70%)" }} />
        <div className="absolute bottom-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #00AAEC, transparent 70%)" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">

          {/* Logo */}
          <div className="mb-8 drop-shadow-2xl">
            <Image src="/poz-logo.svg" alt="POZ Logo" width={90} height={90} priority />
          </div>

          <h1 className="text-5xl font-black text-white tracking-tight mb-1">POZ</h1>
          <p className="text-[#7dd3f8] text-lg font-semibold mb-1">Point One Zero</p>
          <p className="text-[#93c5d8] text-sm mb-10">AI-powered social media management</p>

          {/* Divider */}
          <div className="w-12 h-0.5 rounded-full mb-10 opacity-40" style={{ background: "#00AAEC" }} />

          {/* Feature list */}
          <div className="w-full flex flex-col gap-3">
            {[
              { icon: "✦", label: "Generate LinkedIn posts with AI" },
              { icon: "✦", label: "Team review & approval workflow" },
              { icon: "✦", label: "Weekly content calendar & scheduling" },
              { icon: "✦", label: "RAG — ask questions on your documents" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                style={{ background: "rgba(0,170,236,0.10)", border: "1px solid rgba(0,170,236,0.20)" }}
              >
                <span className="text-[#00AAEC] text-xs leading-none">{f.icon}</span>
                <span className="text-[#cce9f8] text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom brand tag */}
        <p className="absolute bottom-6 text-[#4a8aaa] text-xs">
          © {new Date().getFullYear()} Point One Zero · All rights reserved
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <Image src="/poz-logo.svg" alt="POZ Logo" width={56} height={56} priority />
          <h1 className="mt-3 text-2xl font-bold text-foreground">POZ Social</h1>
        </div>

        <div className="w-full max-w-[420px]">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">
              Welcome back 👋
            </h2>
            <p className="mt-1.5 text-muted-foreground text-[15px]">
              Sign in to your POZ workspace
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-sm font-medium text-foreground">
                  Email or Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="you@poz.ai"
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ "--tw-ring-color": "#00AAEC55" } as React.CSSProperties}
                    onFocus={(e) => (e.target.style.borderColor = "#00AAEC")}
                    onBlur={(e) => (e.target.style.borderColor = "")}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    onFocus={(e) => (e.target.style.borderColor = "#00AAEC")}
                    onBlur={(e) => (e.target.style.borderColor = "")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: loading ? "#00AAEC99" : "linear-gradient(135deg, #0099d6, #00AAEC)",
                  boxShadow: loading ? "none" : "0 4px 18px rgba(0,170,236,0.40)",
                  focusRingColor: "#00AAEC",
                } as React.CSSProperties}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Point One Zero &copy; {new Date().getFullYear()} · POZ Social Media Agent
          </p>
        </div>
      </div>
    </div>
  );
}
