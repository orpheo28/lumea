export interface Inconsistency {
  type: 'biological' | 'treatment' | 'missing_info' | 'temporal';
  severity: 'low' | 'medium' | 'high';
  description: string;
  details?: string;
}

export interface TimelineEvent {
  event_date: string;
  event_type: string;
  description: string;
  document_source: string;
}

export interface ClinicalSummary {
  id: string;
  created_at: string;
  patient_name: string;
  files: Array<{
    filename: string;
    size: number;
    mimetype: string;
  }>;
  gemini_file_uris?: string[];
  resume_clinique: string | null;
  points_de_vigilance: string[];
  comparaison_historique: string | null;
  red_flags: string[];
  note_medicale_brute: string | null;
  a_expliquer_au_patient: string | null;
  audio_brief_base64: string | null;
  generation_time_ms: number | null;
  inconsistencies?: Inconsistency[];
  timeline_events?: TimelineEvent[];
}

export interface GenerateSummaryRequest {
  patientName: string;
  files: File[];
}

export interface GenerateSummaryResponse {
  success: boolean;
  summary?: ClinicalSummary;
  error?: string;
}
