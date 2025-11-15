import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse multipart form data
    const formData = await req.formData();
    const patientName = formData.get('patientName') as string;
    const files = formData.getAll('files') as File[];

    if (!patientName || files.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Patient name and at least one file are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${files.length} files for patient: ${patientName}`);

    // Prepare files for Gemini API
    const uploadedFiles = [];
    const fileParts = [];
    
    for (const file of files) {
      console.log(`Preparing file: ${file.name} (${file.size} bytes)`);
      
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      uploadedFiles.push({
        filename: file.name,
        size: file.size,
        mimetype: file.type,
      });

      fileParts.push({
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        }
      });
    }

    // Generate clinical summary with Gemini API
    const prompt = `Tu es un assistant pour médecins généralistes.
Tu analyses des documents patients (comptes rendus, bilans, examens, etc.).

À partir de TOUS les documents fournis, génère STRICTEMENT un JSON valide de la forme :

{
  "resume_clinique": "Résumé global en quelques phrases, factuel",
  "points_de_vigilance": ["point 1", "point 2", "..."],
  "comparaison_historique": "Ce qui a changé par rapport aux examens précédents si possible",
  "red_flags": ["élément potentiellement inquiétant 1", "..."],
  "note_medicale_brute": "Note clinique brute au format SOAP (SUBJECTIF, OBJECTIF, EVALUATION, PLAN)",
  "a_expliquer_au_patient": "Formulation simple à expliquer au patient, en langage accessible"
}

Règles :
- NE PROPOSE PAS de diagnostic explicite.
- NE PROPOSE PAS de traitement ni de prescription.
- Reste factuel, basé sur les documents.
- Si une information n'est pas disponible dans les documents, dis-le clairement.
- Réponds en français.
- Le JSON doit être PARSABLE sans erreur.
- Ne mets PAS le JSON dans un bloc de code markdown, renvoie uniquement le JSON brut.`;

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...fileParts
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const geminiResponse = await response.json();
    const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Gemini raw response:', responseText);

    // Parse JSON response
    let parsedSummary;
    try {
      // Clean potential markdown code blocks
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsedSummary = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse AI response as JSON',
          raw_response: responseText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to Supabase
    const { data: savedSummary, error: dbError } = await supabase
      .from('clinical_summaries')
      .insert({
        patient_name: patientName,
        files: uploadedFiles.map(f => ({
          filename: f.filename,
          size: f.size,
          mimetype: f.mimetype,
        })),
        resume_clinique: parsedSummary.resume_clinique || null,
        points_de_vigilance: parsedSummary.points_de_vigilance || [],
        comparaison_historique: parsedSummary.comparaison_historique || null,
        red_flags: parsedSummary.red_flags || [],
        note_medicale_brute: parsedSummary.note_medicale_brute || null,
        a_expliquer_au_patient: parsedSummary.a_expliquer_au_patient || null,
        raw_response: parsedSummary,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save to database: ${dbError.message}`);
    }

    console.log('Summary saved successfully:', savedSummary.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: savedSummary 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-clinical-summary:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
