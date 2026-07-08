import type { Appointment, Lead, Conversation, FollowUpRow, Lawyer } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

  // Appointments
  getAppointments: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ items: Appointment[]; total: number }>(`/api/appointments${qs}`);
  },
  getAvailability: (date: string, duration = 60, lawyerId?: string) => {
    const qs = new URLSearchParams({ date, duration: String(duration), ...(lawyerId ? { lawyer_id: lawyerId } : {}) });
    return request<{ available_slots: string[] }>(`/api/appointments/calendar/availability?${qs}`);
  },
  createAppointment: (body: {
    lead_id: string; scheduled_at: string; duration_minutes?: number;
    appointment_type?: string; channel: "meet" | "whatsapp";
    lawyer_id?: string; client_email?: string; notes?: string;
  }) => request<Appointment & { calendar_event_created: boolean }>("/api/appointments", {
    method: "POST", body: JSON.stringify(body),
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
