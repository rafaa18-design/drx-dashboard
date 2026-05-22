import type { Appointment, Lead, Conversation } from "@/types";

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
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ access_token: string; token_type: string }>;
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
  getAvailability: (date: string, duration = 60) =>
    request<{ available_slots: string[] }>(`/api/appointments/calendar/availability?date=${date}&duration=${duration}`),

  // Conversations
  getConversations: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<{ items: Conversation[]; total: number }>(`/api/conversations${qs}`);
  },
  replyConversation: (id: string, message: string) =>
    request(`/api/conversations/${id}/reply`, { method: "POST", body: JSON.stringify({ message }) }),

  // Dashboard
  getKPIs: () => request<Record<string, number>>("/api/dashboard/kpis"),
  getFunnel: () => request<{ stages: { stage: string; count: number }[] }>("/api/dashboard/funnel"),
  getAgentMetrics: () => request<Record<string, unknown>>("/api/dashboard/agent-metrics"),
  getAppointmentMetrics: () => request<Record<string, unknown>>("/api/dashboard/appointments"),
};
