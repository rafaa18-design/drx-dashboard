"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import type { Appointment } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  initial_consultation: "Primeira reunião",
  follow_up:            "Acompanhamento",
  consultation:         "Consulta",
  review:               "Revisão de caso",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Realizado",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-yellow-100 text-yellow-700",
};

export default function AppointmentsPage() {
  const { data, isLoading } = useQuery<{ items: Appointment[]; total: number }>({
    queryKey: ["appointments"],
    queryFn: () => api.getAppointments(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>

      {isLoading && <p className="text-gray-500">Carregando...</p>}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Data / Hora</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Canal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.items.map((appt) => (
              <tr key={appt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{appt.lead_name ?? "—"}</p>
                  {appt.lead_phone && (
                    <p className="text-xs text-gray-400 mt-0.5">{appt.lead_phone}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  {format(new Date(appt.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </td>
                <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[appt.appointment_type ?? ""] ?? appt.appointment_type ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status] ?? ""}`}>
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {appt.google_meet_link ? (
                    <a
                      href={appt.google_meet_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 600, textDecoration: "none",
                        color: "#1A73E8", background: "rgba(26,115,232,0.08)",
                        padding: "3px 10px", borderRadius: 6,
                        fontFamily: "JetBrains Mono",
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
                      Google Meet
                    </a>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 11, fontWeight: 600,
                      color: "#2D6845", background: "rgba(45,104,69,0.08)",
                      padding: "3px 10px", borderRadius: 6,
                      fontFamily: "JetBrains Mono",
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
                      WhatsApp
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !data?.items.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum agendamento ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
