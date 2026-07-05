"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHero } from "@/components/PageHero";
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
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
      <div className="flex items-start gap-4 p-4 sm:p-5">
        {/* Monograma */}
        <div
          className="font-display font-bold flex items-center justify-center flex-shrink-0"
          style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 14 }}
        >
          {initials(name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
            <Link href={`/leads/${conv.lead_id}`} style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
              {name}
            </Link>
            {conv.lead_phone && conv.lead_name && (
              <span className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{conv.lead_phone}</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {conv.ai_handoff_reason ?? "Solicitação de atendimento humano"}
          </p>
        </div>

        {/* Badge de espera */}
        <span
          className="font-mono flex-shrink-0"
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "4px 10px",
            color: waiting.urgent ? "var(--danger)" : "var(--warn)",
            background: waiting.urgent ? "rgba(179,38,30,0.08)" : "rgba(180,83,9,0.08)",
          }}
        >
          {waiting.text}
        </span>
      </div>

      {/* Ações */}
      <div style={{ borderTop: "1px solid var(--line-soft)" }} className="px-4 sm:px-5 py-3">
        {!replying ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReplying(true)}
              className="font-mono"
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#FFFFFF", background: "var(--ink)", padding: "7px 16px", cursor: "pointer",
              }}
            >
              Responder
            </button>
            <Link
              href={`/leads/${conv.lead_id}`}
              className="font-mono"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}
            >
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
                className="font-mono flex-1"
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "#FFFFFF", background: message.trim() ? "var(--ok)" : "var(--ink-4)",
                  padding: "0 16px", cursor: message.trim() ? "pointer" : "not-allowed",
                  opacity: reply.isPending ? 0.6 : 1,
                }}
              >
                {reply.isPending ? "Enviando..." : "Enviar"}
              </button>
              <button
                onClick={() => { setReplying(false); setMessage(""); }}
                className="font-mono flex-1"
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "var(--ink-3)", background: "var(--line-soft)", padding: "0 16px", cursor: "pointer",
                }}
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
    refetchInterval: 5_000, // polling a cada 5 segundos — sem WebSocket
  });

  const items = (data?.items ?? []) as Conversation[];
  const urgentCount = items.filter((c) => formatWaiting(c.last_message_at).urgent).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHero
        label="Fila de atendimento"
        title="Atendimento Humano"
        subtitle="conversas escaladas pela IA · atualiza a cada 5s"
        stats={[
          { value: data?.total ?? "—", label: "Aguardando na fila" },
          { value: isLoading ? "—" : urgentCount, label: "Esperando 15min+" },
        ]}
      />

      <div className="space-y-3">
        {items.map((conv) => (
          <ConversationCard key={conv.id} conv={conv} />
        ))}

        {isLoading && (
          <p className="text-center font-mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.2em", textTransform: "uppercase", padding: "32px 0" }}>
            Carregando...
          </p>
        )}

        {!isLoading && !items.length && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "56px 16px", textAlign: "center" }}>
            <p className="font-mono mb-2" style={{ fontSize: 10, color: "var(--ok)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              ✓ tudo em dia
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhuma conversa aguardando atendimento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
