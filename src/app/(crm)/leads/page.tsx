"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import type { Lead } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  new:        "Novo",
  contacted:  "Contactado",
  qualified:  "Qualificado",
  proposal:   "Proposta",
  won:        "Fechado",
  follow_up:  "Follow-up",
  lost:       "Perdido",
};

const LEVEL_LABELS: Record<string, string> = {
  auto_meeting: "Auto",
  hot:          "Quente",
  warm:         "Morno",
  cold:         "Frio",
  disqualified: "Desqualificado",
};

const LEVEL_BADGE: Record<string, string> = {
  auto_meeting: "badge-auto",
  hot:          "badge-hot",
  warm:         "badge-warm",
  cold:         "badge-cold",
  disqualified: "badge-disqualified",
};

const CASE_LABELS: Record<string, string> = {
  permanent_ban:        "Banimento permanente",
  temporary_restriction:"Restrição temporária",
  warning_only:         "Apenas aviso",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#C13584",
  tiktok:    "#0891B2",
  youtube:   "#B3261E",
  twitter:   "#1DA1F2",
  facebook:  "#1877F2",
  linkedin:  "#0A66C2",
};

const GARBAGE = new Set(["none", "null", "unknown", "undefined", ""]);

function clean(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return GARBAGE.has(t.toLowerCase()) ? null : t;
}

function leadDisplay(lead: Lead): { primary: string; secondary: string | null } {
  const name  = clean(lead.name);
  const phone = clean(lead.phone);
  if (name)  return { primary: name,  secondary: phone };
  if (phone) return { primary: phone, secondary: null };
  return { primary: "—", secondary: null };
}

function initials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function platformColor(p: string | null | undefined) {
  if (!p) return "var(--ink-3)";
  return PLATFORM_COLORS[p.toLowerCase()] ?? "var(--ink-3)";
}

function scoreColor(level: string | null): string {
  switch (level) {
    case "auto_meeting": return "var(--ok)";
    case "hot":          return "var(--danger)";
    case "warm":         return "var(--warn)";
    case "cold":         return "var(--ink-3)";
    default:             return "var(--ink-4)";
  }
}

function formatAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function IAToggle({ lead, onToggle, toggling }: { lead: Lead; onToggle: () => void; toggling: boolean }) {
  const on = lead.ai_active !== false;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      disabled={toggling}
      title={on ? "IA ativa — clique para pausar" : "IA pausada — clique para reativar"}
      className="ia-chip"
      data-on={on}
    >
      <span className={`ia-dot ${on ? "animate-pulse" : ""}`} style={{ background: on ? "var(--ok)" : "var(--danger)" }} />
      IA
    </button>
  );
}

export default function LeadsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: Record<string, string> = {};
  if (debouncedSearch) params.search = debouncedSearch;
  if (statusFilter) params.status = statusFilter;
  if (levelFilter) params.level = levelFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["leads", params],
    queryFn: () => api.getLeads(params),
  });

  const items = (data?.items ?? []) as Lead[];
  const hasFilters = !!(debouncedSearch || statusFilter || levelFilter);

  const deleteLead = useMutation({
    mutationFn: (id: string) => api.deleteLead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData(["leads", params]);
      qc.setQueryData(["leads", params], (old: { items: Lead[]; total: number } | undefined) =>
        old ? { ...old, items: old.items.filter((l) => l.id !== id), total: old.total - 1 } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads", params], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const toggleAI = useMutation({
    mutationFn: (lead: Lead) => api.toggleAI(lead.id),
    onMutate: async (lead) => {
      setTogglingIds((s) => new Set([...s, lead.id]));
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData(["leads", params]);
      qc.setQueryData(["leads", params], (old: { items: Lead[]; total: number } | undefined) =>
        old ? { ...old, items: old.items.map((l) => l.id === lead.id ? { ...l, ai_active: !l.ai_active } : l) } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["leads", params], ctx.prev); },
    onSettled: (_d, _e, lead) => {
      setTogglingIds((s) => { const n = new Set(s); n.delete(lead.id); return n; });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  function handleDelete(lead: Lead) {
    const name = lead.name || lead.phone || "este lead";
    if (!confirm(`Apagar ${name}? Esta ação não pode ser desfeita.`)) return;
    deleteLead.mutate(lead.id);
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
        Base de contatos capturados pelo Tiago, com filtros por status e nível de qualificação.
      </p>

      <div className="dc-card">
        {/* Toolbar */}
        <div className="dc-card-toolbar">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold" style={{ fontSize: 16, color: "var(--ink)" }}>Leads</span>
            <span className="dc-count-pill">{data?.total ?? 0}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="filter-input"
              style={{ width: 220 }}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="filter-select">
              <option value="">Todos os níveis</option>
              {Object.entries(LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setLevelFilter(""); }}
                style={{
                  fontSize: 13, fontWeight: 500, color: "var(--ink-3)",
                  border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "var(--r-md)",
                  padding: "0 14px", whiteSpace: "nowrap", cursor: "pointer",
                }}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Desktop: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="dc-thead">
              <tr>
                {["Lead", "Plataforma", "Caso", "Score", "Nível", "Status", "IA", ""].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="dc-tbody">
              {items.map((lead) => {
                const { primary, secondary } = leadDisplay(lead);
                const plat = clean(lead.platform);
                const caseType = clean(lead.case_type);
                return (
                  <tr key={lead.id} className="row-hover">
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="font-display font-semibold flex items-center justify-center flex-shrink-0"
                          style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 12 }}
                        >
                          {initials(primary === "—" ? "?" : primary)}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/leads/${lead.id}`} className="block truncate" style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}>
                            {primary}
                          </Link>
                          {secondary && <p className="truncate" style={{ fontSize: 12, color: "var(--ink-3)" }}>{secondary}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {plat ? (
                        <span className="badge-pill" style={{ color: platformColor(plat), background: `${platformColor(plat)}14` }}>
                          {plat}
                        </span>
                      ) : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 180 }}>
                      {caseType ? (CASE_LABELS[caseType] ?? caseType) : "—"}
                    </td>
                    <td style={{ minWidth: 100 }}>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold" style={{ fontSize: 14, color: scoreColor(lead.qualification_level) }}>
                          {lead.qualification_score}
                        </span>
                        <div style={{ width: 42, height: 4, background: "var(--line-soft)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, lead.qualification_score))}%`, background: scoreColor(lead.qualification_level) }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      {lead.qualification_level ? (
                        <span className={`badge-pill ${LEVEL_BADGE[lead.qualification_level] ?? ""}`}>
                          {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level}
                        </span>
                      ) : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                      {STATUS_LABELS[lead.commercial_status] ?? lead.commercial_status}
                    </td>
                    <td>
                      <IAToggle lead={lead} toggling={togglingIds.has(lead.id)} onToggle={() => toggleAI.mutate(lead)} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-3">
                        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>{formatAgo(lead.created_at)}</span>
                        <button
                          onClick={() => handleDelete(lead)}
                          disabled={deleteLead.isPending}
                          title="Apagar lead"
                          style={{
                            color: "var(--ink-4)", cursor: "pointer", display: "flex",
                            opacity: deleteLead.isPending ? 0.4 : 1, background: "none", border: "none",
                            borderRadius: "var(--r-sm)", padding: 6,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(179,38,30,0.08)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-4)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {isLoading && (
            <div className="text-center" style={{ padding: "48px 0" }}>
              <span style={{ fontSize: 13, color: "var(--ink-4)" }}>Carregando leads...</span>
            </div>
          )}
          {!isLoading && !items.length && <EmptyState hasFilters={hasFilters} />}
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden">
          {items.map((lead, idx) => {
            const { primary, secondary } = leadDisplay(lead);
            const plat = clean(lead.platform);
            return (
              <div key={lead.id} className="p-4" style={{ borderTop: idx === 0 ? "none" : "1px solid var(--line-soft)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="font-display font-semibold flex items-center justify-center flex-shrink-0"
                      style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 13 }}
                    >
                      {initials(primary === "—" ? "?" : primary)}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/leads/${lead.id}`} className="block truncate" style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", textDecoration: "none" }}>
                        {primary}
                      </Link>
                      {secondary && <p className="truncate" style={{ fontSize: 12, color: "var(--ink-3)" }}>{secondary}</p>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(lead)} disabled={deleteLead.isPending} style={{ color: "var(--ink-4)", padding: 4, flexShrink: 0, background: "none", border: "none", opacity: deleteLead.isPending ? 0.4 : 1 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {plat && <span className="badge-pill" style={{ color: platformColor(plat), background: `${platformColor(plat)}14` }}>{plat}</span>}
                  {lead.qualification_level && (
                    <span className={`badge-pill ${LEVEL_BADGE[lead.qualification_level] ?? ""}`}>
                      {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level} · {lead.qualification_score}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{STATUS_LABELS[lead.commercial_status] ?? lead.commercial_status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <IAToggle lead={lead} toggling={togglingIds.has(lead.id)} onToggle={() => toggleAI.mutate(lead)} />
                  <span style={{ fontSize: 12, color: "var(--ink-4)" }}>{formatAgo(lead.created_at)}</span>
                </div>
              </div>
            );
          })}
          {isLoading && <p className="text-center" style={{ fontSize: 13, color: "var(--ink-4)", padding: "32px 0" }}>Carregando...</p>}
          {!isLoading && !items.length && <EmptyState hasFilters={hasFilters} />}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center" style={{ padding: "56px 16px" }}>
      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
        {hasFilters ? "Nenhum lead encontrado com esses filtros." : "Nenhum lead ainda."}
      </p>
    </div>
  );
}
