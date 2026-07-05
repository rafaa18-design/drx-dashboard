"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHero } from "@/components/PageHero";
import type { FollowUpRow } from "@/types";

const FU_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "FU01 — Dia 3",  color: "var(--ink-3)", bg: "rgba(92,114,144,0.10)" },
  2: { label: "FU02 — Dia 6",  color: "var(--warn)",  bg: "rgba(180,83,9,0.10)" },
  3: { label: "FU03 — Dia 14", color: "var(--danger)",bg: "rgba(179,38,30,0.10)" },
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "var(--ok)" : s >= 40 ? "var(--warn)" : "var(--danger)";

function initials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function DayBadge({ days, eligible }: { days: number; eligible: boolean }) {
  return (
    <span className="font-mono" style={{
      fontSize: 9, fontWeight: 700,
      letterSpacing: "0.08em", padding: "3px 9px", textTransform: "uppercase",
      background: eligible ? "rgba(15,122,92,0.10)" : "rgba(156,172,192,0.12)",
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
      className="font-mono"
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: copied ? "var(--ok)" : "var(--ink-4)",
        padding: "3px 8px", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
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
  const name = row.lead_name ?? "Sem nome";

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }} className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="font-display font-bold flex items-center justify-center flex-shrink-0"
            style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 13 }}
          >
            {initials(name)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                {name}
              </span>
              <span className="font-mono" style={{
                fontSize: 9, fontWeight: 700,
                letterSpacing: "0.12em", padding: "3px 8px",
                background: fu.bg, color: fu.color,
                textTransform: "uppercase",
              }}>
                {fu.label}
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {row.lead_phone}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DayBadge days={row.days_since_meeting} eligible={row.eligible} />
          <div className="font-mono" style={{
            fontSize: 10, fontWeight: 700,
            color: SCORE_COLOR(row.qualification_score),
            padding: "3px 9px",
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
        padding: "12px 14px",
        position: "relative",
      }}>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, margin: 0, paddingRight: 60 }}>
          {row.next_fu_message}
        </p>
        <div style={{ position: "absolute", top: 6, right: 8 }}>
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
      <div className="flex gap-2">
        <button
          disabled={!row.eligible || loading}
          onClick={onSend}
          className="font-mono flex-1"
          style={{
            padding: "10px 0",
            border: "none",
            cursor: row.eligible && !loading ? "pointer" : "not-allowed",
            background: row.eligible ? "var(--ink)" : "var(--line)",
            color: row.eligible ? "#fff" : "var(--ink-4)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "opacity 0.15s",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Salvando..." : `Enviar FU0${row.next_fu_number}`}
        </button>

        <button
          disabled={loading}
          onClick={onResponded}
          className="font-mono"
          style={{
            padding: "10px 16px",
            border: "1px solid var(--ok)",
            cursor: loading ? "not-allowed" : "pointer",
            background: "rgba(15,122,92,0.07)",
            color: "var(--ok)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "opacity 0.15s",
            opacity: loading ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          Lead respondeu
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
  const waitingCount = items.length - eligibleCount;

  const [tab, setTab] = useState<"all" | "eligible" | "waiting">("all");
  const visibleItems = items.filter((r) => {
    if (tab === "eligible") return r.eligible;
    if (tab === "waiting") return !r.eligible;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHero
        label="Pós-reunião"
        title="Follow-up"
        subtitle="Acompanhamento FU01 · FU02 · FU03"
        stats={[
          { value: items.length, label: "Total na fila" },
          { value: eligibleCount, label: "Prontos para envio" },
          { value: waitingCount, label: "Aguardando janela" },
        ]}
      />

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Filtro por abas */}
      {items.length > 0 && (
        <div className="flex gap-2 mb-6">
          {[
            { key: "all" as const,      label: `Todos (${items.length})` },
            { key: "eligible" as const, label: `Prontos (${eligibleCount})` },
            { key: "waiting" as const,  label: `Aguardando (${waitingCount})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="font-mono"
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "8px 14px", cursor: "pointer",
                color: tab === t.key ? "#FFFFFF" : "var(--ink-3)",
                background: tab === t.key ? "var(--ink)" : "var(--surface)",
                border: `1px solid ${tab === t.key ? "var(--ink)" : "var(--line)"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading && (
        <p className="font-mono" style={{ color: "var(--ink-4)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center", padding: "32px 0" }}>
          Carregando...
        </p>
      )}

      {isError && (
        <p style={{ color: "var(--danger)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
          Erro ao carregar follow-ups. Tente recarregar a página.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div style={{
          textAlign: "center", padding: "56px 16px",
          background: "var(--surface)", border: "1px solid var(--line)",
        }}>
          <p className="font-mono mb-2" style={{ fontSize: 10, color: "var(--ok)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            ✓ tudo em dia
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum lead aguardando follow-up no momento.</p>
          <p style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>Leads em proposta com reunião realizada aparecerão aqui.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && !visibleItems.length && (
        <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--ink-4)", fontSize: 13 }}>
          Nenhum lead nesse filtro.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {visibleItems.map((row) => (
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
    </div>
  );
}
