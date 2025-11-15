import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ClinicalSummary } from '@/types/clinical';

export const useClinicalSummary = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);

  const generateSummary = async (patientName: string, files: File[]) => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    
    const startTime = performance.now();

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('patientName', patientName);
      files.forEach(file => {
        formData.append('files', file);
      });

      // Call edge function
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-clinical-summary',
        {
          body: formData,
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      const endTime = performance.now();
      const generationTime = Math.round(endTime - startTime);
      
      // Add generation time to summary
      setSummary({
        ...data.summary,
        generation_time_ms: generationTime,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error generating summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setSummary(null);
  };

  return {
    isLoading,
    error,
    summary,
    generateSummary,
    reset,
  };
};
