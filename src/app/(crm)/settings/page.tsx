"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getUsername } from "@/lib/auth";
import type { Lawyer } from "@/types";

function initials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function GoogleResultBanner() {
  const params = useSearchParams();
  const google = params.get("google");
  if (!google) return null;

  const ok = google === "success";
  return (
    <div
      className="drx-fadeup mb-6"
      style={{
        padding: "12px 16px", borderRadius: "var(--r-md)",
        background: ok ? "rgba(15,122,92,0.08)" : "rgba(179,38,30,0.08)",
        border: `1px solid ${ok ? "rgba(15,122,92,0.3)" : "rgba(179,38,30,0.3)"}`,
        color: ok ? "var(--ok)" : "var(--danger)",
        fontSize: 13,
      }}
    >
      {ok ? "✓ Google Calendar conectado com sucesso." : `Não foi possível conectar o Google Calendar (${params.get("reason") ?? "erro desconhecido"}). Tente novamente.`}
    </div>
  );
}

function LawyerCard({ lawyer, isMe }: { lawyer: Lawyer; isMe: boolean }) {
  const qc = useQueryClient();

  const connect = useMutation({
    mutationFn: async () => {
      const { authorization_url } = await api.startGoogleOAuth();
      window.location.href = authorization_url;
    },
  });

  const disconnect = useMutation({
    mutationFn: () => api.disconnectGoogle(lawyer.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lawyers"] }),
  });

  return (
    <div className="drx-fadeup dc-card">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="font-display font-semibold flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--ink)", color: "#FFFFFF", fontSize: 15 }}>
          {initials(lawyer.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{lawyer.name}</p>
            {lawyer.is_default && <span className="dc-count-pill">padrão</span>}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{lawyer.email}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="badge-pill" style={{
            color: lawyer.google_connected ? "var(--ok)" : "var(--ink-4)",
            background: lawyer.google_connected ? "rgba(15,122,92,0.08)" : "var(--bg)",
            border: `1px solid ${lawyer.google_connected ? "rgba(15,122,92,0.25)" : "var(--line)"}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: lawyer.google_connected ? "var(--ok)" : "var(--ink-4)" }} />
            {lawyer.google_connected ? (lawyer.google_account_email ?? "Conectado") : "Não conectado"}
          </span>

          {isMe && (
            lawyer.google_connected ? (
              <button
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
                style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", border: "1px solid rgba(179,38,30,0.3)", background: "rgba(179,38,30,0.06)", borderRadius: "var(--r-md)", padding: "8px 14px", cursor: "pointer" }}
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
                style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", background: "var(--ink)", borderRadius: "var(--r-md)", padding: "8px 16px", cursor: "pointer", border: "none" }}
              >
                {connect.isPending ? "Redirecionando..." : "Conectar Google Calendar"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const username = useState(getUsername)[0];
  const { data: lawyers, isLoading } = useQuery({ queryKey: ["lawyers"], queryFn: api.getLawyers });

  return (
    <div className="space-y-6 animate-fadeIn">
      <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
        Advogados & agenda · conecte o Google Calendar de cada um
      </p>

      <div style={{ maxWidth: 860 }}>
        <Suspense fallback={null}>
          <GoogleResultBanner />
        </Suspense>

        {isLoading && <p className="text-center" style={{ fontSize: 13, color: "var(--ink-4)", padding: "32px 0" }}>Carregando...</p>}

        {!isLoading && !lawyers?.length && (
          <div className="dc-card" style={{ textAlign: "center", padding: "56px 16px" }}>
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nenhum advogado cadastrado ainda.</p>
            <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 6 }}>Cadastre com scripts/seed_lawyer.py no backend.</p>
          </div>
        )}

        <div className="space-y-3">
          {lawyers?.map((lw) => <LawyerCard key={lw.id} lawyer={lw} isMe={lw.username === username} />)}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
