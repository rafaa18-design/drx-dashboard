"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon, FunnelIcon, UsersIcon, ChatIcon,
  CalendarIcon, ClockIcon, GearIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/dashboard",     label: "Dashboard",    Icon: DashboardIcon },
  { href: "/kanban",        label: "Funil",        Icon: FunnelIcon },
  { href: "/leads",         label: "Leads",        Icon: UsersIcon },
  { href: "/conversations", label: "Atendimento",  Icon: ChatIcon },
  { href: "/appointments",  label: "Agendamentos", Icon: CalendarIcon },
  { href: "/follow-up",     label: "Follow-up",    Icon: ClockIcon },
  { href: "/settings",      label: "Configurações",Icon: GearIcon },
];

export function Sidebar({
  collapsed,
  onToggle,
  attentionCount = 0,
}: {
  collapsed: boolean;
  onToggle: () => void;
  attentionCount?: number;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col bg-white transition-[width] duration-200 ease-out flex-shrink-0"
      style={{ width: collapsed ? 72 : 240, borderRight: "1px solid var(--line)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center px-4"
        style={{ height: 92, borderBottom: "1px solid var(--line-soft)" }}
      >
        <div style={{ height: 80, width: 80, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "var(--r-sm)" }}>
          <img
            src="/logo-oficial.png"
            alt="DR&X"
            style={{ height: "100%", width: "100%", objectFit: "contain", display: "block" }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const showBadge = href === "/conversations" && attentionCount > 0;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`relative flex items-center gap-3 text-sm font-medium ${collapsed ? "justify-center" : ""}`}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                color: active ? "var(--accent)" : "var(--ink-3)",
                background: active ? "var(--accent-soft)" : "transparent",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" />
                {collapsed && showBadge && (
                  <span
                    className="absolute -top-1 -right-1 rounded-full border-2 border-white"
                    style={{ height: 10, width: 10, background: "var(--danger)" }}
                  />
                )}
              </span>
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && showBadge && (
                <span
                  className="font-mono text-white text-xs font-bold text-center leading-none"
                  style={{ marginLeft: "auto", borderRadius: "var(--r-full)", background: "var(--danger)", padding: "2px 6px", minWidth: 20 }}
                >
                  {attentionCount > 99 ? "99+" : attentionCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Expandir" : "Recolher"}
        className={`flex items-center gap-3 px-4 py-3 text-sm cursor-pointer ${collapsed ? "justify-center" : ""}`}
        style={{ borderTop: "1px solid var(--line-soft)", color: "var(--ink-3)", background: "none" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--ink)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-3)"; }}
      >
        {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        {!collapsed && <span>Recolher</span>}
      </button>
    </aside>
  );
}
