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
      'courrier_medecin': `Tu es un médecin généraliste qui rédige un courrier pour un confrère spécialiste.

À partir du résumé clinique suivant, rédige un courrier médical professionnel et structuré.

RÉSUMÉ CLINIQUE :
${summary.resume_clinique || ''}

POINTS DE VIGILANCE :
${(summary.points_de_vigilance || []).join('\n')}

RED FLAGS :
${(summary.red_flags || []).join('\n')}

NOTE MÉDICALE :
${summary.note_medicale_brute || ''}

CONSIGNES :
- Format classique de courrier médical (en-tête, objet, développement, formule de politesse)
- Ton professionnel et concis
- Mention des éléments cliniques pertinents
- Demande d'avis ou de prise en charge selon le contexte
- Maximum 400 mots

Génère uniquement le corps du courrier (sans les coordonnées, sans la date).`,

      'courrier_patient': `Tu es un médecin généraliste qui rédige un courrier explicatif pour un patient.

À partir du résumé clinique suivant, rédige un courrier accessible et rassurant pour le patient.

RÉSUMÉ CLINIQUE :
${summary.resume_clinique || ''}

À EXPLIQUER AU PATIENT :
${summary.a_expliquer_au_patient || ''}

CONSIGNES :
- Langage simple et compréhensible
- Ton rassurant mais honnête
- Explication des résultats en termes accessibles
- Mention des prochaines étapes si nécessaire
- Encouragement au suivi et à poser des questions
- Maximum 300 mots

Génère uniquement le corps du courrier.`,

      'compte_rendu': `Tu es un médecin généraliste qui rédige un compte-rendu de consultation.

À partir du résumé clinique suivant, rédige un compte-rendu structuré.

RÉSUMÉ CLINIQUE :
${summary.resume_clinique || ''}

NOTE MÉDICALE :
${summary.note_medicale_brute || ''}

POINTS DE VIGILANCE :
${(summary.points_de_vigilance || []).join('\n')}

CONSIGNES :
- Format SOAP (Subjectif, Objectif, Évaluation, Plan)
- Concis et factuel
- Mention des examens complémentaires si nécessaire
- Plan de suivi clair
- Maximum 400 mots

Génère uniquement le compte-rendu.`
    };

    const selectedPrompt = prompts[letterType];
    if (!selectedPrompt) {
      throw new Error('Invalid letter type');
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: selectedPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to generate letter');
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
