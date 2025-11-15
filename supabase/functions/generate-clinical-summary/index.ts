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

    // Upload files to Gemini File API and collect URIs
    const uploadedFiles = [];
    const geminiFileUris = [];
    
    for (const file of files) {
      console.log(`Uploading file to Gemini: ${file.name} (${file.size} bytes)`);
      
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Step 1: Initiate file upload to Gemini
      const uploadInitResponse = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': String(arrayBuffer.byteLength),
            'X-Goog-Upload-Header-Content-Type': file.type,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: {
              display_name: `${patientName}_${file.name}`,
            }
          }),
        }
      );

      if (!uploadInitResponse.ok) {
        const errorText = await uploadInitResponse.text();
        console.error('Failed to initiate upload:', errorText);
        throw new Error(`Failed to initiate upload for ${file.name}`);
      }

      const uploadUrl = uploadInitResponse.headers.get('X-Goog-Upload-URL');
      if (!uploadUrl) {
        throw new Error('No upload URL received from Gemini');
      }

      // Step 2: Upload file content
      const uploadContentResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(arrayBuffer.byteLength),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: arrayBuffer,
      });

      if (!uploadContentResponse.ok) {
        const errorText = await uploadContentResponse.text();
        console.error('Failed to upload content:', errorText);
        throw new Error(`Failed to upload content for ${file.name}`);
      }

      const uploadResult = await uploadContentResponse.json();
      const fileUri = uploadResult.file.name;

      // Step 3: Wait for file to be ACTIVE
      let fileStatus = uploadResult.file.state;
      let attempts = 0;
      const maxAttempts = 30;

      while (fileStatus !== 'ACTIVE' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileUri}?key=${GEMINI_API_KEY}`
        );
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          fileStatus = statusData.state;
          attempts++;
          console.log(`File ${file.name} status: ${fileStatus} (attempt ${attempts})`);
        } else {
          break;
        }
      }

      if (fileStatus !== 'ACTIVE') {
        console.warn(`File ${file.name} did not become ACTIVE in time, status: ${fileStatus}`);
      }

      uploadedFiles.push({
        filename: file.name,
        size: file.size,
        mimetype: file.type,
      });

      geminiFileUris.push(fileUri);
      console.log(`File uploaded successfully: ${fileUri}`);
    }

    // Generate clinical summary with Gemini API using File URIs
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
            ...geminiFileUris.map(uri => ({
              fileData: {
                mimeType: 'application/pdf',
                fileUri: uri
              }
            }))
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
      throw new Error('Failed to generate summary from Gemini API');
    }

    const geminiResponse = await response.json();
    console.log('Gemini raw response:', JSON.stringify(geminiResponse));

    const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No text generated from Gemini API');
    }

    // Parse JSON response (clean markdown if present)
    let cleanedJson = generatedText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedSummary;
    try {
      parsedSummary = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('Failed to parse JSON:', cleanedJson);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Save to database with Gemini file URIs
    const { data: savedSummary, error: dbError } = await supabase
      .from('clinical_summaries')
      .insert({
        patient_name: patientName,
        files: uploadedFiles,
        gemini_file_uris: geminiFileUris,
        resume_clinique: parsedSummary.resume_clinique,
        points_de_vigilance: parsedSummary.points_de_vigilance,
        comparaison_historique: parsedSummary.comparaison_historique,
        red_flags: parsedSummary.red_flags,
        note_medicale_brute: parsedSummary.note_medicale_brute,
        a_expliquer_au_patient: parsedSummary.a_expliquer_au_patient,
        raw_response: geminiResponse,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save summary to database');
    }

    console.log('Summary saved successfully:', savedSummary.id);

    return new Response(
      JSON.stringify({
        success: true,
        summary: savedSummary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating clinical summary:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
