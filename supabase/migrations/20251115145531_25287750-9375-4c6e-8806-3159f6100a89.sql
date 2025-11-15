-- Create medical_timeline table for chronological events
CREATE TABLE medical_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES clinical_summaries(id) ON DELETE CASCADE,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  document_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_timeline_summary_id ON medical_timeline(summary_id);
CREATE INDEX idx_timeline_event_date ON medical_timeline(event_date DESC);

-- Add inconsistencies column to clinical_summaries
ALTER TABLE clinical_summaries
ADD COLUMN inconsistencies JSONB DEFAULT '[]'::jsonb;