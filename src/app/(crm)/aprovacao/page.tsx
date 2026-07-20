"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPhone } from "@/lib/phone";
import { useNow } from "@/hooks/useNow";
import type { Lead } from "@/types";

const LEVEL_LABELS: Record<string, string> = {
  auto_meeting: "Auto",
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

function scoreColor(level: string | null): string {
  switch (level) {
    case "hot":  return "var(--danger)";
    case "warm": return "var(--warn)";
    case "cold": return "var(--ink-3)";
    default:     return "var(--ink-4)";
  }
}

function ApprovalCard({ lead }: { lead: Lead }) {
  const qc = useQueryClient();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const approve = useMutation({
    mutationFn: () => api.approveLead(lead.id),
    onSuccess: (data) => {
      const whatsapp = data.whatsapp_message_sent
        ? "Mensagem de confirmação enviada pro WhatsApp do lead."
        : "Reunião marcada, mas a mensagem automática pro WhatsApp não pôde ser enviada agora (verifique a credencial da uazapi) — avise o cliente manualmente.";
      setResult({ ok: true, text: `Reunião marcada para ${data.formatted_datetime}. ${whatsapp}` });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: Error) => {
      let detail = err.message;
      try {
        detail = JSON.parse(err.message).detail ?? err.message;
      } catch {
        /* mensagem já é texto puro */
      }
      setResult({ ok: false, text: detail });
    },
  });

  const reject = useMutation({
    mutationFn: () => api.deleteLead(lead.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  function handleReject() {
    if (!confirm(`Reprovar e excluir ${displayName}? Essa ação não pode ser desfeita.`)) return;
    reject.mutate();
  }

  const name = clean(lead.name);
  const displayName = name ?? formatPhone(lead.phone);
  const caseType = clean(lead.case_type);
  const caseDescription = clean(lead.case_description);
  const sc = scoreColor(lead.qualification_level);

  return (
    <div className="drx-fadeup dc-card p-5 sm:p-6" style={{ borderLeft: `3px solid ${sc}`, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="font-display font-semibold flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 15 }}
          >
            {initials(displayName)}
          </div>
          <div className="min-w-0">
            <Link href={`/leads/${lead.id}`} style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", textDecoration: "none" }}>
              {displayName}
            </Link>
            <div className="flex items-center gap-2.5 flex-wrap" style={{ marginTop: 2 }}>
              {name && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{formatPhone(lead.phone)}</span>}
              <span className="font-display font-semibold" style={{ fontSize: 13, color: sc }}>
                score {lead.qualification_score}
              </span>
              {lead.qualification_level && (
                <span className={`badge-pill ${LEVEL_BADGE[lead.qualification_level] ?? ""}`}>
                  {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level}
                </span>
              )}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-4)", flexShrink: 0 }}>{formatAgo(lead.updated_at)}</span>
      </div>

      {(caseType || caseDescription) && (
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
          {caseType && <span style={{ fontWeight: 600 }}>{CASE_LABELS[caseType] ?? caseType}. </span>}
          {caseDescription}
        </div>
      )}

      {result && (
        <div
          style={{
            fontSize: 13, lineHeight: 1.5, padding: "10px 12px", borderRadius: "var(--r-md)",
            color: result.ok ? "var(--ok)" : "var(--danger)",
            background: result.ok ? "rgba(15,122,92,0.08)" : "rgba(179,38,30,0.08)",
          }}
        >
          {result.text}
        </div>
      )}

      {!(result?.ok) && (
        <div className="flex justify-end gap-2">
          <button
            onClick={handleReject}
            disabled={reject.isPending || approve.isPending}
            style={{
              fontSize: 13, fontWeight: 600, color: "var(--danger)", background: "transparent",
              border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "9px 18px",
              cursor: reject.isPending ? "wait" : "pointer", opacity: reject.isPending ? 0.6 : 1,
            }}
          >
            {reject.isPending ? "Reprovando..." : "Reprovar"}
          </button>
          <button
            onClick={() => approve.mutate()}
            disabled={approve.isPending || reject.isPending}
            style={{
              fontSize: 13, fontWeight: 600, color: "#FFFFFF", background: "var(--ink)",
              border: "none", borderRadius: "var(--r-md)", padding: "9px 18px",
              cursor: approve.isPending ? "wait" : "pointer", opacity: approve.isPending ? 0.6 : 1,
            }}
          >
            {approve.isPending ? "Aprovando..." : "Aprovar e marcar reunião"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ManualApprovalPage() {
  useNow(); // re-renderiza periodicamente pra "ha Xh/Xd" nao ficar parado no tempo

  const { data, isLoading } = useQuery({
    queryKey: ["leads", { status: "pending_approval" }],
    queryFn: () => api.getLeads({ status: "pending_approval" }) as Promise<{ items: Lead[]; total: number }>,
    refetchInterval: 30_000,
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
        Leads com score baixo (frio ou desqualificado) que o Tiago avaliou não terem qualificação
        suficiente pra reunião automática — o agente encerrou a conversa dizendo que ia analisar o
        caso. Aprovar aqui marca uma reunião automaticamente e já confirma com o cliente pelo WhatsApp.
      </p>

      <div className="flex items-center gap-2">
        <span className="font-display font-semibold" style={{ fontSize: 16, color: "var(--ink)" }}>Aprovação Manual</span>
        <span className="dc-count-pill">{data?.total ?? 0}</span>
      </div>

      {isLoading && (
        <div className="text-center" style={{ padding: "48px 0" }}>
          <span style={{ fontSize: 13, color: "var(--ink-4)" }}>Carregando...</span>
        </div>
      )}

      {!isLoading && !items.length && (
        <div className="dc-card text-center" style={{ padding: "56px 16px" }}>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum lead aguardando aprovação no momento.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((lead) => <ApprovalCard key={lead.id} lead={lead} />)}
      </div>
    </div>
  );
}
