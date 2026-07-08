"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHero } from "@/components/PageHero";
import { LeadsOverTime } from "@/components/charts/LeadsOverTime";
import { SourceDonut } from "@/components/charts/SourceDonut";
import { TemperatureBars } from "@/components/charts/TemperatureBars";
import { ArrivalHeatmap } from "@/components/charts/ArrivalHeatmap";
import { useCountUp } from "@/hooks/useCountUp";
import type { Appointment, Lead } from "@/types";

const STAGE_LABELS: Record<string, string> = {
  new:        "Novo",
  contacted:  "Contactado",
  qualified:  "Qualificado",
  proposal:   "Proposta",
  won:        "Fechado",
  follow_up:  "Follow-up",
  lost:       "Perdido",
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

const WEEKDAY_TIME = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short", hour: "2-digit", minute: "2-digit",
});

function isToday(d: Date): boolean {
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function DashboardPage() {
  const { data: kpis }   = useQuery({ queryKey: ["kpis"],   queryFn: api.getKPIs,   refetchInterval: 60_000  });
  const { data: funnel } = useQuery({ queryKey: ["funnel"], queryFn: api.getFunnel, refetchInterval: 300_000 });
  const { data: appts }  = useQuery({
    queryKey: ["dashboard-appointments"],
    queryFn: () => api.getAppointments({ limit: "10", status: "scheduled" }) as Promise<{ items: Appointment[]; total: number }>,
    refetchInterval: 60_000,
  });
  const { data: leadsData } = useQuery({
    queryKey: ["dashboard-leads"],
    queryFn: () => api.getLeads({ limit: "500" }) as Promise<{ items: Lead[]; total: number }>,
    refetchInterval: 60_000,
  });

  const allLeads = leadsData?.items ?? [];

  const funnelTotal = funnel?.stages.reduce((a: number, s: { count: number }) => a + s.count, 0) || 1;
  const funnelMax = funnel?.stages.reduce((a: number, s: { count: number }) => Math.max(a, s.count), 0) || 1;

  // Ordena os agendamentos do mais próximo para o mais distante
  const upcoming = [...(appts?.items ?? [])].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Painel-herói ──────────────────────────────────── */}
      <PageHero
        label={`Visão geral · ${today}`}
        title="Dashboard"
        stats={[
          { value: kpis?.total_leads ?? "—", label: "Leads na base" },
          { value: appts?.total ?? "—", label: "Reuniões marcadas" },
          { value: kpis?.ai_active_leads ?? "—", label: "Leads com IA ativa" },
        ]}
      />

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
        <KPICard
          code="01"
          label="Leads este mês"
          value={kpis?.leads_this_month ?? "—"}
          hint={kpis ? `${kpis.total_leads} no total` : ""}
        />
        <KPICard
          code="02"
          label="Agendamentos"
          value={kpis?.appointments_scheduled ?? "—"}
          hint="criados este mês"
        />
        <KPICard
          code="03"
          label="Taxa de conversão"
          value={kpis ? kpis.conversion_rate * 100 : "—"}
          format={(n) => `${n.toFixed(1)}%`}
          hint="leads fechados"
        />
        <KPICard
          code="04"
          label="Taxa de escalação"
          value={kpis ? kpis.escalation_rate * 100 : "—"}
          format={(n) => `${n.toFixed(1)}%`}
          hint="foram para humano"
        />
      </div>

      {/* ── Evolução de leads ─────────────────────────────── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <SectionHeader
          code="G.01"
          title="Evolução de leads"
          side={
            <span className="font-mono hidden sm:inline" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              novos leads por dia
            </span>
          }
        />
        <LeadsOverTime leads={allLeads} />
      </div>

      {/* ── Agendamentos + Funil lado a lado ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ── Próximos agendamentos ─────────────────────── */}
        <div className="lg:col-span-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <SectionHeader code="P.02" title="Próximos agendamentos" side={
            <Link
              href="/appointments"
              className="font-mono"
              style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}
            >
              Ver todos →
            </Link>
          } />

          {!upcoming.length ? (
            <EmptyState message="Nenhuma reunião agendada no momento." />
          ) : (
            <div>
              {upcoming.map((appt, idx) => {
                const date = new Date(appt.scheduled_at);
                const sc = APPT_STATUS_COLOR[appt.status] ?? APPT_STATUS_COLOR.scheduled;
                const hoje = isToday(date);
                const name = appt.lead_name ?? appt.lead_phone ?? "Lead sem nome";
                return (
                  <div
                    key={appt.id}
                    className="row-hover flex items-center gap-4 px-4 sm:px-6 py-4"
                    style={{ borderTop: idx === 0 ? "none" : "1px solid var(--line-soft)" }}
                  >
                    {/* Bloco de data */}
                    <div
                      className="flex-shrink-0 text-center"
                      style={{
                        width: 52, padding: "8px 4px",
                        background: hoje ? "var(--ink)" : "var(--accent-soft)",
                        border: hoje ? "1px solid var(--ink)" : "1px solid var(--accent-line)",
                      }}
                    >
                      <p
                        className="font-mono font-bold"
                        style={{ fontSize: 19, lineHeight: 1, color: hoje ? "#FFFFFF" : "var(--accent)" }}
                      >
                        {date.getDate().toString().padStart(2, "0")}
                      </p>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: 9, marginTop: 3, letterSpacing: "0.1em", textTransform: "uppercase",
                          color: hoje ? "rgba(255,255,255,0.65)" : "var(--ink-3)",
                        }}
                      >
                        {hoje ? "hoje" : date.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}
                      </p>
                    </div>

                    {/* Monograma do lead */}
                    <div
                      className="hidden sm:flex flex-shrink-0 items-center justify-center font-display font-bold"
                      style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "var(--ink)", color: "#FFFFFF", fontSize: 13, letterSpacing: "0.02em",
                      }}
                    >
                      {initials(name)}
                    </div>

                    {/* Lead + horário */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                        {name}
                      </p>
                      <p className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>
                        {WEEKDAY_TIME.format(date).replace(".,", " ·")} · {appt.duration_minutes} min
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {appt.google_meet_link && (
                        <a
                          href={appt.google_meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-meet hidden sm:inline-block"
                        >
                          Meet
                        </a>
                      )}
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                          color: sc.text, background: sc.bg, padding: "4px 10px",
                        }}
                      >
                        {APPT_STATUS_LABEL[appt.status] ?? appt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Funil de conversão ────────────────────────── */}
        <div className="lg:col-span-2" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <SectionHeader code="P.05" title="Funil de conversão" side={
            <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {funnelTotal} leads
            </span>
          } />

          <div className="px-4 sm:px-6 py-6">
            {funnel?.stages.length ? (
              <div className="space-y-5">
                {funnel.stages.map((s: { stage: string; count: number }, idx: number) => {
                  const pctOfTotal = Math.round((s.count / funnelTotal) * 100);
                  const barPct = Math.round((s.count / funnelMax) * 100);
                  const isWon = s.stage === "won";
                  const isLost = s.stage === "lost";
                  return (
                    <div key={s.stage}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2.5">
                          <span
                            className="font-mono"
                            style={{ fontSize: 9, color: "var(--ink-4)", fontWeight: 700 }}
                          >
                            {(idx + 1).toString().padStart(2, "0")}
                          </span>
                          <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
                            {STAGE_LABELS[s.stage] ?? s.stage}
                          </span>
                        </span>
                        <span className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                          <b style={{ color: "var(--ink)" }}>{s.count}</b>
                          <span style={{ color: "var(--ink-4)" }}> · {pctOfTotal}%</span>
                        </span>
                      </div>
                      <div style={{ height: 7, background: "var(--line-soft)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.max(barPct, s.count > 0 ? 4 : 0)}%`,
                            background: isWon
                              ? "var(--ok)"
                              : isLost
                                ? "var(--ink-4)"
                                : "linear-gradient(90deg, var(--ink), var(--accent))",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <Link
                  href="/kanban"
                  className="font-mono inline-block"
                  style={{
                    marginTop: 4, fontSize: 10, color: "var(--accent)",
                    letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700,
                  }}
                >
                  Abrir funil completo →
                </Link>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--ink-4)" }}>Carregando funil...</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Origem + Temperatura da base ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <SectionHeader
            code="G.02"
            title="Origem dos leads"
            side={
              <span className="font-mono hidden sm:inline" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                por plataforma
              </span>
            }
          />
          <SourceDonut leads={allLeads} />
        </div>

        <div className="lg:col-span-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <SectionHeader
            code="G.03"
            title="Temperatura da base"
            side={
              <span className="font-mono hidden sm:inline" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                qualificação do Tiago (IA)
              </span>
            }
          />
          <TemperatureBars leads={allLeads} />
        </div>
      </div>

      {/* ── Heatmap de chegada ────────────────────────────── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <SectionHeader
          code="G.04"
          title="Quando os leads chegam"
          side={
            <span className="font-mono hidden sm:inline" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              últimos 30 dias · dia × hora
            </span>
          }
        />
        <ArrivalHeatmap leads={allLeads} />
      </div>
    </div>
  );
}

/* ── Componentes auxiliares ─────────────────────────────── */

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
        <h2 className="font-display font-bold" style={{ fontSize: 17, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {side}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 sm:px-6 py-10 text-center">
      <p
        className="font-mono mb-1"
        style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.2em", textTransform: "uppercase" }}
      >
        · · ·
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>{message}</p>
    </div>
  );
}

function KPICard({
  code,
  label,
  value,
  hint,
  format,
}: {
  code: string;
  label: string;
  value: string | number;
  hint?: string;
  format?: (n: number) => string;
}) {
  const isNumber = typeof value === "number";
  const animated = useCountUp(isNumber ? value : 0, 1000);
  const display = isNumber
    ? (format ? format(animated) : String(Math.round(animated)))
    : value;

  return (
    <div className="kpi-tile p-5 sm:p-6" style={{ background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-4">
        <p
          className="font-mono"
          style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}
        >
          {code}
        </p>
        <span style={{ width: 20, height: 2, background: "var(--accent-line)" }} />
      </div>
      <p
        className="font-mono font-bold leading-none mb-2"
        style={{ fontSize: 40, color: "var(--ink)", letterSpacing: "-0.04em" }}
      >
        {display}
      </p>
      <p style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>
        {label}
      </p>
      {hint ? (
        <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
