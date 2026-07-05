"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHero } from "@/components/PageHero";
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
  hot:          "Hot",
  warm:         "Warm",
  cold:         "Cold",
  auto_meeting: "Auto",
  disqualified: "Desqualificado",
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
  instagram: "#C13584",
  tiktok:    "#2C3E55",
  youtube:   "#B3261E",
  twitter:   "#1DA1F2",
  facebook:  "#1877F2",
  linkedin:  "#0A66C2",
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
      className="kanban-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderLeft: `3px solid ${lead.qualification_level ? sc.text : "var(--line)"}`,
        padding: "12px 13px",
        userSelect: "none",
      }}
    >
      {/* Row 1: plataforma + toggle IA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        {plat ? (
          <span style={{
            fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: platformColor(plat),
            background: `${platformColor(plat)}14`,
            padding: "2px 7px",
          }}>
            {plat}
          </span>
        ) : (
          <span style={{ fontSize: 9, color: "var(--ink-4)", fontFamily: "JetBrains Mono" }}>—</span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleAI(lead); }}
          disabled={toggling}
          title={aiOn ? "IA ativa — clique para pausar" : "IA pausada — clique para reativar"}
          className="font-mono"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "3px 8px", cursor: "pointer",
            opacity: toggling ? 0.4 : 1,
            color: aiOn ? "var(--ok)" : "var(--danger)",
            border: `1px solid ${aiOn ? "rgba(15,122,92,0.30)" : "rgba(179,38,30,0.30)"}`,
            background: aiOn ? "rgba(15,122,92,0.07)" : "rgba(179,38,30,0.07)",
          }}
        >
          <span
            className={aiOn ? "animate-pulse" : undefined}
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: aiOn ? "var(--ok)" : "var(--danger)",
            }}
          />
          IA
        </button>
      </div>

      {/* Row 2: nome + telefone */}
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

      {/* Barra de score */}
      {lead.qualification_score > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ height: 3, background: "var(--line-soft)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${lead.qualification_score}%`,
              background: sc.text,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      )}

      {/* Row 3: badge de score + tempo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        {lead.qualification_level ? (
          <span style={{
            fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: sc.text, background: sc.bg,
            padding: "2px 7px",
          }}>
            {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level} · {lead.qualification_score}
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
    <div style={{ width: 252, flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 3, background: bar, marginBottom: 10 }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 2px" }}>
          <div>
            <p className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {label}
            </p>
            <p style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "JetBrains Mono", marginTop: 1 }}>
              {sub}
            </p>
          </div>
          <span style={{
            fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 700,
            color: bar, background: `${bar}16`,
            padding: "2px 8px", marginTop: 1,
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
          background: isOver ? `${bar}0D` : "rgba(15,27,43,0.02)",
          border: `1px dashed ${isOver ? bar : "transparent"}`,
          transition: "background 0.15s, border-color 0.15s",
          minHeight: 64,
        }}
      >
        {leads.length === 0 && !isOver && (
          <div style={{
            border: "1px dashed var(--line)",
            padding: "18px 8px", textAlign: "center",
          }}>
            <p style={{ fontSize: 9, color: "var(--ink-4)", fontFamily: "JetBrains Mono", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              sem leads
            </p>
          </div>
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
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 112px)" }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <PageHero
          label="Pipeline comercial"
          title="Funil de Leads"
          subtitle={`${leads.length} lead${leads.length !== 1 ? "s" : ""} · arraste os cards entre as colunas`}
          stats={[
            { value: preMeetingCount, label: "Em pipeline" },
            { value: postMeetingCount, label: "Pós-reunião" },
            { value: grouped["won"]?.length ?? 0, label: "Fechados" },
          ]}
        />
      </div>

      {/* ── Board ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", paddingBottom: 12 }}>
        <div style={{
          display: "flex", gap: 14, height: "100%",
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
            padding: "16px 6px", gap: 8, flexShrink: 0, height: "100%",
          }}>
            <div style={{ flex: 1, width: 1, background: "var(--line)" }} />
            <span className="font-mono" style={{
              fontSize: 8, fontWeight: 700,
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
