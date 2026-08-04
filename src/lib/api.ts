import type { Appointment, Lead, Conversation, FollowUpRow, Lawyer, ScheduleWeek } from "@/types";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("drx_token") : null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // Sessao expirada: o token dura 24h, mas ficava guardado no navegador depois
  // disso. O layout so checa se EXISTE token, entao o CRM continuava abrindo
  // normalmente e toda acao falhava em silencio com 401 — sem nenhum aviso.
  // (caso real: o Tiago clicou 12x em "Desconectar" sem feedback nenhum).
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("drx_token");
    window.location.href = "/login?expired=1";
    throw new Error("Sessão expirada. Entre novamente.");
  }

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }

  // 204 No Content — sem corpo para parsear
  if (res.status === 204) return undefined as T;

  return res.json();
}

export const api = {
  login: async (username: string, password: string) => {
    const qs = new URLSearchParams({ username, password }).toString();
    const res = await fetch(`${BASE_URL}/auth/login?${qs}`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
  },

  // Leads
  getLeads: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ items: Lead[]; total: number }>(`/api/leads${qs}`);
  },
  getLead: (id: string) => request<Lead>(`/api/leads/${id}`),
  updateLead: (id: string, body: unknown) =>
    request(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  toggleAI: (id: string) =>
    request(`/api/leads/${id}/toggle-ai`, { method: "POST" }),
  deleteLead: (id: string) =>
    request(`/api/leads/${id}`, { method: "DELETE" }),
  approveLead: (id: string) =>
    request<{
      lead_id: string;
      data: string;
      horarios_oferecidos: string[];
      whatsapp_message_sent: boolean;
      message_text: string;
    }>(`/api/leads/${id}/approve`, { method: "POST" }),

  // Appointments
  getAppointments: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ items: Appointment[]; total: number }>(`/api/appointments${qs}`);
  },
  getAvailability: (date: string, duration = 30, lawyerId?: string) => {
    const qs = new URLSearchParams({ date, duration: String(duration), ...(lawyerId ? { lawyer_id: lawyerId } : {}) });
    return request<{ available_slots: string[] }>(`/api/appointments/calendar/availability?${qs}`);
  },

  // Agenda — bloquear / abrir horários
  getScheduleWeek: (start: string) =>
    request<ScheduleWeek>(`/api/schedule/week?start=${start}`),
  blockSlot: (body: { date: string; start_time: string; end_time: string }) =>
    request(`/api/schedule/block`, { method: "POST", body: JSON.stringify(body) }),
  openSlot: (body: { date: string; start_time: string; end_time: string }) =>
    request(`/api/schedule/open`, { method: "POST", body: JSON.stringify(body) }),
  deleteScheduleMarker: (eventId: string) =>
    request(`/api/schedule/marker/${eventId}`, { method: "DELETE" }),
  createAppointment: (body: {
    lead_id: string; scheduled_at: string; duration_minutes?: number;
    appointment_type?: string; channel: "meet" | "whatsapp";
    lawyer_id?: string; client_email?: string; notes?: string;
  }) => request<Appointment & { calendar_event_created: boolean }>("/api/appointments", {
    method: "POST", body: JSON.stringify(body),
  }),
  updateAppointmentStatus: (id: string, status: Appointment["status"]) =>
    request<Appointment>(`/api/appointments/${id}`, {
      method: "PATCH", body: JSON.stringify({ status }),
    }),

  // Advogados / Google Calendar
  getLawyers: () => request<Lawyer[]>("/api/lawyers"),
  startGoogleOAuth: () => request<{ authorization_url: string }>("/api/oauth/google/start"),
  disconnectGoogle: (lawyerId: string) =>
    request(`/api/lawyers/${lawyerId}/disconnect`, { method: "POST" }),

  // Conversations
  getConversations: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<{ items: Conversation[]; total: number }>(`/api/conversations${qs}`);
  },
  replyConversation: (id: string, message: string) =>
    request(`/api/conversations/${id}/reply`, { method: "POST", body: JSON.stringify({ message }) }),

  // Follow-up
  getFollowUps: () => request<{ items: FollowUpRow[]; total: number }>("/api/follow-up"),
  sendFollowUp: (leadId: string) =>
    request(`/api/follow-up/${leadId}/send`, { method: "POST" }),
  markFollowUpResponded: (leadId: string) =>
    request(`/api/follow-up/${leadId}/responded`, { method: "POST" }),

  // Dashboard
  getKPIs: () => request<Record<string, number>>("/api/dashboard/kpis"),
  getFunnel: () => request<{ stages: { stage: string; count: number }[] }>("/api/dashboard/funnel"),
  getAgentMetrics: () => request<Record<string, unknown>>("/api/dashboard/agent-metrics"),
  getAppointmentMetrics: () => request<Record<string, unknown>>("/api/dashboard/appointments"),
};
