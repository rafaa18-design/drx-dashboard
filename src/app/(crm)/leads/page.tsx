"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import type { Lead } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  new:        "Novo",
  contacted:  "Contactado",
  qualified:  "Qualificado",
  proposal:   "Proposta",
  won:        "Fechado",
  follow_up:  "Follow-up",
  lost:       "Perdido",
};

const GARBAGE = new Set(["none", "null", "unknown", "undefined", ""]);

function clean(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return GARBAGE.has(t.toLowerCase()) ? null : t;
}

function leadDisplay(lead: Lead): { primary: string; secondary: string | null } {
  const name  = clean(lead.name);
  const phone = clean(lead.phone);
  if (name)  return { primary: name,  secondary: phone };
  if (phone) return { primary: phone, secondary: null };
  return { primary: "—", secondary: null };
}

const LEVEL_LABELS: Record<string, string> = {
  hot:          "Quente",
  warm:         "Morno",
  cold:         "Frio",
  disqualified: "Desqualificado",
};

const LEVEL_COLORS: Record<string, string> = {
  hot:          "bg-red-100 text-red-700",
  warm:         "bg-orange-100 text-orange-700",
  cold:         "bg-blue-100 text-blue-700",
  disqualified: "bg-gray-100 text-gray-500",
};

export default function LeadsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["leads"], queryFn: () => api.getLeads() });

  const deleteLead = useMutation({
    mutationFn: (id: string) => api.deleteLead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData(["leads"]);
      qc.setQueryData(["leads"], (old: { items: Lead[]; total: number } | undefined) =>
        old ? { ...old, items: old.items.filter((l) => l.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  function handleDelete(lead: Lead) {
    const name = lead.name || lead.phone || "este lead";
    if (!confirm(`Apagar ${name}? Esta ação não pode ser desfeita.`)) return;
    deleteLead.mutate(lead.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leads</h1>
      </div>

      {isLoading && <p className="text-gray-500">Carregando...</p>}

      {/* ── Desktop: tabela ── */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nome / Telefone</th>
              <th className="px-4 py-3 text-left">Área</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Nível</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.items.map((lead: Lead) => {
              const { primary, secondary } = leadDisplay(lead);
              return (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-brand-700 hover:underline">
                      {primary}
                    </Link>
                    {secondary && (
                      <div className="text-xs text-gray-400">{secondary}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lead.case_type ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{lead.qualification_score}</td>
                  <td className="px-4 py-3">
                    {lead.qualification_level && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[lead.qualification_level] ?? ""}`}>
                        {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{STATUS_LABELS[lead.commercial_status] ?? lead.commercial_status}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(lead)}
                      disabled={deleteLead.isPending}
                      title="Apagar lead"
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && !data?.items.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum lead ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="md:hidden space-y-3">
        {data?.items.map((lead: Lead) => {
          const { primary, secondary } = leadDisplay(lead);
          return (
            <div key={lead.id} className="bg-white rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/leads/${lead.id}`} className="font-medium text-brand-700 hover:underline text-sm">
                    {primary}
                  </Link>
                  {secondary && <p className="text-xs text-gray-400 mt-0.5">{secondary}</p>}
                </div>
                <button
                  onClick={() => handleDelete(lead)}
                  disabled={deleteLead.isPending}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 p-1"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {lead.qualification_level && (
                  <span className={`px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[lead.qualification_level] ?? ""}`}>
                    {LEVEL_LABELS[lead.qualification_level] ?? lead.qualification_level}
                  </span>
                )}
                <span className="text-gray-500">Score: {lead.qualification_score}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{STATUS_LABELS[lead.commercial_status] ?? lead.commercial_status}</span>
                {lead.case_type && lead.case_type !== "—" && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{lead.case_type}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {!isLoading && !data?.items.length && (
          <p className="text-center text-gray-400 py-8">Nenhum lead ainda.</p>
        )}
      </div>
    </div>
  );
}
