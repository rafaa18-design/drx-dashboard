"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Appointment, Conversation, Lead } from "@/types";

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
  auto_meeting: "Reunião automática",
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
  permanent_ban:         "Banimento permanente",
  temporary_restriction: "Restrição temporária",
  warning_only:          "Apenas aviso",
};

const SOURCE_LABELS: Record<string, string> = {
  ad:              "Anúncio",
  referral:        "Indicação",
  existing_client: "Cliente existente",
  unknown:         "Desconhecida",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#C13584",
  tiktok:    "#0891B2",
  youtube:   "#B3261E",
  twitter:   "#1DA1F2",
  facebook:  "#1877F2",
  linkedin:  "#0A66C2",
};

const APPT_STATUS_LABEL: Record<string, string> = {
  scheduled:  "Agendada",
  confirmed:  "Confirmada",
  cancelled:  "Cancelada",
  completed:  "Realizada",
  no_show:    "Não compareceu",
};

const APPT_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "rgba(180,83,9,0.08)",   text: "var(--warn)" },
  confirmed: { bg: "rgba(15,122,92,0.10)",  text: "var(--ok)" },
  completed: { bg: "rgba(15,122,92,0.08)",  text: "var(--ok)" },
  cancelled: { bg: "rgba(179,38,30,0.08)",  text: "var(--danger)" },
  no_show:   { bg: "rgba(92,114,144,0.10)", text: "var(--ink-3)" },
};

const CONV_STATUS_LABEL: Record<string, string> = {
  active:          "Em atendimento (IA)",
  human_required:  "Aguardando humano",
  closed:          "Encerrada",
  scheduled:       "Reunião agendada",
};

const CONV_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  active:         { bg: "rgba(15,122,92,0.10)",  text: "var(--ok)" },
  human_required: { bg: "rgba(179,38,30,0.08)",  text: "var(--danger)" },
  closed:         { bg: "rgba(92,114,144,0.10)", text: "var(--ink-3)" },
  scheduled:      { bg: "rgba(180,83,9,0.08)",   text: "var(--warn)" },
};

const GARBAGE = new Set(["none", "null", "unknown", "undefined", ""]);

function clean(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return GARBAGE.has(t.toLowerCase()) ? null : t;
}

function initials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function platformColor(p: string | null): string {
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

function humanizeSignal(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora";
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

/** Cabeçalho de seção reutilizado nas subseções da ficha (agendamentos, conversas...). */
function SectionHeader({ code, title, side }: { code: string; title: string; side?: React.ReactNode }) {
  return (
    <div
      className="px-4 sm:px-6 py-4 flex items-center justify-between gap-2"
      style={{ borderBottom: "1px solid var(--line)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="font-mono"
          style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}
        >
          {code}
        </span>
        <h2 className="font-display font-bold" style={{ fontSize: 16, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {side}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.getLead(id) as Promise<Lead>,
  });

  const { data: apptData } = useQuery({
    queryKey: ["lead-appointments", id],
    queryFn: () => api.getAppointments({ lead_id: id }) as Promise<{ items: Appointment[]; total: number }>,
    enabled: !!lead,
  });

  const { data: convData } = useQuery({
    queryKey: ["lead-conversations", id],
    queryFn: () => api.getConversations() as Promise<{ items: Conversation[]; total: number }>,
    enabled: !!lead,
  });

  const [toggling, setToggling] = useState(false);
  const toggleAI = useMutation({
    mutationFn: () => api.toggleAI(id),
    onMutate: () => setToggling(true),
    onSettled: () => {
      setToggling(false);
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: () => api.deleteLead(id),
    onSuccess: () => router.push("/leads"),
  });

  function handleDelete() {
    if (!lead) return;
    const name = lead.name || lead.phone || "este lead";
    if (!confirm(`Apagar ${name}? Esta ação não pode ser desfeita.`)) return;
    deleteLead.mutate();
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Carregando lead...
        </span>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div style={{ textAlign: "center", padding: "56px 16px" }}>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>Lead não encontrado.</p>
        <Link href="/leads" className="font-mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
          ← Voltar para leads
        </Link>
      </div>
    );
  }

  const name = clean(lead.name) ?? lead.phone;
  const plat = clean(lead.platform);
  const caseType = clean(lead.case_type);
  const source = clean(lead.source);
  const email = clean(lead.email);
  const aiOn = lead.ai_active !== false;
  const sc = scoreColor(lead.qualification_level);

  const signalsRaw = lead.qualification_signals as { signals?: unknown } | null;
  const signals = Array.isArray(signalsRaw?.signals) ? (signalsRaw!.signals as string[]) : [];

  const appts = (apptData?.items ?? []).filter((a) => a.lead_id === id);
  const convs = (convData?.items ?? []).filter((c) => c.lead_id === id);
  const waUrl = `https://wa.me/${lead.phone.replace(/\D/g, "")}`;

  return (
    <div className="space-y-6 animate-fadeIn" style={{ maxWidth: 1160, margin: "0 auto" }}>

      {/* Voltar */}
      <Link
        href="/leads"
        className="font-mono inline-flex items-center gap-2"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Todos os leads
      </Link>

      {/* ── Cabeçalho do lead ─────────────────────────────── */}
      <div
        className="drx-fadeup"
        style={{ background: "var(--surface)", border: "1px solid var(--line)", borderLeft: `4px solid ${sc}` }}
      >
        <div className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="font-display font-bold flex items-center justify-center flex-shrink-0"
              style={{ width: 58, height: 58, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 19 }}
            >
              {initials(name)}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold truncate" style={{ fontSize: 22, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                {name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" style={{ marginTop: 6 }}>
                <span className="font-mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{lead.phone}</span>
                {plat && (
                  <span className="font-mono" style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: platformColor(plat), background: `${platformColor(plat)}14`, padding: "2px 8px",
                  }}>
                    {plat}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {STATUS_LABELS[lead.commercial_status] ?? lead.commercial_status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={() => toggleAI.mutate()}
              disabled={toggling}
              title={aiOn ? "IA ativa — clique para pausar" : "IA pausada — clique para reativar"}
              className="ia-chip"
              data-on={aiOn}
            >
              <span className={`ia-dot ${aiOn ? "animate-pulse" : ""}`} style={{ background: aiOn ? "var(--ok)" : "var(--danger)" }} />
              IA {aiOn ? "ativa" : "pausada"}
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono"
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--accent)", border: "1px solid var(--accent-line)", background: "var(--accent-soft)",
                padding: "9px 14px", textDecoration: "none",
              }}
            >
              WhatsApp ↗
            </a>
            <button
              onClick={handleDelete}
              disabled={deleteLead.isPending}
              title="Apagar lead"
              className="font-mono"
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--danger)", border: "1px solid rgba(179,38,30,0.3)", background: "rgba(179,38,30,0.06)",
                padding: "9px 14px", cursor: deleteLead.isPending ? "not-allowed" : "pointer",
                opacity: deleteLead.isPending ? 0.5 : 1,
              }}
            >
              Apagar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Coluna principal ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Qualificação */}
          <div className="drx-fadeup" style={{ background: "var(--surface)", border: "1px solid var(--line)", animationDelay: "60ms" }}>
            <SectionHeader
              code="L.01"
              title="Qualificação"
              side={
                lead.qualification_level ? (
                  <span className={`font-mono ${LEVEL_BADGE[lead.qualification_level] ?? ""}`} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px" }}>
                    {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level}
                  </span>
                ) : null
              }
            />
            <div className="px-4 sm:px-6 py-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono font-bold" style={{ fontSize: 34, color: sc, letterSpacing: "-0.03em" }}>
                  {lead.qualification_score}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>/ 100</span>
              </div>
              <div style={{ height: 7, background: "var(--line-soft)", overflow: "hidden", marginBottom: 20 }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, lead.qualification_score))}%`,
                  background: sc,
                  transition: "width 0.6s ease",
                }} />
              </div>

              {signals.length > 0 ? (
                <>
                  <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
                    Sinais identificados pelo Tiago (IA)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {signals.map((s) => (
                      <span key={s} style={{
                        fontSize: 11.5, color: "var(--ink-2)", background: "var(--bg)",
                        border: "1px solid var(--line)", padding: "5px 11px",
                      }}>
                        {humanizeSignal(s)}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 12, color: "var(--ink-4)" }}>Nenhum sinal de qualificação registrado.</p>
              )}
            </div>
          </div>

          {/* Descrição do caso */}
          {lead.case_description && (
            <div className="drx-fadeup" style={{ background: "var(--surface)", border: "1px solid var(--line)", animationDelay: "120ms" }}>
              <SectionHeader code="L.02" title="Descrição do caso" />
              <div className="px-4 sm:px-6 py-5">
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65 }}>{lead.case_description}</p>
              </div>
            </div>
          )}

          {/* Agendamentos */}
          <div className="drx-fadeup" style={{ background: "var(--surface)", border: "1px solid var(--line)", animationDelay: "180ms" }}>
            <SectionHeader code="L.03" title="Agendamentos" side={
              <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {appts.length}
              </span>
            } />
            {appts.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 text-center">
                <p style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Nenhuma reunião agendada com este lead.</p>
              </div>
            ) : (
              <div>
                {appts.map((a, i) => {
                  const cs = APPT_STATUS_COLOR[a.status] ?? APPT_STATUS_COLOR.scheduled;
                  const date = new Date(a.scheduled_at);
                  return (
                    <div key={a.id} className="row-hover flex items-center gap-4 px-4 sm:px-6 py-4" style={{ borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                      <div className="text-center flex-shrink-0" style={{ width: 46, padding: "6px 4px", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
                        <p className="font-mono font-bold" style={{ fontSize: 16, lineHeight: 1, color: "var(--accent)" }}>
                          {date.getDate().toString().padStart(2, "0")}
                        </p>
                        <p className="font-mono" style={{ fontSize: 8, marginTop: 2, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                          {date.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                          {date.toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })} · {a.duration_minutes} min
                        </p>
                        {a.notes && <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>{a.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.google_meet_link && (
                          <a href={a.google_meet_link} target="_blank" rel="noreferrer" className="btn-meet hidden sm:inline-block">Meet</a>
                        )}
                        <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: cs.text, background: cs.bg, padding: "4px 9px" }}>
                          {APPT_STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conversas */}
          <div className="drx-fadeup" style={{ background: "var(--surface)", border: "1px solid var(--line)", animationDelay: "240ms" }}>
            <SectionHeader code="L.04" title="Conversas" side={
              <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {convs.length}
              </span>
            } />
            {convs.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 text-center">
                <p style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Nenhuma conversa registrada com este lead.</p>
              </div>
            ) : (
              <div>
                {convs.map((c, i) => {
                  const cs = CONV_STATUS_COLOR[c.status] ?? CONV_STATUS_COLOR.active;
                  return (
                    <div key={c.id} className="row-hover flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-wrap" style={{ borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                      <div className="min-w-0">
                        <p className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {c.channel} · última mensagem {formatAgo(c.last_message_at)}
                        </p>
                        {c.ai_handoff_reason && (
                          <p style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 3 }}>{c.ai_handoff_reason}</p>
                        )}
                      </div>
                      <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: cs.text, background: cs.bg, padding: "4px 9px" }}>
                        {CONV_STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Ficha lateral ─────────────────────────────── */}
        <div className="drx-fadeup" style={{ background: "var(--surface)", border: "1px solid var(--line)", animationDelay: "100ms" }}>
          <SectionHeader code="L.05" title="Ficha" />
          <div className="px-4 sm:px-6 py-2">
            <FactRow label="Status comercial" value={STATUS_LABELS[lead.commercial_status] ?? lead.commercial_status} />
            <FactRow label="Origem" value={source ? (SOURCE_LABELS[source] ?? source) : "—"} />
            <FactRow label="Área do caso" value={caseType ? (CASE_LABELS[caseType] ?? caseType) : "—"} />
            <FactRow label="E-mail" value={email ?? "—"} />
            <FactRow label="Follow-ups enviados" value={lead.follow_up_count} />
            {lead.follow_up_last_sent_at && (
              <FactRow label="Último follow-up" value={formatDateTime(lead.follow_up_last_sent_at)} />
            )}
            <FactRow label="Criado em" value={formatDateTime(lead.created_at)} />
            <FactRow label="Atualizado em" value={formatDateTime(lead.updated_at)} />
          </div>
        </div>
      </div>
    </div>
  );
}
