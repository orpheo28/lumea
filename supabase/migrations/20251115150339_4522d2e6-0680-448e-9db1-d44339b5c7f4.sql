-- Create medical_letters table for letter generation feature
CREATE TABLE medical_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES clinical_summaries(id) ON DELETE CASCADE,
  letter_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN DEFAULT false
);

CREATE INDEX idx_letters_summary_id ON medical_letters(summary_id);
CREATE INDEX idx_letters_type ON medical_letters(letter_type);

-- Enable RLS
ALTER TABLE medical_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for demo"
  ON medical_letters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add suggested_exams column to clinical_summaries for HAS recommendations
ALTER TABLE clinical_summaries
ADD COLUMN suggested_exams JSONB DEFAULT '[]'::jsonb;

-- Add performance indexes for multi-patient view
CREATE INDEX idx_summaries_created_at ON clinical_summaries(created_at DESC);
CREATE INDEX idx_summaries_patient_name ON clinical_summaries(patient_name);