"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Appointment } from "@/types";

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
  scheduled: { bg: "rgba(184,116,26,0.10)", text: "#B8741A" },
  confirmed: { bg: "rgba(45,104,69,0.10)",  text: "#2D6845" },
  cancelled: { bg: "rgba(156,15,32,0.08)",  text: "#9C0F20" },
  completed: { bg: "rgba(45,104,69,0.08)",  text: "#2D6845" },
  no_show:   { bg: "rgba(110,106,102,0.08)", text: "#6E6A66" },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { data: kpis }   = useQuery({ queryKey: ["kpis"],   queryFn: api.getKPIs,   refetchInterval: 60_000  });
  const { data: funnel } = useQuery({ queryKey: ["funnel"], queryFn: api.getFunnel, refetchInterval: 300_000 });
  const { data: appts }  = useQuery({
    queryKey: ["dashboard-appointments"],
    queryFn: () => api.getAppointments({ limit: "10", status: "scheduled" }) as Promise<{ items: Appointment[]; total: number }>,
    refetchInterval: 60_000,
  });

  const funnelTotal = funnel?.stages.reduce((a: number, s: { count: number }) => a + s.count, 0) || 1;

  return (
    <div className="space-y-10 animate-fadeIn">

      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <div>
        <p
          className="font-mono mb-2"
          style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}
        >
          Visão geral
        </p>
        <h1
          className="font-display font-bold text-2xl sm:text-4xl"
          style={{ color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.05 }}
        >
          Dashboard
        </h1>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <KPICard
          code="01"
          label="Leads este mês"
          value={kpis?.leads_this_month ?? "—"}
        />
        <KPICard
          code="02"
          label="Agendamentos"
          value={kpis?.appointments_scheduled ?? "—"}
        />
        <KPICard
          code="03"
          label="Taxa de conversão"
          value={kpis ? `${(kpis.conversion_rate * 100).toFixed(1)}%` : "—"}
        />
        <KPICard
          code="04"
          label="Taxa de escalação"
          value={kpis ? `${(kpis.escalation_rate * 100).toFixed(1)}%` : "—"}
          last
        />
      </div>

      {/* ── Agendamentos próximos ─────────────────────────── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <div
          className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>
              P.02
            </span>
            <h2 className="font-display font-bold" style={{ fontSize: 18, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              Próximos agendamentos
            </h2>
          </div>
          <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {appts?.total ?? 0} no total
          </span>
        </div>

        <div className="px-4 sm:px-6 py-4">
          {!appts?.items.length ? (
            <p style={{ fontSize: 13, color: "var(--ink-4)", padding: "12px 0" }}>
              Nenhum agendamento pendente.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {appts.items.map((appt) => {
                const sc = APPT_STATUS_COLOR[appt.status] ?? APPT_STATUS_COLOR.scheduled;
                return (
                  <div
                    key={appt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0"
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Date block */}
                      <div style={{
                        width: 48, textAlign: "center", flexShrink: 0,
                        background: "rgba(156,15,32,0.06)", borderRadius: 8, padding: "6px 4px",
                      }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", fontFamily: "JetBrains Mono", lineHeight: 1 }}>
                          {new Date(appt.scheduled_at).getDate().toString().padStart(2, "0")}
                        </p>
                        <p style={{ fontSize: 9, color: "var(--ink-3)", fontFamily: "JetBrains Mono", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                          {new Date(appt.scheduled_at).toLocaleString("pt-BR", { month: "short" })}
                        </p>
                      </div>

                      {/* Info */}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                          {formatDateTime(appt.scheduled_at)}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, fontFamily: "JetBrains Mono" }}>
                          {appt.duration_minutes} min
                          {appt.google_meet_link && (
                            <> · <a href={appt.google_meet_link} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Meet</a></>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: sc.text, background: sc.bg,
                      padding: "3px 10px", borderRadius: 6,
                    }}>
                      {APPT_STATUS_LABEL[appt.status] ?? appt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Funil ─────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
        }}
      >
        <div
          className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="font-mono"
              style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}
            >
              P.05
            </span>
            <h2
              className="font-display font-bold"
              style={{ fontSize: 18, color: "var(--ink)", letterSpacing: "-0.01em" }}
            >
              Funil de conversão
            </h2>
          </div>
          <span
            className="font-mono"
            style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            {funnelTotal} leads total
          </span>
        </div>

        <div className="px-4 sm:px-6 py-6">
          {funnel?.stages.length ? (
            <div className="space-y-3">
              {funnel.stages.map((s: { stage: string; count: number }) => {
                const pct = Math.round((s.count / funnelTotal) * 100);
                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}
                      >
                        {STAGE_LABELS[s.stage] ?? s.stage}
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className="font-mono"
                          style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 700 }}
                        >
                          {s.count}
                        </span>
                        <span
                          className="font-mono"
                          style={{ fontSize: 10, color: "var(--ink-4)", minWidth: 32, textAlign: "right" }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "var(--line)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--accent)",
                          borderRadius: 2,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-4)" }}>
              Carregando funil...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  code,
  label,
  value,
  last,
}: {
  code: string;
  label: string;
  value: string | number;
  last?: boolean;
}) {
  return (
    <div
      className="p-6"
      style={{
        borderRight: last ? "none" : "1px solid var(--line)",
      }}
    >
      <p
        className="font-mono mb-3"
        style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}
      >
        {code}
      </p>
      <p
        className="font-mono font-bold leading-none mb-2"
        style={{ fontSize: 42, color: "var(--ink)", letterSpacing: "-0.04em" }}
      >
        {value}
      </p>
      <p
        style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4 }}
      >
        {label}
      </p>
    </div>
  );
}
