import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert ArrayBuffer to base64 safely (handles large files)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack overflow
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
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
      const base64Data = arrayBufferToBase64(arrayBuffer);
      
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
      const fileUri = uploadResult.file.uri; // Use .uri for generateContent
      const fileName = uploadResult.file.name; // Use .name for API calls

      // Step 3: Wait for file to be ACTIVE
      let fileStatus = uploadResult.file.state;
      let attempts = 0;
      const maxAttempts = 30;

      while (fileStatus !== 'ACTIVE' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`
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
    const prompt = `You are an assistant for general practitioners.
You analyze patient documents (reports, assessments, examinations, medical imaging, etc.).

**MEDICAL IMAGING ANALYSIS**:
If imaging files are provided (X-rays, MRI, CT scans, ultrasounds...):
1. Objectively describe visible anatomical structures
2. Note any visible abnormalities (masses, opacities, fractures, lesions...)
3. DO NOT DIAGNOSE - remain factual and descriptive
4. Recommend radiologist interpretation if relevant
5. **CRITICAL**: Include imaging observations WITHIN the JSON structure in the appropriate fields (resume_clinique, note_medicale_brute, points_de_vigilance)
6. DO NOT output imaging analysis as separate text before the JSON

From ALL provided documents, generate STRICTLY a valid JSON in this format:

{
  "resume_clinique": "Global summary in a few sentences, factual (includes imaging observations if present)",
  "points_de_vigilance": ["point 1", "point 2", "..."],
  "comparaison_historique": "What has changed compared to previous examinations if possible",
  "red_flags": ["potentially concerning element 1", "..."],
  "note_medicale_brute": "Raw clinical note in SOAP format (SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN)",
  "a_expliquer_au_patient": "Simple formulation to explain to the patient, in accessible language",
  "timeline_events": [
    {
      "event_date": "2024-03-15T10:30:00Z",
      "event_type": "examination | consultation | hospitalization | treatment | diagnosis | imaging",
      "description": "Event description",
      "document_source": "filename.pdf"
    }
  ],
  "inconsistencies": [
    {
      "type": "biological | treatment | missing_info | temporal",
      "severity": "low | medium | high",
      "description": "Short description (1 sentence)",
      "details": "Detailed explanation with relevant values/dates"
    }
  ]
}

TIMELINE EXTRACTION:
For each document, identify all medical events with their date:
- Examination dates (biology, imaging, ECG, etc.)
- Consultation dates
- Hospitalization dates
- Treatment change dates
- Diagnosis dates

Sort events in descending chronological order (most recent first).

CRITICAL INCONSISTENCY DETECTION:
Analyze documents to detect:

1. **Biological inconsistencies**:
   - Contradictory values between examinations
   - Abnormal evolution without explanation
   - Physiologically impossible results

2. **Treatment inconsistencies**:
   - Contraindicated medications together
   - Dosages inconsistent with renal/hepatic function
   - Abrupt discontinuation of chronic treatment without mention

3. **Critical missing information**:
   - Announced result but absent from documents
   - Missing follow-up after detected abnormality
   - Recommended additional examinations not performed

4. **Temporal inconsistencies**:
   - Inconsistent dates
   - Impossible chronology

Only add REAL and VERIFIABLE inconsistencies.
Avoid false positives - better to report nothing than to report incorrectly.

Rules:
- DO NOT propose explicit diagnosis.
- DO NOT propose treatment or prescription.
- Remain factual, based on documents.
- If information is not available in documents, state it clearly.
- Respond in English.
- JSON must be PARSABLE without error.
- Do NOT put JSON in a markdown code block, return only raw JSON.
- **CRITICAL**: Do NOT add any text, explanation, or commentary before or after the JSON object.
- **CRITICAL**: The first character of your response MUST be '{' and the last character MUST be '}'.
- Include all imaging observations inside the JSON fields (resume_clinique, note_medicale_brute, etc.).`;

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          ...geminiFileUris.map(uri => ({
            file_data: {
              mime_type: 'application/pdf',
              file_uri: uri
            }
          }))
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            resume_clinique: { type: "string" },
            points_de_vigilance: { 
              type: "array",
              items: { type: "string" }
            },
            comparaison_historique: { type: "string" },
            red_flags: {
              type: "array",
              items: { type: "string" }
            },
            note_medicale_brute: { type: "string" },
            a_expliquer_au_patient: { type: "string" },
            timeline_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event_date: { type: "string" },
                  event_type: { type: "string" },
                  description: { type: "string" },
                  document_source: { type: "string" }
                },
                required: ["event_date", "event_type", "description", "document_source"]
              }
            },
            inconsistencies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" },
                  details: { type: "string" }
                },
                required: ["type", "severity", "description", "details"]
              }
            }
          },
          required: ["resume_clinique", "points_de_vigilance", "comparaison_historique", "red_flags", "note_medicale_brute", "a_expliquer_au_patient", "timeline_events", "inconsistencies"]
        }
      }
    };

    console.log('Request body for Gemini:', JSON.stringify(requestBody, null, 2));

    // Retry logic for 503 errors (API overload)
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds
    let response;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          break; // Success, exit retry loop
        }

        const errorText = await response.text();
        console.error(`Gemini API error (attempt ${attempt + 1}/${maxRetries}):`, response.status, errorText);

        // If it's a 503 (service unavailable), retry with exponential backoff
        if (response.status === 503 && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff: 2s, 4s, 8s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          lastError = errorText;
          continue;
        }

        // For other errors or last attempt, throw
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        lastError = error;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to generate summary after ${maxRetries} attempts. Gemini API may be overloaded. Please try again later.`);
    }

    const geminiResponse = await response.json();
    console.log('Gemini raw response:', JSON.stringify(geminiResponse));

    const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log('=== GEMINI RESPONSE DEBUG ===');
    console.log('Response status:', geminiResponse.candidates?.[0]?.finishReason);
    console.log('Text length:', generatedText?.length);
    console.log('First 200 chars:', generatedText?.substring(0, 200));
    console.log('Last 200 chars:', generatedText?.substring(generatedText.length - 200));
    
    if (!generatedText) {
      throw new Error('No text generated from Gemini API');
    }

    // Parse JSON response - extract JSON from response even if surrounded by text
    let cleanedJson = generatedText.trim();

    // Step 1: Remove markdown code blocks
    if (cleanedJson.includes('```json')) {
      const jsonMatch = cleanedJson.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanedJson = jsonMatch[1].trim();
      }
    } else if (cleanedJson.includes('```')) {
      const codeMatch = cleanedJson.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        cleanedJson = codeMatch[1].trim();
      }
    }

    // Step 2: Extract JSON object if there's text before/after it
    // Find the first '{' and last '}' to extract the JSON object
    const firstBrace = cleanedJson.indexOf('{');
    const lastBrace = cleanedJson.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
    } else {
      console.error('No valid JSON object found in response');
      throw new Error('No valid JSON object found in AI response');
    }

    let parsedSummary;
    try {
      parsedSummary = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('Failed to parse JSON:', cleanedJson.substring(0, 500)); // Log first 500 chars only
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Generate audio brief with ElevenLabs
    let audioBriefBase64 = null;
    try {
      // Create enhanced audio script with structured medical content
      const audioScript = `Clinical brief for patient ${patientName}. ${parsedSummary.resume_clinique?.split('.').slice(0, 3).join('. ')}.${parsedSummary.red_flags && parsedSummary.red_flags.length > 0 ? ` Important alerts: ${parsedSummary.red_flags.slice(0, 2).join('. ')}.` : ' No critical alerts identified.'}${parsedSummary.points_de_vigilance && parsedSummary.points_de_vigilance.length > 0 ? ` Key points to monitor: ${parsedSummary.points_de_vigilance[0]}.` : ''}`;
      
      console.log('🎙️ Generating audio brief:', audioScript.length, 'characters');
      
      const audioResponse = await fetch(
        'https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL', // Sarah voice
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: audioScript,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            }
          })
        }
      );

      if (audioResponse.ok) {
        const audioArrayBuffer = await audioResponse.arrayBuffer();
        audioBriefBase64 = arrayBufferToBase64(audioArrayBuffer);
        console.log('✅ Audio brief generated successfully:', audioScript.length, 'characters');
      } else {
        const errorStatus = audioResponse.status;
        const errorText = await audioResponse.text();
        console.error('❌ ElevenLabs API error:', errorStatus, errorText);
        console.error('Script that failed:', audioScript);
      }
    } catch (audioError) {
      console.error('⚠️ Failed to generate audio brief:', audioError);
      console.log('⚠️ Continuing without audio - summary will be saved without voice brief');
      // Don't fail the whole request if audio generation fails
    }

    // Save to database with Gemini file URIs, audio, and inconsistencies
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
        audio_brief_base64: audioBriefBase64,
        inconsistencies: parsedSummary.inconsistencies || [],
        raw_response: geminiResponse,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save summary to database');
    }

    console.log('Summary saved successfully:', savedSummary.id);

    // Insert timeline events if present
    if (parsedSummary.timeline_events && parsedSummary.timeline_events.length > 0) {
      const timelineInserts = parsedSummary.timeline_events.map((event: any) => ({
        summary_id: savedSummary.id,
        event_date: event.event_date,
        event_type: event.event_type,
        description: event.description,
        document_source: event.document_source || 'unknown'
      }));

      const { error: timelineError } = await supabase
        .from('medical_timeline')
        .insert(timelineInserts);

      if (timelineError) {
        console.error('Error inserting timeline events:', timelineError);
      } else {
        console.log(`Inserted ${timelineInserts.length} timeline events`);
      }
    }

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
