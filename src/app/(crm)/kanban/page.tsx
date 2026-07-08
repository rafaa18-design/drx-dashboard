"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

// ─── Column config — paleta navy DRX ─────────────────────────────────────────

const PRE_MEETING = [
  { key: "new",       label: "Novo",        sub: "1ª mensagem",       bar: "#9CACC0" },
  { key: "contacted", label: "Contactado",  sub: "Em atendimento",    bar: "#5C7290" },
  { key: "qualified", label: "Qualificado", sub: "Score calculado",   bar: "#273F5C" },
  { key: "proposal",  label: "Proposta",    sub: "Reunião marcada",   bar: "#0F1B2B" },
] as const;

const POST_MEETING = [
  { key: "won",       label: "Fechado",    sub: "Contrato assinado", bar: "#0F7A5C" },
  { key: "follow_up", label: "Follow-up",  sub: "Ficou de pensar",   bar: "#B45309" },
  { key: "lost",      label: "Perdido",    sub: "Não quer avançar",  bar: "#9CACC0" },
] as const;

const ALL_COLS = [...PRE_MEETING, ...POST_MEETING];

const GROUPS = [
  { id: "pre",  title: "Antes da reunião",   desc: "Tiago (IA) atende e qualifica", cols: PRE_MEETING,  tint: "var(--accent-soft)",       edge: "var(--accent)" },
  { id: "post", title: "Depois da reunião",  desc: "Resultado do atendimento",      cols: POST_MEETING, tint: "rgba(15,122,92,0.06)",     edge: "var(--ok)" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const LEVEL_LABELS: Record<string, string> = {
  hot: "Quente", warm: "Morno", cold: "Frio", auto_meeting: "Auto", disqualified: "Desqualif.",
};

function scoreStyle(level: string | null): { bg: string; text: string } {
  switch (level) {
    case "auto_meeting": return { bg: "rgba(15,122,92,0.10)",  text: "var(--ok)" };
    case "hot":          return { bg: "rgba(179,38,30,0.08)",  text: "var(--danger)" };
    case "warm":         return { bg: "rgba(180,83,9,0.08)",   text: "var(--warn)" };
    case "cold":         return { bg: "rgba(92,114,144,0.10)", text: "var(--ink-3)" };
    default:             return { bg: "rgba(156,172,192,0.10)", text: "var(--ink-4)" };
  }
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#C13584", tiktok: "#0891B2", youtube: "#B3261E", twitter: "#1DA1F2", facebook: "#1877F2", linkedin: "#0A66C2",
};

function platformColor(p: string | null | undefined) {
  if (!p) return "#5C7290";
  return PLATFORM_COLORS[p.toLowerCase()] ?? "#5C7290";
}

function platformLabel(lead: Lead) {
  return lead.platform ?? lead.case_type ?? null;
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────

function KanbanCard({
  lead, onDragStart, onToggleAI, onOpenMove, toggling,
}: {
  lead: Lead;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onToggleAI: (lead: Lead) => void;
  onOpenMove: (e: React.MouseEvent, lead: Lead) => void;
  toggling: boolean;
}) {
  const sc = scoreStyle(lead.qualification_level);
  const plat = platformLabel(lead);
  const aiOn = lead.ai_active !== false;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      className="kanban-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderLeft: `3px solid ${lead.qualification_level ? sc.text : "var(--line)"}`,
        padding: "12px 13px",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        {plat ? (
          <span className="badge-pill" style={{ color: platformColor(plat), background: `${platformColor(plat)}14` }}>{plat}</span>
        ) : (
          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>—</span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleAI(lead); }}
          disabled={toggling}
          title={aiOn ? "IA ativa — clique para pausar" : "IA pausada — clique para reativar"}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: "var(--r-full)", cursor: "pointer",
            opacity: toggling ? 0.4 : 1,
            color: aiOn ? "var(--ok)" : "var(--danger)",
            border: `1px solid ${aiOn ? "rgba(15,122,92,0.30)" : "rgba(179,38,30,0.30)"}`,
            background: aiOn ? "rgba(15,122,92,0.07)" : "rgba(179,38,30,0.07)",
          }}
        >
          <span className={aiOn ? "animate-pulse" : undefined} style={{ width: 5, height: 5, borderRadius: "50%", background: aiOn ? "var(--ok)" : "var(--danger)" }} />
          IA
        </button>
      </div>

      <Link href={`/leads/${lead.id}`} style={{ textDecoration: "none" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, marginBottom: lead.name ? 2 : 8 }}>
          {lead.name ?? lead.phone}
        </p>
        {lead.name && <p style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>{lead.phone}</p>}
      </Link>

      {lead.qualification_score > 0 && (
        <div style={{ marginBottom: 8, height: 4, background: "var(--line-soft)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${lead.qualification_score}%`, background: sc.text, transition: "width 0.5s ease" }} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        {lead.qualification_level ? (
          <span className="badge-pill" style={{ color: sc.text, background: sc.bg }}>
            {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level} · {lead.qualification_score}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>sem score</span>
        )}
        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{formatAgo(lead.created_at)}</span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onOpenMove(e, lead); }}
        style={{
          width: "100%", marginTop: 10, padding: "6px 0", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 11, fontWeight: 500,
          color: "var(--ink-3)", background: "transparent",
          border: "1px solid var(--line)", cursor: "pointer",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-3)"; }}
      >
        Mover etapa
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}

// ─── KanbanColumn ────────────────────────────────────────────────────────────

function KanbanColumn({
  colKey, label, sub, bar, leads,
  onDragStart, onDrop, onToggleAI, onOpenMove, togglingIds,
  isOver, onDragOver, onDragLeave,
}: {
  colKey: string; label: string; sub: string; bar: string;
  leads: Lead[];
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onToggleAI: (lead: Lead) => void;
  onOpenMove: (e: React.MouseEvent, lead: Lead) => void;
  togglingIds: Set<string>;
  isOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  return (
    <div style={{ width: 252, flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "100%" }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 3, background: bar, borderRadius: "var(--r-full)", marginBottom: 10 }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 2px" }}>
          <div>
            <p className="font-display font-semibold" style={{ fontSize: 14, color: "var(--ink)", letterSpacing: "-0.01em" }}>{label}</p>
            <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{sub}</p>
          </div>
          <span className="dc-count-pill" style={{ color: bar, background: `${bar}16` }}>{leads.length}</span>
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, colKey)}
        style={{
          flex: 1, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 8,
          padding: "10px 8px", borderRadius: "var(--r-md)",
          background: isOver ? `${bar}0D` : "rgba(15,27,43,0.02)",
          border: `1px dashed ${isOver ? bar : "transparent"}`,
          transition: "background 0.15s, border-color 0.15s",
          minHeight: 64,
        }}
      >
        {leads.length === 0 && !isOver && (
          <div style={{ border: "1px dashed var(--line)", borderRadius: "var(--r-md)", padding: "18px 8px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--ink-4)" }}>arraste para cá</p>
          </div>
        )}
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onDragStart={onDragStart} onToggleAI={onToggleAI} onOpenMove={onOpenMove} toggling={togglingIds.has(lead.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function KanbanPage() {
  const qc = useQueryClient();
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [moveMenu, setMoveMenu] = useState<{ lead: Lead; x: number; y: number } | null>(null);
  const dragLead = useRef<Lead | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["kanban-leads"],
    queryFn: () => api.getLeads({ limit: "500" }) as Promise<{ items: Lead[]; total: number }>,
    refetchInterval: 30_000,
  });

  const leads = (data?.items ?? []) as Lead[];

  const q = search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const filtered = leads.filter((l) => {
    if (levelFilter && l.qualification_level !== levelFilter) return false;
    if (!q) return true;
    const nameHit = (l.name ?? "").toLowerCase().includes(q);
    const phoneHit = qDigits.length > 0 && l.phone.replace(/\D/g, "").includes(qDigits);
    return nameHit || phoneHit;
  });
  const hasFilter = q.length > 0 || levelFilter !== "";

  const moveStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateLead(id, { commercial_status: status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["kanban-leads"] });
      const prev = qc.getQueryData(["kanban-leads"]);
      qc.setQueryData(["kanban-leads"], (old: { items: Lead[]; total: number } | undefined) =>
        old ? { ...old, items: old.items.map((l) => l.id === id ? { ...l, commercial_status: status } : l) } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["kanban-leads"], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["kanban-leads"] }),
  });

  const toggleAI = useMutation({
    mutationFn: (lead: Lead) => api.toggleAI(lead.id),
    onMutate: async (lead) => {
      setTogglingIds((s) => new Set([...s, lead.id]));
      await qc.cancelQueries({ queryKey: ["kanban-leads"] });
      const prev = qc.getQueryData(["kanban-leads"]);
      qc.setQueryData(["kanban-leads"], (old: { items: Lead[]; total: number } | undefined) =>
        old ? { ...old, items: old.items.map((l) => l.id === lead.id ? { ...l, ai_active: !l.ai_active } : l) } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["kanban-leads"], ctx.prev); },
    onSettled: (_d, _e, lead) => {
      setTogglingIds((s) => { const n = new Set(s); n.delete(lead.id); return n; });
      qc.invalidateQueries({ queryKey: ["kanban-leads"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, lead: Lead) => { dragLead.current = lead; e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent, colKey: string) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(colKey); };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const lead = dragLead.current;
    dragLead.current = null;
    if (!lead || lead.commercial_status === status) return;
    moveStatus.mutate({ id: lead.id, status });
  };

  const openMoveMenu = (e: React.MouseEvent, lead: Lead) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuH = ALL_COLS.length * 34 + 44;
    const y = rect.bottom + menuH > window.innerHeight - 12 ? Math.max(12, rect.top - menuH - 6) : rect.bottom + 6;
    const x = Math.min(rect.left, window.innerWidth - 226);
    setMoveMenu({ lead, x, y });
  };

  const grouped = ALL_COLS.reduce<Record<string, Lead[]>>((acc, col) => {
    acc[col.key] = filtered.filter((l) => l.commercial_status === col.key);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <span style={{ fontSize: 13, color: "var(--ink-4)" }}>Carregando funil...</span>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 112px)" }}>
      <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 16, flexShrink: 0 }}>
        {hasFilter ? `${filtered.length} de ${leads.length} leads no filtro` : `${leads.length} lead${leads.length !== 1 ? "s" : ""} · arraste os cards ou use "mover etapa"`}
      </p>

      <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 16, flexShrink: 0 }}>
        <input className="filter-input" placeholder="Buscar por nome ou telefone…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 260, maxWidth: "100%" }} />
        <select className="filter-select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="">Todos os níveis</option>
          <option value="hot">Quente</option>
          <option value="warm">Morno</option>
          <option value="cold">Frio</option>
          <option value="auto_meeting">Auto-agendado</option>
          <option value="disqualified">Desqualificado</option>
        </select>
        {hasFilter && (
          <button
            onClick={() => { setSearch(""); setLevelFilter(""); }}
            style={{ fontSize: 13, fontWeight: 500, color: "var(--danger)", background: "rgba(179,38,30,0.07)", border: "1px solid rgba(179,38,30,0.25)", borderRadius: "var(--r-md)", padding: "8px 14px", cursor: "pointer" }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", paddingBottom: 12 }}>
        <div style={{ display: "flex", gap: 18, height: "100%", alignItems: "stretch", minWidth: "max-content" }}>
          {GROUPS.map((group, gi) => (
            <div key={group.id} style={{ display: "flex", height: "100%" }}>
              {gi > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 4px", marginRight: 18, flexShrink: 0, height: "100%" }}>
                  <div style={{ flex: 1, width: 1, background: "var(--line)" }} />
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, margin: "8px 0", border: "1px solid var(--line)", borderRadius: "50%", background: "var(--surface)", color: "var(--ink-3)" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                  <div style={{ flex: 1, width: 1, background: "var(--line)" }} />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "7px 12px", marginBottom: 14, borderRadius: "var(--r-md)", background: group.tint, borderLeft: `2px solid ${group.edge}` }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: group.edge }}>{group.title}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-4)" }}>· {group.desc}</span>
                </div>

                <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0, alignItems: "stretch" }}>
                  {group.cols.map((col) => (
                    <KanbanColumn
                      key={col.key}
                      colKey={col.key}
                      label={col.label}
                      sub={col.sub}
                      bar={col.bar}
                      leads={grouped[col.key] ?? []}
                      onDragStart={handleDragStart}
                      onDrop={handleDrop}
                      onToggleAI={(lead) => toggleAI.mutate(lead)}
                      onOpenMove={openMoveMenu}
                      togglingIds={togglingIds}
                      isOver={dragOverCol === col.key}
                      onDragOver={(e) => handleDragOver(e, col.key)}
                      onDragLeave={() => setDragOverCol(null)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {moveMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setMoveMenu(null)} />
          <div className="animate-fadeIn dc-card" style={{ position: "fixed", left: moveMenu.x, top: moveMenu.y, zIndex: 91, width: 214, boxShadow: "0 14px 36px rgba(15,27,43,0.16)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", padding: "10px 12px 8px", borderBottom: "1px solid var(--line-soft)" }}>Mover para</p>
            {ALL_COLS.map((c, i) => {
              const current = moveMenu.lead.commercial_status === c.key;
              return (
                <button
                  key={c.key}
                  disabled={current}
                  onClick={() => { moveStatus.mutate({ id: moveMenu.lead.id, status: c.key }); setMoveMenu(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    width: "100%", padding: "9px 12px", textAlign: "left",
                    background: current ? "var(--accent-soft)" : "transparent",
                    border: "none", cursor: current ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => { if (!current) (e.currentTarget as HTMLButtonElement).style.background = "var(--line-soft)"; }}
                  onMouseLeave={(e) => { if (!current) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.bar, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: current ? 600 : 400 }}>{c.label}</span>
                  {current && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>atual</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
