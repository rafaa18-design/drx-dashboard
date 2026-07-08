"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { PageHero } from "@/components/PageHero";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import type { Appointment } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  initial_consultation: "Primeira reunião",
  follow_up:            "Acompanhamento",
  consultation:         "Consulta",
  review:               "Revisão de caso",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show:   "Não compareceu",
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "rgba(180,83,9,0.08)",   text: "var(--warn)" },
  confirmed: { bg: "rgba(15,122,92,0.10)",  text: "var(--ok)" },
  completed: { bg: "rgba(15,122,92,0.08)",  text: "var(--ok)" },
  cancelled: { bg: "rgba(179,38,30,0.08)",  text: "var(--danger)" },
  no_show:   { bg: "rgba(92,114,144,0.10)", text: "var(--ink-3)" },
};

function initials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Hoje · ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Amanhã · ${format(d, "HH:mm")}`;
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function ChannelBadge({ appt }: { appt: Appointment }) {
  if (appt.google_meet_link) {
    return (
      <a
        href={appt.google_meet_link}
        target="_blank"
        rel="noreferrer"
        className="btn-meet"
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
        Google Meet
      </a>
    );
  }
  return (
    <span
      className="font-mono"
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
        color: "var(--ok)", background: "rgba(15,122,92,0.08)",
        padding: "5px 10px",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
      WhatsApp
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.scheduled;
  return (
    <span
      className="font-mono"
      style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: s.text, background: s.bg, padding: "3px 9px" }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const params = statusFilter ? { status: statusFilter } : undefined;
  const { data, isLoading } = useQuery<{ items: Appointment[]; total: number }>({
    queryKey: ["appointments", statusFilter],
    queryFn: () => api.getAppointments(params),
  });

  const items = data?.items ?? [];
  const upcomingCount = items.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
  const completedCount = items.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHero
        label="Agenda de reuniões"
        title="Agendamentos"
        stats={[
          { value: data?.total ?? "—", label: "No total" },
          { value: isLoading ? "—" : upcomingCount, label: "Agendadas" },
          { value: isLoading ? "—" : completedCount, label: "Realizadas" },
        ]}
      />

      {/* ── Filtro + ação ───────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="font-mono"
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--ink-3)", border: "1px solid var(--line)", background: "var(--surface)",
                padding: "0 16px", height: 38, cursor: "pointer",
              }}
            >
              Limpar
            </button>
          )}
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="font-mono"
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#FFFFFF", background: "var(--ink)", border: "none",
            padding: "10px 16px", cursor: "pointer",
          }}
        >
          + Nova reunião
        </button>
      </div>

      {showNewModal && <NewAppointmentModal onClose={() => setShowNewModal(false)} />}

      {/* ── Desktop: tabela ── */}
      <div className="hidden md:block" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              {["Cliente", "Data / Hora", "Tipo", "Status", "Canal"].map((h) => (
                <th
                  key={h}
                  className="font-mono text-left"
                  style={{ padding: "12px 16px", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((appt) => {
              const name = appt.lead_name ?? appt.lead_phone ?? "—";
              return (
                <tr key={appt.id} className="row-hover" style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="font-display font-bold flex items-center justify-center flex-shrink-0"
                        style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 12 }}
                      >
                        {initials(name)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: "var(--ink)" }}>{name}</p>
                        {appt.lead_phone && appt.lead_name && (
                          <p className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{appt.lead_phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>
                    {formatWhen(appt.scheduled_at)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--ink-3)" }}>
                    {TYPE_LABELS[appt.appointment_type ?? ""] ?? appt.appointment_type ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={appt.status} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <ChannelBadge appt={appt} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {isLoading && (
          <div className="text-center" style={{ padding: "48px 0" }}>
            <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Carregando...
            </span>
          </div>
        )}
        {!isLoading && !items.length && <EmptyState />}
      </div>

      {/* ── Mobile: cards ── */}
      <div className="md:hidden space-y-3">
        {items.map((appt) => {
          const name = appt.lead_name ?? appt.lead_phone ?? "—";
          return (
            <div key={appt.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: 16 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="font-display font-bold flex items-center justify-center flex-shrink-0"
                    style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 13 }}
                  >
                    {initials(name)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{name}</p>
                    {appt.lead_phone && appt.lead_name && (
                      <p className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{appt.lead_phone}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={appt.status} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>
                {formatWhen(appt.scheduled_at)}
              </p>
              <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10 }}>
                {TYPE_LABELS[appt.appointment_type ?? ""] ?? appt.appointment_type ?? "—"}
              </p>
              <ChannelBadge appt={appt} />
            </div>
          );
        })}
        {isLoading && (
          <p className="text-center font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.2em", textTransform: "uppercase", padding: "32px 0" }}>
            Carregando...
          </p>
        )}
        {!isLoading && !items.length && <EmptyState />}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center" style={{ padding: "56px 16px" }}>
      <p className="font-mono mb-2" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        · · ·
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum agendamento encontrado.</p>
    </div>
  );
}
