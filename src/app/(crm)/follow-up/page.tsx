"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUpRow } from "@/types";

const FU_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "FU01 — Dia 3",  color: "#1A56DB", bg: "rgba(26,86,219,0.10)" },
  2: { label: "FU02 — Dia 6",  color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  3: { label: "FU03 — Dia 14", color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "var(--ok)" : s >= 40 ? "#D97706" : "var(--err)";

function DayBadge({ days, eligible }: { days: number; eligible: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, fontFamily: "JetBrains Mono",
      letterSpacing: "0.1em", padding: "2px 8px", borderRadius: 6,
      background: eligible ? "rgba(5,150,105,0.12)" : "rgba(156,163,175,0.12)",
      color: eligible ? "var(--ok)" : "var(--ink-4)",
    }}>
      {days}d pós-reunião
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copiar mensagem"
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: copied ? "var(--ok)" : "var(--ink-4)",
        padding: "2px 6px", borderRadius: 4, fontSize: 11,
        transition: "color 0.15s",
      }}
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function FollowUpCard({
  row,
  onSend,
  onResponded,
  loading,
}: {
  row: FollowUpRow;
  onSend: () => void;
  onResponded: () => void;
  loading: boolean;
}) {
  const fu = FU_LABELS[row.next_fu_number] ?? FU_LABELS[1];

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-1)" }}>
              {row.lead_name ?? "Sem nome"}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, fontFamily: "JetBrains Mono",
              letterSpacing: "0.14em", padding: "2px 8px", borderRadius: 6,
              background: fu.bg, color: fu.color,
              textTransform: "uppercase",
            }}>
              {fu.label}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--ink-4)", fontFamily: "JetBrains Mono" }}>
            {row.lead_phone}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DayBadge days={row.days_since_meeting} eligible={row.eligible} />
          <div style={{
            fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono",
            color: SCORE_COLOR(row.qualification_score),
            padding: "2px 8px", borderRadius: 6,
            background: "var(--bg)",
            border: "1px solid var(--line)",
          }}>
            Score {row.qualification_score}
          </div>
        </div>
      </div>

      {/* Mensagem preview */}
      <div style={{
        background: "var(--bg)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: "12px 14px",
        position: "relative",
      }}>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>
          {row.next_fu_message}
        </p>
        <div style={{ position: "absolute", top: 8, right: 10 }}>
          <CopyButton text={row.next_fu_message} />
        </div>
      </div>

      {!row.eligible && (
        <p style={{ fontSize: 11, color: "var(--ink-4)", margin: 0, fontStyle: "italic" }}>
          Aguarde — este follow-up está disponível a partir do dia {
            { 1: 3, 2: 6, 3: 14 }[row.next_fu_number]
          } após a reunião.
        </p>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          disabled={!row.eligible || loading}
          onClick={onSend}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 8,
            border: "none",
            cursor: row.eligible && !loading ? "pointer" : "not-allowed",
            background: row.eligible ? "var(--accent)" : "var(--line)",
            color: row.eligible ? "#fff" : "var(--ink-4)",
            fontFamily: "JetBrains Mono",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            transition: "opacity 0.15s",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Salvando..." : `Enviar FU0${row.next_fu_number}`}
        </button>

        <button
          disabled={loading}
          onClick={onResponded}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid var(--ok)",
            cursor: loading ? "not-allowed" : "pointer",
            background: "rgba(5,150,105,0.08)",
            color: "var(--ok)",
            fontFamily: "JetBrains Mono",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            transition: "opacity 0.15s",
            opacity: loading ? 0.6 : 1,
            whiteSpace: "nowrap" as const,
          }}
        >
          Lead Respondeu
        </button>
      </div>
    </div>
  );
}

export default function FollowUpPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["follow-ups"],
    queryFn: () => api.getFollowUps(),
    refetchInterval: 60_000,
  });

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: (leadId: string) => api.sendFollowUp(leadId),
    onMutate: (leadId) => setLoadingId(leadId),
    onSettled: () => {
      setLoadingId(null);
      qc.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });

  const respondedMutation = useMutation({
    mutationFn: (leadId: string) => api.markFollowUpResponded(leadId),
    onMutate: (leadId) => setLoadingId(leadId),
    onSettled: () => {
      setLoadingId(null);
      qc.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });

  const items: FollowUpRow[] = data?.items ?? [];
  const eligibleCount = items.filter((r) => r.eligible).length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "var(--ink-1)", margin: 0 }}>
          Follow-up
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-4)", margin: "6px 0 0", lineHeight: 1.5 }}>
          Acompanhamento pós-reunião — FU01 · FU02 · FU03
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total na fila", value: items.length },
          { label: "Prontos para envio", value: eligibleCount, accent: true },
          { label: "Aguardando janela", value: items.length - eligibleCount },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1,
            background: s.accent ? "rgba(26,86,219,0.06)" : "var(--surface)",
            border: `1px solid ${s.accent ? "rgba(26,86,219,0.2)" : "var(--line)"}`,
            borderRadius: 10,
            padding: "14px 18px",
          }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.accent ? "var(--accent)" : "var(--ink-1)", margin: 0, fontFamily: "JetBrains Mono" }}>
              {s.value}
            </p>
            <p style={{ fontSize: 10, color: "var(--ink-4)", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "JetBrains Mono" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <p style={{ color: "var(--ink-4)", fontSize: 13 }}>Carregando...</p>
      )}

      {isError && (
        <p style={{ color: "var(--err)", fontSize: 13 }}>
          Erro ao carregar follow-ups. Tente recarregar a página.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 0",
          color: "var(--ink-4)", fontSize: 13,
        }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>✓</p>
          <p>Nenhum lead aguardando follow-up no momento.</p>
          <p style={{ fontSize: 11, marginTop: 6 }}>Leads em proposta com reunião realizada aparecerão aqui.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((row) => (
          <FollowUpCard
            key={row.lead_id}
            row={row}
            loading={loadingId === row.lead_id}
            onSend={() => sendMutation.mutate(row.lead_id)}
            onResponded={() => respondedMutation.mutate(row.lead_id)}
          />
        ))}
      </div>
    </div>
  );
}
