import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { summaryId, letterType } = await req.json();

    if (!summaryId || !letterType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Summary ID and letter type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating ${letterType} letter for summary ${summaryId}`);

    // Fetch the clinical summary
    const { data: summary, error: summaryError } = await supabase
      .from('clinical_summaries')
      .select('*')
      .eq('id', summaryId)
      .single();

    if (summaryError || !summary) {
      throw new Error('Summary not found');
    }

    // Define prompts for each letter type
    const prompts: Record<string, string> = {
      'courrier_medecin': `You are a general practitioner writing a letter to a specialist colleague.

Based on the following clinical summary, write a professional and structured medical letter.

CLINICAL SUMMARY:
${summary.resume_clinique || ''}

KEY POINTS:
${(summary.points_de_vigilance || []).join('\n')}

RED FLAGS:
${(summary.red_flags || []).join('\n')}

MEDICAL NOTE:
${summary.note_medicale_brute || ''}

GUIDELINES:
- Classic medical letter format (header, subject, body, closing)
- Professional and concise tone
- Mention relevant clinical elements
- Request for opinion or management according to context
- Maximum 300 words

Generate only the body of the letter (without contact details, without date).`,

      'courrier_patient': `You are a general practitioner writing an explanatory letter for a patient.

Based on the following clinical summary, write an accessible and reassuring letter for the patient.

CLINICAL SUMMARY:
${summary.resume_clinique || ''}

TO EXPLAIN TO THE PATIENT:
${summary.a_expliquer_au_patient || ''}

GUIDELINES:
- Simple and understandable language
- Reassuring but honest tone
- Explain results in accessible terms
- Mention next steps if necessary
- Encourage follow-up and asking questions
- Maximum 250 words

Generate only the body of the letter.`,

      'compte_rendu': `You are a general practitioner writing a consultation report.

Based on the following clinical summary, write a structured report.

CLINICAL SUMMARY:
${summary.resume_clinique || ''}

MEDICAL NOTE:
${summary.note_medicale_brute || ''}

KEY POINTS:
${(summary.points_de_vigilance || []).join('\n')}

GUIDELINES:
- SOAP format (Subjective, Objective, Assessment, Plan)
- Concise and factual
- Mention additional examinations if necessary
- Clear follow-up plan
- Maximum 300 words

Generate only the report.`
    };

    const selectedPrompt = prompts[letterType];
    if (!selectedPrompt) {
      throw new Error('Invalid letter type');
    }

    // Call Gemini API (using stable gemini-1.5-flash model)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: selectedPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            topP: 0.95,
            topK: 40,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Parse error for better error messages
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 429) {
          throw new Error('API quota exceeded. Please try again in a few moments.');
        }
        throw new Error(errorData.error?.message || 'Failed to generate letter');
      } catch (e) {
        if (e instanceof Error && e.message.includes('quota')) {
          throw e;
        }
        throw new Error('Failed to generate letter');
      }
    }

    const data = await response.json();
    const letterContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!letterContent) {
      throw new Error('No content generated');
    }

    // Save to database
    const { data: letter, error: insertError } = await supabase
      .from('medical_letters')
      .insert({
        summary_id: summaryId,
        letter_type: letterType,
        content: letterContent,
        is_edited: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving letter:', insertError);
      throw new Error('Failed to save letter');
    }

    console.log('Letter generated and saved successfully');

    return new Response(
      JSON.stringify({ success: true, letter }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-medical-letter:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
