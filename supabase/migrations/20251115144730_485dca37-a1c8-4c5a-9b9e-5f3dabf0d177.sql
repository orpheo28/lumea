-- Add columns for Phase 1 features
ALTER TABLE clinical_summaries
ADD COLUMN audio_brief_base64 TEXT,
ADD COLUMN generation_time_ms INTEGER;