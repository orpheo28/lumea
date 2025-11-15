-- Create clinical_summaries table for storing AI-generated medical briefs
CREATE TABLE clinical_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  patient_name TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  resume_clinique TEXT,
  points_de_vigilance JSONB NOT NULL DEFAULT '[]'::jsonb,
  comparaison_historique TEXT,
  red_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  note_medicale_brute TEXT,
  a_expliquer_au_patient TEXT,
  raw_response JSONB
);

-- Enable Row Level Security
ALTER TABLE clinical_summaries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for demo (hackathon V1 - no auth)
CREATE POLICY "Allow all operations for demo" ON clinical_summaries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on created_at for faster queries
CREATE INDEX idx_clinical_summaries_created_at ON clinical_summaries(created_at DESC);