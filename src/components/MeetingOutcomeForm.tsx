"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Appointment, MeetingOutcome, MeetingQuality } from "@/types";

const QUALITY_LABELS: Record<MeetingQuality, string> = {
  high_awareness: "Alta consciência",
  partial: "Parcial",
  low_awareness: "Baixa consciência",
};

const OUTCOME_LABELS: Record<MeetingOutcome, string> = {
  contracted: "Contratou",
  proposal_open: "Proposta em aberto",
  no_fit: "Sem aderência",
  no_priority: "Sem prioridade",
  no_capacity_now: "Sem capacidade agora",
  expectation_mismatch: "Expectativa incompatível",
  other: "Outro",
};

export function MeetingOutcomeForm({ appointment }: { appointment: Appointment }) {
  const qc = useQueryClient();
  const [quality, setQuality] = useState<MeetingQuality | "">(appointment.meeting_quality ?? "");
  const [outcome, setOutcome] = useState<MeetingOutcome | "">(appointment.meeting_outcome ?? "");
  const [reason, setReason] = useState(appointment.main_outcome_reason ?? "");

  useEffect(() => {
    setQuality(appointment.meeting_quality ?? "");
    setOutcome(appointment.meeting_outcome ?? "");
    setReason(appointment.main_outcome_reason ?? "");
  }, [appointment]);

  const save = useMutation({
    mutationFn: () => api.updateAppointmentOutcome(appointment.id, {
      meeting_quality: quality || null,
      meeting_outcome: outcome || null,
      main_outcome_reason: reason.trim() || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["lead-appointments"] });
    },
  });

  if (appointment.status !== "completed" && !appointment.meeting_outcome) return null;

  const canSave = Boolean(quality && outcome && reason.trim());

  return (
    <div style={{ marginTop: 12, padding: 14, border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--bg)" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 10 }}>Resultado da reunião</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select className="filter-select w-full" value={quality} onChange={(event) => setQuality(event.target.value as MeetingQuality | "")}>
          <option value="">Qualidade da reunião</option>
          {Object.entries(QUALITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="filter-select w-full" value={outcome} onChange={(event) => setOutcome(event.target.value as MeetingOutcome | "")}>
          <option value="">Resultado</option>
          {Object.entries(OUTCOME_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Motivo principal da perda ou do avanço"
        className="filter-input w-full"
        style={{ marginTop: 8, height: "auto", paddingTop: 9, resize: "vertical" }}
      />
      <div className="flex items-center justify-between gap-3" style={{ marginTop: 8 }}>
        <span style={{ fontSize: 11, color: save.isError ? "var(--danger)" : "var(--ink-4)" }}>
          {save.isError ? (save.error instanceof Error ? save.error.message : "Não foi possível salvar.") : appointment.outcome_recorded_at ? `Salvo em ${new Date(appointment.outcome_recorded_at).toLocaleString("pt-BR")}` : "Preencha os três campos."}
        </span>
        <button
          type="button"
          disabled={!canSave || save.isPending}
          onClick={() => save.mutate()}
          style={{ border: "none", borderRadius: "var(--r-md)", padding: "8px 13px", background: canSave ? "var(--ink)" : "var(--line)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed" }}
        >
          {save.isPending ? "Salvando..." : "Salvar resultado"}
        </button>
      </div>
    </div>
  );
}
