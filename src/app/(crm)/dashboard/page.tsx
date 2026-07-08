"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

  const upcoming = [...(appts?.items ?? [])].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6 animate-fadeIn">
      <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
        Visão geral do escritório · {today}
      </p>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Leads este mês" value={kpis?.leads_this_month ?? "—"} hint={kpis ? `${kpis.total_leads} no total` : ""} />
        <KPICard label="Agendamentos" value={kpis?.appointments_scheduled ?? "—"} hint="criados este mês" />
        <KPICard
          label="Taxa de conversão"
          value={kpis ? kpis.conversion_rate * 100 : "—"}
          format={(n) => `${n.toFixed(1)}%`}
          hint="leads fechados"
        />
        <KPICard
          label="Taxa de escalação"
          value={kpis ? kpis.escalation_rate * 100 : "—"}
          format={(n) => `${n.toFixed(1)}%`}
          hint="foram para humano"
        />
      </div>

      {/* ── Evolução de leads ─────────────────────────────── */}
      <div className="dc-card">
        <SectionHeader title="Evolução de leads" subtitle="Novos leads por dia" />
        <LeadsOverTime leads={allLeads} />
      </div>

      {/* ── Agendamentos + Funil lado a lado ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 dc-card">
          <SectionHeader title="Próximos agendamentos" side={
            <Link href="/appointments" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
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
                    <div
                      className="flex-shrink-0 text-center"
                      style={{
                        width: 50, padding: "7px 4px", borderRadius: "var(--r-md)",
                        background: hoje ? "var(--ink)" : "var(--accent-soft)",
                      }}
                    >
                      <p className="font-display font-semibold" style={{ fontSize: 18, lineHeight: 1, color: hoje ? "#FFFFFF" : "var(--accent)" }}>
                        {date.getDate().toString().padStart(2, "0")}
                      </p>
                      <p style={{ fontSize: 10, marginTop: 3, color: hoje ? "rgba(255,255,255,0.65)" : "var(--ink-3)" }}>
                        {hoje ? "hoje" : date.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}
                      </p>
                    </div>

                    <div
                      className="hidden sm:flex flex-shrink-0 items-center justify-center font-display font-semibold"
                      style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 13 }}
                    >
                      {initials(name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{name}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                        {WEEKDAY_TIME.format(date).replace(".,", " ·")} · {appt.duration_minutes} min
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {appt.google_meet_link && (
                        <a href={appt.google_meet_link} target="_blank" rel="noreferrer" className="btn-meet hidden sm:inline-block">
                          Meet
                        </a>
                      )}
                      <span className="badge-pill" style={{ color: sc.text, background: sc.bg }}>
                        {APPT_STATUS_LABEL[appt.status] ?? appt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 dc-card">
          <SectionHeader title="Funil de conversão" side={
            <span style={{ fontSize: 12, color: "var(--ink-4)" }}>{funnelTotal} leads</span>
          } />

          <div className="dc-card-pad">
            {funnel?.stages.length ? (
              <div className="space-y-4">
                {funnel.stages.map((s: { stage: string; count: number }, idx: number) => {
                  const pctOfTotal = Math.round((s.count / funnelTotal) * 100);
                  const barPct = Math.round((s.count / funnelMax) * 100);
                  const isWon = s.stage === "won";
                  const isLost = s.stage === "lost";
                  return (
                    <div key={s.stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
                          {STAGE_LABELS[s.stage] ?? s.stage}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                          <b style={{ color: "var(--ink)" }}>{s.count}</b>
                          <span style={{ color: "var(--ink-4)" }}> · {pctOfTotal}%</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: "var(--line-soft)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.max(barPct, s.count > 0 ? 4 : 0)}%`,
                            borderRadius: "var(--r-full)",
                            background: isWon ? "var(--ok)" : isLost ? "var(--ink-4)" : "var(--accent)",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Link href="/kanban" style={{ display: "inline-block", marginTop: 4, fontSize: 13, color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-2 dc-card">
          <SectionHeader title="Origem dos leads" subtitle="Por plataforma" />
          <SourceDonut leads={allLeads} />
        </div>
        <div className="lg:col-span-3 dc-card">
          <SectionHeader title="Temperatura da base" subtitle="Qualificação do Tiago (IA)" />
          <TemperatureBars leads={allLeads} />
        </div>
      </div>

      {/* ── Heatmap de chegada ────────────────────────────── */}
      <div className="dc-card">
        <SectionHeader title="Quando os leads chegam" subtitle="Últimos 30 dias · dia × hora" />
        <ArrivalHeatmap leads={allLeads} />
      </div>
    </div>
  );
}

/* ── Componentes auxiliares ─────────────────────────────── */

function SectionHeader({ title, subtitle, side }: { title: string; subtitle?: string; side?: React.ReactNode }) {
  return (
    <div className="dc-card-toolbar">
      <div>
        <h2 className="font-display font-semibold" style={{ fontSize: 16, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {side}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 sm:px-6 py-10 text-center">
      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>{message}</p>
    </div>
  );
}

function KPICard({
  label,
  value,
  hint,
  format,
}: {
  label: string;
  value: string | number;
  hint?: string;
  format?: (n: number) => string;
}) {
  const isNumber = typeof value === "number";
  const animated = useCountUp(isNumber ? value : 0, 1000);
  const display = isNumber ? (format ? format(animated) : String(Math.round(animated))) : value;

  return (
    <div className="dc-card kpi-tile dc-card-pad">
      <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{label}</div>
      <p className="font-display font-semibold" style={{ fontSize: 32, color: "var(--ink)", letterSpacing: "-0.02em", marginTop: 6 }}>
        {display}
      </p>
      {hint ? <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}
