-- Enable RLS on medical_timeline table
ALTER TABLE medical_timeline ENABLE ROW LEVEL SECURITY;

-- Allow all operations for demo (matching clinical_summaries policy)
CREATE POLICY "Allow all operations for demo" 
ON medical_timeline 
FOR ALL 
USING (true) 
WITH CHECK (true);