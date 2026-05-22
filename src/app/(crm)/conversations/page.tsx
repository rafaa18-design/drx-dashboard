"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Conversation } from "@/types";

export default function ConversationsPage() {
  const { data } = useQuery({
    queryKey: ["conversations", "human_required"],
    queryFn: () => api.getConversations("human_required"),
    refetchInterval: 5_000, // polling a cada 5 segundos — sem WebSocket
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fila de Atendimento Humano</h1>

      <div className="space-y-3">
        {data?.items.map((conv: Conversation) => (
          <div key={conv.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Conversa {conv.id.slice(0, 8)}...</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {conv.ai_handoff_reason ?? "Solicitação de atendimento humano"}
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              Aguardando
            </span>
          </div>
        ))}
        {!data?.items.length && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
            Nenhuma conversa aguardando atendimento.
          </div>
        )}
      </div>
    </div>
  );
}
