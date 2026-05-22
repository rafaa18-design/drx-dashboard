"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  new:        "Novo",
  contacted:  "Contactado",
  qualified:  "Qualificado",
  proposal:   "Proposta",
  won:        "Fechado",
  follow_up:  "Follow-up",
  lost:       "Perdido",
};

const LEVEL_LABELS: Record<string, string> = {
  hot:          "Quente",
  warm:         "Morno",
  cold:         "Frio",
  disqualified: "Desqualificado",
  auto_meeting: "Reunião automática",
};

const GARBAGE = new Set(["none", "null", "unknown", "undefined", ""]);

const CASE_TYPE_LABELS: Record<string, string> = {
  restricao:    "Restrição",
  banimento:    "Banimento",
  suspensao:    "Suspensão",
  bloqueio:     "Bloqueio",
  aviso:        "Aviso",
  comprometimento: "Comprometimento",
};

function clean(v: string | null | undefined): string {
  if (!v) return "—";
  const t = v.trim();
  if (GARBAGE.has(t.toLowerCase())) return "—";
  return CASE_TYPE_LABELS[t.toLowerCase()] ?? t;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: lead, isLoading } = useQuery({ queryKey: ["lead", id], queryFn: () => api.getLead(id) });

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (!lead) return <p className="text-gray-500">Lead não encontrado.</p>;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Botão voltar */}
      <button
        onClick={() => router.push("/leads")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ink-3)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-3)")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Todos os leads
      </button>

      <h1 className="text-2xl font-bold text-gray-900">{lead.name ?? lead.phone}</h1>

      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Telefone" value={clean(lead.phone)} />
        <InfoCard label="Área do caso" value={clean(lead.case_type)} />
        <InfoCard label="Status" value={STATUS_LABELS[lead.commercial_status] ?? lead.commercial_status} />
        <InfoCard label="Score" value={String(lead.qualification_score ?? 0)} />
        <InfoCard label="Nível" value={lead.qualification_level ? (LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level) : "—"} />
        <InfoCard label="Plataforma" value={clean(lead.platform)} />
      </div>

      {lead.case_description && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-800 mb-2">Descrição do caso</h2>
          <p className="text-sm text-gray-600">{lead.case_description}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Histórico de interações</h2>
        <p className="text-sm text-gray-400">Nenhuma interação registrada.</p>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
