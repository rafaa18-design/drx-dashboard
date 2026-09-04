export type QualificationClass = "A" | "B" | "C" | "D" | "BLOQUEADO";
export type QualificationAction = "meeting" | "qualify" | "nurture" | "close" | "blocked_review";

export interface QualificationEvaluation {
  id: string;
  score_version: string;
  score_raw: number;
  lead_class: QualificationClass;
  next_action: QualificationAction;
  hard_block: boolean;
  review_required: boolean;
  answers: Record<string, unknown>;
  field_points: Record<string, number>;
  dimension_scores: Record<string, number>;
  block_reasons: string[];
  review_flags: string[];
  evaluated_at: string;
}

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  platform: string | null;
  case_type: string | null;
  case_description: string | null;
  qualification_score: number;
  score_raw: number;
  qualification_level: QualificationClass | null;
  lead_class: QualificationClass | null;
  qualification_signals: Record<string, unknown> | null;
  qualification_version: string | null;
  score_version: string | null;
  qualification_dimensions: Record<string, number> | null;
  qualification_answers: Record<string, unknown> | null;
  qualification_next_action: QualificationAction | null;
  next_action: QualificationAction | null;
  qualification_evaluated_at: string | null;
  evaluated_at: string | null;
  hard_block: boolean;
  hard_block_reasons: string[] | null;
  review_required: boolean;
  review_flags: string[] | null;
  followers_count: number | null;
  verified_badge: boolean | null;
  account_type: "personal" | "professional" | "store" | "influencer" | "company" | null;
  monetization_type: string[] | null;
  manual_override: boolean;
  manual_override_reason: string | null;
  manual_override_by: string | null;
  manual_override_at: string | null;
  commercial_status: "new" | "contacted" | "qualified" | "pending_approval" | "proposal" | "won" | "follow_up" | "lost";
  ai_active: boolean;
  source: string;
  assigned_to: string | null;
  follow_up_count: number;
  follow_up_last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRow {
  lead_id: string;
  lead_name: string | null;
  lead_phone: string;
  qualification_score: number;
  qualification_level: string | null;
  commercial_status: string;
  follow_up_count: number;
  follow_up_last_sent_at: string | null;
  next_fu_number: number;
  next_fu_message: string;
  days_since_meeting: number;
  eligible: boolean;
  last_appointment_at: string | null;
}

export interface Conversation {
  id: string;
  lead_id: string;
  lead_name: string | null;
  lead_phone: string | null;
  channel: string;
  status: "active" | "human_required" | "closed" | "scheduled";
  ai_handoff_reason: string | null;
  started_at: string;
  last_message_at: string;
  closed_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender: "client" | "ai" | "human";
  content_type: "text" | "audio" | "image" | "document";
  content: string | null;
  media_url: string | null;
  created_at: string;
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  username: string;
  is_default: boolean;
  google_connected: boolean;
  google_account_email: string | null;
}

export interface Appointment {
  id: string;
  lead_id: string;
  lead_name: string | null;
  lead_phone: string | null;
  lawyer_id: string | null;
  google_event_id: string | null;
  google_meet_link: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  appointment_type: string | null;
  notes: string | null;
  created_at: string;
}

// Agenda (bloquear / abrir horários) — ver app/routes/crm/schedule.py
export type SlotState =
  | "reuniao"          // agendamento do CRM
  | "bloqueado"        // bloqueio manual feito aqui
  | "ocupado"          // compromisso pessoal do advogado (só leitura)
  | "aberto"           // abertura manual fora do expediente
  | "livre"            // dentro do expediente, disponível
  | "fora_expediente"; // fora do expediente ou fim de semana

export interface ScheduleSlot {
  time: string;
  state: SlotState;
  past: boolean;
  label?: string;
  lead_id?: string;
  event_id?: string;
}

export interface ScheduleDay {
  date: string;
  weekday: string;
  is_weekend: boolean;
  is_today: boolean;
  slots: ScheduleSlot[];
}

export interface ScheduleWeek {
  start: string;
  end: string;
  days: ScheduleDay[];
}
