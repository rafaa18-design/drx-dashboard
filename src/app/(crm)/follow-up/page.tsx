"use client";

import { Fragment, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUpRow } from "@/types";

const FU_MIN_DAYS: Record<number, number> = { 1: 3, 2: 6, 3: 14 };

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "var(--ok)" : s >= 40 ? "var(--warn)" : "var(--danger)";

function initials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Linha do tempo da cadência: FU01 (dia 3) → FU02 (dia 6) → FU03 (dia 14). */
function FuStepper({ sent, next, eligible }: { sent: number; next: number; eligible: boolean }) {
  const steps = [{ n: 1, day: 3 }, { n: 2, day: 6 }, { n: 3, day: 14 }];
  return (
    <div className="flex items-start" style={{ padding: "2px 2px 0" }}>
      {steps.map((s, i) => {
        const done = s.n <= sent;
        const current = s.n === next;
        return (
          <Fragment key={s.n}>
            {i > 0 && <div style={{ flex: 1, height: 2, marginTop: 13, borderRadius: "var(--r-full)", background: done ? "var(--ink)" : "var(--line)" }} />}
            <div className="flex flex-col items-center" style={{ gap: 5, minWidth: 52 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  fontSize: 11, fontWeight: 700, position: "relative",
                  ...(done
                    ? { background: "var(--ink)", color: "#FFFFFF", border: "2px solid var(--ink)" }
                    : current
                      ? { background: eligible ? "rgba(15,122,92,0.10)" : "var(--accent-soft)", color: eligible ? "var(--ok)" : "var(--accent)", border: `2px solid ${eligible ? "var(--ok)" : "var(--accent)"}` }
                      : { background: "var(--surface)", color: "var(--ink-4)", border: "2px solid var(--line)" }),
                }}
              >
                {done ? "✓" : `0${s.n}`}
                {current && eligible && (
                  <span className="drx-ping-box" style={{ position: "absolute", inset: -2, borderRadius: "50%", border: "2px solid var(--ok)", pointerEvents: "none" }} />
                )}
              </div>
              <span style={{ fontSize: 11, color: current ? (eligible ? "var(--ok)" : "var(--accent)") : "var(--ink-4)", fontWeight: current ? 600 : 400 }}>
                dia {s.day}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function StatusChip({ row }: { row: FollowUpRow }) {
  if (row.eligible) {
    return (
      <span className="badge-pill" style={{ background: "rgba(15,122,92,0.10)", color: "var(--ok)" }}>
        <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)" }} />
        Pronto para envio
      </span>
    );
  }
  const minDays = FU_MIN_DAYS[row.next_fu_number] ?? 3;
  const falta = Math.max(minDays - row.days_since_meeting, 1);
  return <span className="badge-pill" style={{ background: "rgba(180,83,9,0.08)", color: "var(--warn)" }}>Libera em {falta}d</span>;
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
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", cursor: "pointer",
        color: copied ? "var(--ok)" : "var(--ink-3)",
        padding: "4px 12px", fontSize: 12, fontWeight: 600,
      }}
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function FollowUpCard({ row, index, onSend, onResponded, loading }: {
  row: FollowUpRow; index: number; onSend: () => void; onResponded: () => void; loading: boolean;
}) {
  const name = row.lead_name ?? "Sem nome";
  const waUrl = `https://wa.me/${row.lead_phone.replace(/\D/g, "")}?text=${encodeURIComponent(row.next_fu_message)}`;

  return (
    <div
      className="drx-fadeup dc-card p-5 sm:p-6"
      style={{ borderLeft: `3px solid ${row.eligible ? "var(--ok)" : "var(--ink-4)"}`, display: "flex", flexDirection: "column", gap: 18, animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="font-display font-semibold flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 15 }}>
            {initials(name)}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>{name}</p>
            <div className="flex items-center gap-2.5 flex-wrap" style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{row.lead_phone}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: SCORE_COLOR(row.qualification_score) }}>score {row.qualification_score}</span>
              <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
                · {row.days_since_meeting < 0 ? `reunião em ${-row.days_since_meeting}d` : row.days_since_meeting === 0 ? "reunião hoje" : `${row.days_since_meeting}d pós-reunião`}
              </span>
            </div>
          </div>
        </div>
        <StatusChip row={row} />
      </div>

      <div style={{ background: "var(--bg)", borderRadius: "var(--r-md)", border: "1px solid var(--line-soft)", padding: "14px 18px 10px" }}>
        <FuStepper sent={row.follow_up_count} next={row.next_fu_number} eligible={row.eligible} />
      </div>

      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-4)" }}>Mensagem do FU0{row.next_fu_number}</span>
          <CopyButton text={row.next_fu_message} />
        </div>
        <div style={{ background: "var(--bg)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--accent-line)", padding: "12px 16px" }}>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{row.next_fu_message}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          disabled={!row.eligible || loading}
          onClick={onSend}
          className="flex-1"
          style={{
            padding: "12px 0", minWidth: 150, borderRadius: "var(--r-md)", border: "none",
            cursor: row.eligible && !loading ? "pointer" : "not-allowed",
            background: row.eligible ? "var(--ink)" : "var(--line)",
            color: row.eligible ? "#fff" : "var(--ink-4)",
            fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Salvando..." : `Enviar FU0${row.next_fu_number}`}
        </button>

        <a href={waUrl} target="_blank" rel="noreferrer" title="Abrir conversa no WhatsApp com a mensagem preenchida" className="flex items-center justify-center gap-2"
          style={{ padding: "12px 16px", borderRadius: "var(--r-md)", border: "1px solid var(--accent-line)", background: "var(--accent-soft)", color: "var(--accent)", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          WhatsApp ↗
        </a>

        <button
          disabled={loading}
          onClick={onResponded}
          style={{ padding: "12px 16px", borderRadius: "var(--r-md)", border: "1px solid var(--ok)", cursor: loading ? "not-allowed" : "pointer", background: "rgba(15,122,92,0.07)", color: "var(--ok)", fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1, whiteSpace: "nowrap" }}
        >
          ✓ Respondeu
        </button>
      </div>
    </div>
  );
}

function GroupHeader({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-3" style={{ margin: "4px 0 2px" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <h2 className="font-display font-semibold" style={{ fontSize: 16, color: "var(--ink)", letterSpacing: "-0.01em" }}>{label}</h2>
      <span className="dc-count-pill" style={{ color, background: `${color}18` }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
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
    onSettled: () => { setLoadingId(null); qc.invalidateQueries({ queryKey: ["follow-ups"] }); },
  });

  const respondedMutation = useMutation({
    mutationFn: (leadId: string) => api.markFollowUpResponded(leadId),
    onMutate: (leadId) => setLoadingId(leadId),
    onSettled: () => { setLoadingId(null); qc.invalidateQueries({ queryKey: ["follow-ups"] }); },
  });

  const items: FollowUpRow[] = data?.items ?? [];
  const eligibleItems = items.filter((r) => r.eligible);
  const waitingItems = items.filter((r) => !r.eligible);

  const [tab, setTab] = useState<"all" | "eligible" | "waiting">("all");

  const renderGrid = (rows: FollowUpRow[], offset = 0) => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {rows.map((row, i) => (
        <FollowUpCard key={row.lead_id} row={row} index={offset + i} loading={loadingId === row.lead_id}
          onSend={() => sendMutation.mutate(row.lead_id)} onResponded={() => respondedMutation.mutate(row.lead_id)} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
        Acompanhamento pós-reunião · cadência FU01 · FU02 · FU03
      </p>

      {items.length > 0 && (
        <div className="dc-segmented">
          {[
            { key: "all" as const, label: `Todos (${items.length})` },
            { key: "eligible" as const, label: `Prontos (${eligibleItems.length})` },
            { key: "waiting" as const, label: `Aguardando (${waitingItems.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} data-active={tab === t.key}>{t.label}</button>
          ))}
        </div>
      )}

      {isLoading && <p style={{ color: "var(--ink-4)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>Carregando...</p>}

      {isError && <p style={{ color: "var(--danger)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Erro ao carregar follow-ups. Tente recarregar a página.</p>}

      {!isLoading && !isError && items.length === 0 && (
        <div className="dc-card" style={{ textAlign: "center", padding: "56px 16px" }}>
          <p className="badge-pill" style={{ display: "inline-flex", color: "var(--ok)", background: "rgba(15,122,92,0.08)", marginBottom: 10 }}>✓ tudo em dia</p>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum lead aguardando follow-up no momento.</p>
          <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 6 }}>Leads em proposta com reunião realizada aparecerão aqui.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && tab === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {eligibleItems.length > 0 && <><GroupHeader color="var(--ok)" label="Prontos para envio" count={eligibleItems.length} />{renderGrid(eligibleItems)}</>}
          {waitingItems.length > 0 && <><GroupHeader color="var(--warn)" label="Aguardando janela" count={waitingItems.length} />{renderGrid(waitingItems, eligibleItems.length)}</>}
        </div>
      )}

      {!isLoading && items.length > 0 && tab === "eligible" && (
        eligibleItems.length ? renderGrid(eligibleItems) : <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--ink-4)", fontSize: 13 }}>Nenhum lead nesse filtro.</div>
      )}

      {!isLoading && items.length > 0 && tab === "waiting" && (
        waitingItems.length ? renderGrid(waitingItems) : <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--ink-4)", fontSize: 13 }}>Nenhum lead nesse filtro.</div>
      )}
    </div>
  );
}
