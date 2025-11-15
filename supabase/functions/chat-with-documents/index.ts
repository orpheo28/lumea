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

    const { summaryId, messages } = await req.json();

    if (!summaryId || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'summaryId and messages are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve Gemini file URIs from the database
    const { data: summary, error: summaryError } = await supabase
      .from('clinical_summaries')
      .select('gemini_file_uris, patient_name')
      .eq('id', summaryId)
      .single();

    if (summaryError || !summary) {
      throw new Error('Summary not found');
    }

    const fileUris = summary.gemini_file_uris || [];

    if (fileUris.length === 0) {
      throw new Error('No files associated with this summary');
    }

    console.log(`Chat for patient: ${summary.patient_name} with ${fileUris.length} files`);

    // Build messages for Gemini
    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Call Gemini with file URIs
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Tu es un assistant médical pour le dossier du patient ${summary.patient_name}.
Tu as accès à tous les documents médicaux uploadés.
Réponds de manière précise, factuelle, et cite les documents si pertinent.
NE PROPOSE PAS de diagnostic ni de traitement.
Reste dans le rôle d'assistant de documentation médical.
Réponds en français.`
          }]
        },
        contents: [
          ...geminiMessages,
          {
            parts: fileUris.map((uri: string) => ({
              fileData: {
                mimeType: 'application/pdf',
                fileUri: uri
              }
            }))
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error('Failed to generate chat response');
    }

    const geminiResponse = await response.json();
    const assistantMessage = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'Désolé, je n\'ai pas pu générer de réponse.';

    console.log('Chat response generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-documents:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
