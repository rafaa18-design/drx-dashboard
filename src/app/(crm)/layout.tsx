"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",      code: "01" },
  { href: "/kanban",        label: "Funil",          code: "02" },
  { href: "/leads",         label: "Leads",          code: "03" },
  { href: "/conversations", label: "Atendimento",    code: "04" },
  { href: "/appointments",  label: "Agendamentos",   code: "05" },
  { href: "/follow-up",    label: "Follow-up",      code: "06" },
];

function getUsername(): string {
  try {
    const token = localStorage.getItem("drx_token") ?? "";
    const [encoded] = token.split(".");
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    const payload = JSON.parse(json);
    return payload.sub ?? "usuário";
  } catch {
    return "usuário";
  }
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("drx_token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthed(true);
      setUsername(getUsername());
    }
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <span
          className="font-mono"
          style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.2em", textTransform: "uppercase" }}
        >
          Verificando acesso...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 flex flex-col flex-shrink-0 h-screen
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Logo */}
        <div className="px-6 py-7 flex flex-col items-center" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          <div style={{ height: 38, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <img
              src="/logo-oficial.png"
              alt="DR&X"
              style={{ height: 96, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
            />
          </div>
          <p className="font-mono text-center" style={{ fontSize: 9, color: "var(--sidebar-text)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Sistema Comercial
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                style={{
                  background: active ? "var(--sidebar-active)" : "transparent",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                <span className="font-mono" style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                  color: active ? "var(--accent)" : "rgba(255,255,255,0.25)",
                  minWidth: 20,
                }}>
                  {item.code}
                </span>
                <span style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#FFFFFF" : "var(--sidebar-text)",
                }}>
                  {item.label}
                </span>
                {active && (
                  <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2" style={{ background: "var(--sidebar-surface)" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "white", fontWeight: 700, fontFamily: "JetBrains Mono",
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="font-mono truncate" style={{ fontSize: 11, color: "#FFFFFF", fontWeight: 600 }}>
                {username}
              </p>
              <p className="font-mono" style={{ fontSize: 9, color: "var(--sidebar-text)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                DRX Advogados
              </p>
            </div>
          </div>

          <button
            onClick={() => { localStorage.removeItem("drx_token"); router.replace("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-mono"
            style={{
              background: "transparent",
              border: "1px solid var(--sidebar-border)",
              color: "var(--sidebar-text)",
              fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
              fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = "rgba(26,86,219,0.15)";
              b.style.borderColor = "rgba(26,86,219,0.4)";
              b.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = "transparent";
              b.style.borderColor = "var(--sidebar-border)";
              b.style.color = "var(--sidebar-text)";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sair da conta
          </button>

          <p className="font-mono px-1 mt-3" style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Asani × DRX · v1.1
          </p>
        </div>
      </aside>

      {/* ── Conteúdo principal ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Mobile topbar */}
        <header
          className="flex items-center justify-between px-4 py-3 lg:hidden"
          style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg"
            style={{ color: "var(--ink-2)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <span className="font-display font-bold" style={{ fontSize: 14, color: "var(--ink)" }}>
            DRX Advogados
          </span>
          <div style={{ width: 36 }} />
        </header>

        {/* Página */}
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 animate-fadeIn overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
