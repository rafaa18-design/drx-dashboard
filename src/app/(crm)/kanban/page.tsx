"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

// ─── Column config ───────────────────────────────────────────────────────────

const PRE_MEETING = [
  { key: "new",       label: "Novo",        sub: "1ª mensagem",       bar: "#6E6A66" },
  { key: "contacted", label: "Contactado",  sub: "Em atendimento",    bar: "#B8741A" },
  { key: "qualified", label: "Qualificado", sub: "Score calculado",   bar: "#C17800" },
  { key: "proposal",  label: "Proposta",    sub: "Reunião marcada",   bar: "#9C0F20" },
] as const;

const POST_MEETING = [
  { key: "won",       label: "Fechado",    sub: "Contrato assinado", bar: "#2D6845" },
  { key: "follow_up", label: "Follow-up",  sub: "Ficou de pensar",   bar: "#B8741A" },
  { key: "lost",      label: "Perdido",    sub: "Não quer avançar",  bar: "#6E6A66" },
] as const;

const ALL_COLS = [...PRE_MEETING, ...POST_MEETING];

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

function scoreStyle(level: Lead["qualification_level"]): { bg: string; text: string } {
  switch (level) {
    case "hot":          return { bg: "rgba(156,15,32,0.10)",   text: "#9C0F20" };
    case "warm":         return { bg: "rgba(193,120,0,0.10)",   text: "#C17800" };
    case "cold":         return { bg: "rgba(110,106,102,0.10)", text: "#6E6A66" };
    case "disqualified": return { bg: "rgba(110,106,102,0.06)", text: "#9A9693" };
    default:             return { bg: "rgba(110,106,102,0.06)", text: "#9A9693" };
  }
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#C13584",
  tiktok:    "#010101",
  youtube:   "#FF0000",
  twitter:   "#1DA1F2",
  facebook:  "#1877F2",
  linkedin:  "#0A66C2",
};

function platformColor(p: string | null | undefined) {
  if (!p) return "#6E6A66";
  return PLATFORM_COLORS[p.toLowerCase()] ?? "#6E6A66";
}

function platformLabel(lead: Lead) {
  return lead.platform ?? lead.case_type ?? null;
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────

function KanbanCard({
  lead,
  onDragStart,
  onToggleAI,
  toggling,
}: {
  lead: Lead;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onToggleAI: (lead: Lead) => void;
  toggling: boolean;
}) {
  const sc  = scoreStyle(lead.qualification_level);
  const plat = platformLabel(lead);
  const aiOn = lead.ai_active !== false;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: "12px 13px",
        cursor: "grab",
        transition: "box-shadow 0.15s, transform 0.15s",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 4px 18px rgba(0,0,0,0.09)";
        el.style.transform  = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "none";
        el.style.transform  = "none";
      }}
    >
      {/* Row 1: platform pill + IA toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        {plat ? (
          <span style={{
            fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: platformColor(plat),
            background: `${platformColor(plat)}18`,
            padding: "2px 7px", borderRadius: 4,
          }}>
            {plat}
          </span>
        ) : (
          <span style={{ fontSize: 9, color: "var(--ink-4)", fontFamily: "JetBrains Mono" }}>—</span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleAI(lead); }}
          disabled={toggling}
          title={aiOn ? "Desligar IA" : "Ligar IA"}
          style={{
            width: 24, height: 24, borderRadius: 6, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, opacity: toggling ? 0.4 : 1,
            border: `1px solid ${aiOn ? "rgba(45,104,69,0.3)" : "rgba(110,106,102,0.2)"}`,
            background: aiOn ? "rgba(45,104,69,0.10)" : "rgba(110,106,102,0.06)",
            transition: "all 0.15s",
          }}
        >
          {aiOn ? "🤖" : "⏸"}
        </button>
      </div>

      {/* Row 2: name + phone */}
      <Link href={`/leads/${lead.id}`} style={{ textDecoration: "none" }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "var(--ink)",
          lineHeight: 1.3, marginBottom: lead.name ? 2 : 8,
        }}>
          {lead.name ?? lead.phone}
        </p>
        {lead.name && (
          <p style={{
            fontSize: 10, color: "var(--ink-3)",
            fontFamily: "JetBrains Mono", marginBottom: 8,
          }}>
            {lead.phone}
          </p>
        )}
      </Link>

      {/* Score bar */}
      {lead.qualification_score > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ height: 3, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${lead.qualification_score}%`,
              background: sc.text, borderRadius: 99,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      )}

      {/* Row 3: score badge + time */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        {lead.qualification_level ? (
          <span style={{
            fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: sc.text, background: sc.bg,
            padding: "2px 6px", borderRadius: 4,
          }}>
            {lead.qualification_level} · {lead.qualification_score}
          </span>
        ) : (
          <span style={{ fontSize: 9, color: "var(--ink-4)", fontFamily: "JetBrains Mono" }}>
            sem score
          </span>
        )}
        <span style={{ fontSize: 9, color: "var(--ink-4)", fontFamily: "JetBrains Mono" }}>
          {formatAgo(lead.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── KanbanColumn ────────────────────────────────────────────────────────────

function KanbanColumn({
  colKey, label, sub, bar, leads,
  onDragStart, onDrop, onToggleAI, togglingIds,
  isOver, onDragOver, onDragLeave,
}: {
  colKey: string; label: string; sub: string; bar: string;
  leads: Lead[];
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onToggleAI: (lead: Lead) => void;
  togglingIds: Set<string>;
  isOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  return (
    <div style={{ width: 248, flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 3, background: bar, borderRadius: 99, marginBottom: 10 }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 2px" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {label}
            </p>
            <p style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "JetBrains Mono", marginTop: 1 }}>
              {sub}
            </p>
          </div>
          <span style={{
            fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 700,
            color: bar, background: `${bar}18`,
            padding: "2px 8px", borderRadius: 6, marginTop: 1,
          }}>
            {leads.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, colKey)}
        style={{
          flex: 1, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 8,
          padding: "10px 8px",
          borderRadius: 12,
          background: isOver ? `${bar}0A` : "rgba(0,0,0,0.015)",
          border: `2px dashed ${isOver ? bar : "transparent"}`,
          transition: "background 0.15s, border-color 0.15s",
          minHeight: 64,
        }}
      >
        {leads.length === 0 && !isOver && (
          <p style={{ textAlign: "center", paddingTop: 18, fontSize: 10, color: "var(--ink-4)", fontFamily: "JetBrains Mono" }}>
            vazio
          </p>
        )}
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onDragStart={onDragStart}
            onToggleAI={onToggleAI}
            toggling={togglingIds.has(lead.id)}
          />
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
  const dragLead = useRef<Lead | null>(null);

  // Fetch all leads (high limit for kanban)
  const { data, isLoading } = useQuery({
    queryKey: ["kanban-leads"],
    queryFn: () =>
      api.getLeads({ limit: "500" }) as Promise<{ items: Lead[]; total: number }>,
    refetchInterval: 30_000,
  });

  const leads = (data?.items ?? []) as Lead[];

  // Move lead to new column
  const moveStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateLead(id, { commercial_status: status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["kanban-leads"] });
      const prev = qc.getQueryData(["kanban-leads"]);
      qc.setQueryData(["kanban-leads"], (old: { items: Lead[]; total: number } | undefined) =>
        old
          ? { ...old, items: old.items.map((l) => l.id === id ? { ...l, commercial_status: status } : l) }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["kanban-leads"], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["kanban-leads"] }),
  });

  // Toggle IA per lead
  const toggleAI = useMutation({
    mutationFn: (lead: Lead) => api.toggleAI(lead.id),
    onMutate: async (lead) => {
      setTogglingIds((s) => new Set([...s, lead.id]));
      await qc.cancelQueries({ queryKey: ["kanban-leads"] });
      const prev = qc.getQueryData(["kanban-leads"]);
      qc.setQueryData(["kanban-leads"], (old: { items: Lead[]; total: number } | undefined) =>
        old
          ? { ...old, items: old.items.map((l) => l.id === lead.id ? { ...l, ai_active: !l.ai_active } : l) }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["kanban-leads"], ctx.prev); },
    onSettled: (_d, _e, lead) => {
      setTogglingIds((s) => { const n = new Set(s); n.delete(lead.id); return n; });
      qc.invalidateQueries({ queryKey: ["kanban-leads"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    dragLead.current = lead;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const lead = dragLead.current;
    dragLead.current = null;
    if (!lead || lead.commercial_status === status) return;
    moveStatus.mutate({ id: lead.id, status });
  };

  // Group leads by status
  const grouped = ALL_COLS.reduce<Record<string, Lead[]>>((acc, col) => {
    acc[col.key] = leads.filter((l) => l.commercial_status === col.key);
    return acc;
  }, {});

  // Totals for header
  const preMeetingCount  = PRE_MEETING.reduce((n, c)  => n + (grouped[c.key]?.length ?? 0), 0);
  const postMeetingCount = POST_MEETING.reduce((n, c) => n + (grouped[c.key]?.length ?? 0), 0);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "JetBrains Mono", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Carregando funil...
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 112px)" }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexShrink: 0 }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, color: "var(--ink)",
            letterSpacing: "-0.03em", fontFamily: "Clash Display",
          }}>
            Funil de Leads
          </h1>
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
            {leads.length} lead{leads.length !== 1 ? "s" : ""} · atualiza a cada 30s
          </p>
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: 700,
            color: "#9C0F20", background: "rgba(156,15,32,0.08)",
            padding: "4px 10px", borderRadius: 6, letterSpacing: "0.1em",
          }}>
            {preMeetingCount} em pipeline
          </span>
          <span style={{
            fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: 700,
            color: "#2D6845", background: "rgba(45,104,69,0.08)",
            padding: "4px 10px", borderRadius: 6, letterSpacing: "0.1em",
          }}>
            {grouped["won"]?.length ?? 0} fechados
          </span>
        </div>
      </div>

      {/* ── Board ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", paddingBottom: 12 }}>
        <div style={{
          display: "flex", gap: 12, height: "100%",
          alignItems: "flex-start", minWidth: "max-content",
        }}>

          {/* Pre-meeting columns */}
          {PRE_MEETING.map((col) => (
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
              togglingIds={togglingIds}
              isOver={dragOverCol === col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
            />
          ))}

          {/* Divider */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "16px 4px", gap: 6, flexShrink: 0, height: "100%",
          }}>
            <div style={{ flex: 1, width: 1, background: "var(--line)" }} />
            <span style={{
              fontSize: 8, fontFamily: "JetBrains Mono", fontWeight: 700,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--ink-4)", writingMode: "vertical-lr",
              transform: "rotate(180deg)",
            }}>
              pós-reunião · {postMeetingCount}
            </span>
            <div style={{ flex: 1, width: 1, background: "var(--line)" }} />
          </div>

          {/* Post-meeting columns */}
          {POST_MEETING.map((col) => (
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
              togglingIds={togglingIds}
              isOver={dragOverCol === col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
