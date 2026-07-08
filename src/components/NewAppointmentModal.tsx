"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewAppointmentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [leadId, setLeadId] = useState("");
  const [lawyerId, setLawyerId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState("");
  const [channel, setChannel] = useState<"meet" | "whatsapp">("meet");
  const [clientEmail, setClientEmail] = useState("");
  const [error, setError] = useState("");

  const { data: leadsData } = useQuery({
    queryKey: ["modal-leads", search],
    queryFn: () => api.getLeads(search ? { search } : undefined),
  });
  const leads = (leadsData?.items ?? []) as Lead[];
  const selectedLead = leads.find((l) => l.id === leadId);

  const { data: lawyers } = useQuery({ queryKey: ["lawyers"], queryFn: api.getLawyers });

  const { data: availability, isFetching: loadingSlots } = useQuery({
    queryKey: ["availability", date, lawyerId],
    queryFn: () => api.getAvailability(date, 60, lawyerId || undefined),
    enabled: !!date,
  });
  const slots = availability?.available_slots ?? [];

  const create = useMutation({
    mutationFn: () => api.createAppointment({
      lead_id: leadId,
      scheduled_at: `${date}T${slot}:00`,
      channel,
      lawyer_id: lawyerId || undefined,
      client_email: channel === "meet" ? clientEmail : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Erro ao criar agendamento."),
  });

  const canSubmit = useMemo(() => {
    if (!leadId || !slot) return false;
    if (channel === "meet" && !clientEmail.trim()) return false;
    return true;
  }, [leadId, slot, channel, clientEmail]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,27,43,0.55)" }} onClick={onClose} />
      <div
        className="animate-fadeIn"
        style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <h2 className="font-display font-bold" style={{ fontSize: 17, color: "var(--ink)" }}>Nova reunião</h2>
          <button onClick={onClose} style={{ color: "var(--ink-4)", cursor: "pointer", background: "none", border: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Lead */}
          <div>
            <label className="font-mono block mb-1.5" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-4)" }}>Lead</label>
            {selectedLead ? (
              <div className="flex items-center justify-between" style={{ padding: "9px 12px", border: "1px solid var(--line)", background: "var(--bg)" }}>
                <span style={{ fontSize: 13, color: "var(--ink)" }}>{selectedLead.name ?? selectedLead.phone}</span>
                <button onClick={() => setLeadId("")} className="font-mono" style={{ fontSize: 10, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>trocar</button>
              </div>
            ) : (
              <>
                <input
                  className="filter-input w-full"
                  placeholder="Buscar lead por nome ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && leads.length > 0 && (
                  <div style={{ border: "1px solid var(--line)", borderTop: "none", maxHeight: 160, overflowY: "auto" }}>
                    {leads.slice(0, 6).map((l) => (
                      <button
                        key={l.id}
                        onClick={() => { setLeadId(l.id); setSearch(""); }}
                        className="row-hover w-full text-left"
                        style={{ padding: "8px 12px", fontSize: 13, color: "var(--ink)", background: "var(--surface)", border: "none", cursor: "pointer", display: "block" }}
                      >
                        {l.name ?? l.phone} <span className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>· {l.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Advogado (só mostra se houver mais de um) */}
          {lawyers && lawyers.length > 1 && (
            <div>
              <label className="font-mono block mb-1.5" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-4)" }}>Advogado</label>
              <select className="filter-select w-full" value={lawyerId} onChange={(e) => setLawyerId(e.target.value)}>
                <option value="">Padrão</option>
                {lawyers.map((lw) => <option key={lw.id} value={lw.id}>{lw.name}</option>)}
              </select>
            </div>
          )}

          {/* Data + horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono block mb-1.5" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-4)" }}>Data</label>
              <input type="date" className="filter-input w-full" value={date} onChange={(e) => { setDate(e.target.value); setSlot(""); }} />
            </div>
            <div>
              <label className="font-mono block mb-1.5" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-4)" }}>Horário</label>
              <select className="filter-select w-full" value={slot} onChange={(e) => setSlot(e.target.value)} disabled={loadingSlots || !slots.length}>
                <option value="">{loadingSlots ? "Carregando..." : slots.length ? "Escolha" : "Sem horários"}</option>
                {slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Canal */}
          <div>
            <label className="font-mono block mb-1.5" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-4)" }}>Canal</label>
            <div className="flex gap-2">
              {([["meet", "Google Meet"], ["whatsapp", "WhatsApp"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setChannel(val)}
                  className="font-mono flex-1"
                  style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "9px 0", cursor: "pointer",
                    color: channel === val ? "#FFFFFF" : "var(--ink-3)",
                    background: channel === val ? "var(--ink)" : "var(--surface)",
                    border: `1px solid ${channel === val ? "var(--ink)" : "var(--line)"}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* E-mail do cliente — só para Meet */}
          {channel === "meet" && (
            <div>
              <label className="font-mono block mb-1.5" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-4)" }}>
                E-mail do cliente <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="email"
                className="filter-input w-full"
                placeholder="cliente@exemplo.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <p style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4 }}>
                O Google manda o convite com o link do Meet direto para esse e-mail.
              </p>
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}

          <button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
            className="font-mono w-full"
            style={{
              padding: "12px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#FFFFFF", background: canSubmit ? "var(--ink)" : "var(--line)",
              border: "none", cursor: canSubmit && !create.isPending ? "pointer" : "not-allowed",
              opacity: create.isPending ? 0.6 : 1,
            }}
          >
            {create.isPending ? "Criando..." : "Criar agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
