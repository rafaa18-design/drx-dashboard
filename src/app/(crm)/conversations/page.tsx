"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Conversation } from "@/types";

function initials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatWaiting(dateStr: string): { text: string; urgent: boolean } {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return { text: "agora mesmo", urgent: false };
  if (mins < 60) return { text: `${mins} min esperando`, urgent: mins >= 15 };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `${hrs}h esperando`, urgent: true };
  const days = Math.floor(hrs / 24);
  return { text: `${days}d esperando`, urgent: true };
}

function ConversationCard({ conv }: { conv: Conversation }) {
  const qc = useQueryClient();
  const [replying, setReplying] = useState(false);
  const [message, setMessage] = useState("");

  const reply = useMutation({
    mutationFn: (msg: string) => api.replyConversation(conv.id, msg),
    onSuccess: () => {
      setMessage("");
      setReplying(false);
      qc.invalidateQueries({ queryKey: ["conversations", "human_required"] });
    },
  });

  const name = conv.lead_name ?? conv.lead_phone ?? "Lead sem nome";
  const waiting = formatWaiting(conv.last_message_at);

  return (
    <div className="dc-card">
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div
          className="font-display font-semibold flex items-center justify-center flex-shrink-0"
          style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 14 }}
        >
          {initials(name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
            <Link href={`/leads/${conv.lead_id}`} style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", textDecoration: "none" }}>
              {name}
            </Link>
            {conv.lead_phone && conv.lead_name && (
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{conv.lead_phone}</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {conv.ai_handoff_reason ?? "Solicitação de atendimento humano"}
          </p>
        </div>

        <span className="badge-pill flex-shrink-0" style={{ color: waiting.urgent ? "var(--danger)" : "var(--warn)", background: waiting.urgent ? "rgba(179,38,30,0.08)" : "rgba(180,83,9,0.08)" }}>
          {waiting.text}
        </span>
      </div>

      <div style={{ borderTop: "1px solid var(--line-soft)" }} className="px-4 sm:px-5 py-3">
        {!replying ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setReplying(true)}
              style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", background: "var(--ink)", borderRadius: "var(--r-md)", border: "none", padding: "8px 18px", cursor: "pointer" }}
            >
              Responder
            </button>
            <Link href={`/leads/${conv.lead_id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
              Ver lead →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a resposta para o cliente..."
              rows={2}
              className="filter-input flex-1"
              style={{ resize: "vertical", fontFamily: "DM Sans, sans-serif" }}
            />
            <div className="flex gap-2 sm:flex-col">
              <button
                onClick={() => message.trim() && reply.mutate(message.trim())}
                disabled={!message.trim() || reply.isPending}
                className="flex-1"
                style={{
                  fontSize: 13, fontWeight: 600, borderRadius: "var(--r-md)", border: "none",
                  color: "#FFFFFF", background: message.trim() ? "var(--ok)" : "var(--ink-4)",
                  padding: "0 16px", cursor: message.trim() ? "pointer" : "not-allowed",
                  opacity: reply.isPending ? 0.6 : 1,
                }}
              >
                {reply.isPending ? "Enviando..." : "Enviar"}
              </button>
              <button
                onClick={() => { setReplying(false); setMessage(""); }}
                className="flex-1"
                style={{ fontSize: 13, fontWeight: 500, borderRadius: "var(--r-md)", border: "none", color: "var(--ink-3)", background: "var(--line-soft)", padding: "0 16px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["conversations", "human_required"],
    queryFn: () => api.getConversations("human_required"),
    refetchInterval: 5_000,
  });

  const items = (data?.items ?? []) as Conversation[];
  const urgentCount = items.filter((c) => formatWaiting(c.last_message_at).urgent).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
          Conversas escaladas pela IA · atualiza a cada 5s
        </p>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            <b style={{ color: "var(--ink)" }}>{data?.total ?? 0}</b> na fila
          </span>
          {urgentCount > 0 && (
            <span className="badge-pill" style={{ color: "var(--danger)", background: "rgba(179,38,30,0.08)" }}>
              {urgentCount} esperando 15min+
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((conv) => <ConversationCard key={conv.id} conv={conv} />)}

        {isLoading && (
          <p className="text-center" style={{ fontSize: 13, color: "var(--ink-4)", padding: "32px 0" }}>Carregando...</p>
        )}

        {!isLoading && !items.length && (
          <div className="dc-card" style={{ padding: "56px 16px", textAlign: "center" }}>
            <p className="badge-pill" style={{ display: "inline-flex", color: "var(--ok)", background: "rgba(15,122,92,0.08)", marginBottom: 10 }}>
              ✓ tudo em dia
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhuma conversa aguardando atendimento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
