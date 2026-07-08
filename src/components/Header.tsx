"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogoutIcon, MenuIcon } from "./icons";

const TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/kanban":        "Funil de Leads",
  "/leads":         "Leads",
  "/conversations": "Atendimento",
  "/appointments":  "Agendamentos",
  "/follow-up":     "Follow-up",
  "/settings":      "Configurações",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  for (const prefix of Object.keys(TITLES)) {
    if (pathname.startsWith(prefix + "/")) return TITLES[prefix];
  }
  return "DR&X";
}

export function Header({ username, onMenuClick }: { username: string; onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("drx_token");
    router.replace("/login");
  }

  return (
    <header
      className="flex items-center justify-between bg-white px-5 sm:px-8"
      style={{ height: 72, borderBottom: "1px solid var(--line)", flexShrink: 0 }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden"
          style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="font-display font-semibold truncate" style={{ fontSize: 22, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {titleFor(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="hidden sm:inline" style={{ fontSize: 13, color: "var(--ink-3)" }}>
          {username}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          title="Sair"
          className="flex items-center gap-2"
          style={{
            borderRadius: "var(--r-md)", padding: "8px 12px", fontSize: 13, fontWeight: 500,
            color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--ink)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-3)"; }}
        >
          <LogoutIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
