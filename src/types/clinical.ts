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
