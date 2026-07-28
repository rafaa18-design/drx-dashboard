"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ScheduleSlot, ScheduleWeek, SlotState } from "@/types";

/** Segunda-feira da semana da data informada, em YYYY-MM-DD. */
function mondayOf(d: Date): string {
  const copy = new Date(d);
  const diff = (copy.getDay() + 6) % 7; // 0 = segunda
  copy.setDate(copy.getDate() - diff);
  return copy.toISOString().slice(0, 10);
}

function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function dayLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** Soma 30 minutos a um HH:MM. */
function plus30(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const STYLE: Record<SlotState, { bg: string; color: string; border?: string }> = {
  livre:           { bg: "var(--surface)",          color: "var(--ink-4)" },
  fora_expediente: { bg: "var(--bg)",               color: "var(--ink-4)" },
  reuniao:         { bg: "rgba(15,122,92,0.10)",    color: "var(--ok)" },
  bloqueado:       { bg: "rgba(179,38,30,0.10)",    color: "var(--danger)" },
  ocupado:         { bg: "rgba(92,114,144,0.12)",   color: "var(--ink-3)" },
  aberto:          { bg: "rgba(180,83,9,0.10)",     color: "var(--warn)" },
};

const LEGEND: { state: SlotState; label: string }[] = [
  { state: "livre",           label: "Livre" },
  { state: "reuniao",         label: "Reunião" },
  { state: "bloqueado",       label: "Bloqueado" },
  { state: "aberto",          label: "Aberto (fora do padrão)" },
  { state: "ocupado",         label: "Compromisso pessoal" },
  { state: "fora_expediente", label: "Fora do expediente" },
];

function slotText(slot: ScheduleSlot): string {
  switch (slot.state) {
    case "reuniao":   return slot.label ?? "Reunião";
    case "ocupado":   return slot.label ?? "Ocupado";
    case "bloqueado": return "Bloqueado";
    case "aberto":    return "Aberto";
    default:          return "";
  }
}

export default function AgendaPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ScheduleWeek>({
    queryKey: ["schedule", weekStart],
    queryFn: () => api.getScheduleWeek(weekStart),
    refetchInterval: 60_000,
  });

  function onError(err: Error) {
    let detail = err.message;
    try {
      detail = JSON.parse(err.message).detail ?? err.message;
    } catch {
      /* já é texto puro */
    }
    setError(detail);
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ["schedule"] });

  const block = useMutation({
    mutationFn: (v: { date: string; start_time: string }) =>
      api.blockSlot({ date: v.date, start_time: v.start_time, end_time: plus30(v.start_time) }),
    onSuccess: () => { setError(null); invalidate(); },
    onError,
  });

  const open = useMutation({
    mutationFn: (v: { date: string; start_time: string }) =>
      api.openSlot({ date: v.date, start_time: v.start_time, end_time: plus30(v.start_time) }),
    onSuccess: () => { setError(null); invalidate(); },
    onError,
  });

  const remove = useMutation({
    mutationFn: (eventId: string) => api.deleteScheduleMarker(eventId),
    onSuccess: () => { setError(null); invalidate(); },
    onError,
  });

  const pending = block.isPending || open.isPending || remove.isPending;

  function handleClick(date: string, slot: ScheduleSlot) {
    if (pending) return;
    switch (slot.state) {
      case "livre":
        block.mutate({ date, start_time: slot.time });
        break;
      case "fora_expediente":
        open.mutate({ date, start_time: slot.time });
        break;
      case "bloqueado":
      case "aberto":
        if (slot.event_id) remove.mutate(slot.event_id);
        break;
      case "reuniao":
        if (slot.lead_id) router.push(`/leads/${slot.lead_id}`);
        break;
      // "ocupado" (compromisso pessoal do Tiago) é só leitura — o CRM não mexe.
    }
  }

  // Todos os dias têm a mesma grade de horários; usa o primeiro como régua.
  const times = useMemo(
    () => data?.days?.[0]?.slots.map((s) => s.time) ?? [],
    [data]
  );

  const rangeLabel = data ? `${dayLabel(data.start)} a ${dayLabel(data.end)}` : "";

  return (
    <div className="space-y-6 animate-fadeIn">
      <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
        Clique num horário livre pra bloquear, ou num horário fora do expediente pra abrir
        excepcionalmente. As mudanças valem na hora pro agente e aparecem no Google Calendar do Tiago.
      </p>

      <div className="dc-card">
        <div className="dc-card-toolbar">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold" style={{ fontSize: 16, color: "var(--ink)" }}>Agenda</span>
            <span className="dc-count-pill">{rangeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart((w) => addWeeks(w, -1))}
              style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "var(--r-md)", padding: "0 14px", height: 38, cursor: "pointer" }}
            >
              ← Semana anterior
            </button>
            <button
              onClick={() => setWeekStart(mondayOf(new Date()))}
              style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "var(--r-md)", padding: "0 14px", height: 38, cursor: "pointer" }}
            >
              Hoje
            </button>
            <button
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "var(--r-md)", padding: "0 14px", height: 38, cursor: "pointer" }}
            >
              Próxima semana →
            </button>
          </div>
        </div>

        {error && (
          <div style={{ margin: "12px 16px 0", padding: "10px 12px", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--danger)", background: "rgba(179,38,30,0.08)" }}>
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3 px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid var(--line-soft)" }}>
          {LEGEND.map(({ state, label }) => (
            <span key={state} className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--ink-3)" }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: STYLE[state].bg, border: "1px solid var(--line)", display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>

        {isLoading && (
          <div className="text-center" style={{ padding: "48px 0" }}>
            <span style={{ fontSize: 13, color: "var(--ink-4)" }}>Carregando agenda...</span>
          </div>
        )}

        {!isLoading && data && (
          <div className="overflow-x-auto" style={{ opacity: pending ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <table className="w-full" style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
              <thead className="dc-thead">
                <tr>
                  <th style={{ width: 58, textAlign: "left" }}>Hora</th>
                  {data.days.map((d) => (
                    <th key={d.date} style={{ textAlign: "center", color: d.is_today ? "var(--accent)" : undefined }}>
                      {d.weekday}<br />
                      <span style={{ fontWeight: 400, fontSize: 11 }}>{dayLabel(d.date)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((t, rowIdx) => (
                  <tr key={t}>
                    <td style={{ color: "var(--ink-3)", fontWeight: 600, padding: "0 8px", borderTop: "1px solid var(--line-soft)", whiteSpace: "nowrap" }}>
                      {t}
                    </td>
                    {data.days.map((d) => {
                      const slot = d.slots[rowIdx];
                      if (!slot) return <td key={d.date} style={{ borderTop: "1px solid var(--line-soft)" }} />;
                      const s = STYLE[slot.state];
                      const clickable = !slot.past && slot.state !== "ocupado";
                      const text = slotText(slot);
                      return (
                        <td
                          key={d.date}
                          onClick={() => clickable && handleClick(d.date, slot)}
                          title={
                            slot.state === "livre" ? "Clique pra bloquear"
                            : slot.state === "fora_expediente" ? "Clique pra abrir excepcionalmente"
                            : slot.state === "bloqueado" ? "Clique pra liberar"
                            : slot.state === "aberto" ? "Clique pra remover a abertura"
                            : slot.state === "reuniao" ? `${text} — clique pra ver o lead`
                            : text
                          }
                          style={{
                            background: s.bg,
                            color: s.color,
                            borderTop: "1px solid var(--line-soft)",
                            borderLeft: "1px solid var(--line-soft)",
                            padding: "5px 6px",
                            textAlign: "center",
                            height: 30,
                            cursor: clickable ? "pointer" : "default",
                            opacity: slot.past ? 0.45 : 1,
                            fontWeight: text ? 600 : 400,
                            maxWidth: 130,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
