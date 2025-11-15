-- Add column for storing Gemini file URIs for File Search Store
ALTER TABLE clinical_summaries
ADD COLUMN gemini_file_uris JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN clinical_summaries.gemini_file_uris IS 'Array of Gemini file URIs (file.name) for File Search Store - used for RAG chat functionality';