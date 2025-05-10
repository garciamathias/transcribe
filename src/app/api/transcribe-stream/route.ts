import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { segmentAudioFile, cleanTranscription } from '@/utils/audioProcessing';

// Configuration de l'API
export const config = {
  runtime: 'edge',
};

export async function POST(req: NextRequest) {
  // Ajouter des en-têtes CORS et de streaming
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Création d'un ReadableStream pour envoyer les données en streaming
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('Starting streaming transcription...');
        
        // Extraire les données de la requête
        let formData;
        try {
          formData = await req.formData();
          console.log('FormData parsed successfully');
        } catch (e) {
          console.error('Error parsing formData:', e);
          controller.enqueue(`data: ${JSON.stringify({ error: 'Error parsing form data' })}\n\n`);
          controller.close();
          return;
        }
        
        const file = formData.get('file') as File;
        const clientApiKey = formData.get('apiKey') as string;
        
        if (!file) {
          console.error('No file in request');
          controller.enqueue(`data: ${JSON.stringify({ error: 'No file uploaded' })}\n\n`);
          controller.close();
          return;
        }

        console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Vérifier si le fichier est audio
        if (!file.type.startsWith('audio/')) {
          controller.enqueue(`data: ${JSON.stringify({ error: 'Uploaded file is not an audio file' })}\n\n`);
          controller.close();
          return;
        }

        // Obtenir la clé API
        const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          console.error('No API key configured');
          controller.enqueue(`data: ${JSON.stringify({ error: 'OpenAI API key is not configured' })}\n\n`);
          controller.close();
          return;
        }

        // Initialiser OpenAI
        const openai = new OpenAI({ apiKey });
        
        // Segmenter le fichier audio
        controller.enqueue(`data: ${JSON.stringify({ status: 'processing', message: 'Segmenting audio...' })}\n\n`);
        const segments = await segmentAudioFile(file);
        console.log(`File segmented into ${segments.length} parts`);
        
        // Informer le client du nombre de segments
        controller.enqueue(`data: ${JSON.stringify({ 
          status: 'segmented', 
          totalSegments: segments.length,
          message: `Fichier divisé en ${segments.length} segment(s) pour traitement`
        })}\n\n`);
        
        // Traiter chaque segment et envoyer les résultats au fur et à mesure
        let currentSegment = 1;
        let fullTranscription = '';
        
        for (const segment of segments) {
          try {
            // Informer le client du segment en cours
            controller.enqueue(`data: ${JSON.stringify({ 
              status: 'transcribing', 
              currentSegment,
              totalSegments: segments.length,
              message: `Transcription du segment ${currentSegment}/${segments.length}...`
            })}\n\n`);
            
            // Transcription du segment
            const transcription = await openai.audio.transcriptions.create({
              file: segment,
              model: 'whisper-1',
            });
            
            // Nettoyer et ajouter à la transcription complète
            const segmentText = cleanTranscription(transcription.text);
            fullTranscription += (fullTranscription ? ' ' : '') + segmentText;
            
            // Envoyer le résultat partiel
            controller.enqueue(`data: ${JSON.stringify({ 
              status: 'partial', 
              segment: currentSegment,
              totalSegments: segments.length,
              text: segmentText,
              fullText: fullTranscription
            })}\n\n`);
            
            currentSegment++;
          } catch (segmentError: any) {
            console.error(`Error processing segment ${currentSegment}:`, segmentError);
            controller.enqueue(`data: ${JSON.stringify({ 
              status: 'error', 
              segment: currentSegment,
              message: `Erreur segment ${currentSegment}: ${segmentError.message}`,
              error: segmentError.message
            })}\n\n`);
          }
        }
        
        // Envoyer le résultat final
        controller.enqueue(`data: ${JSON.stringify({ 
          status: 'complete', 
          transcription: fullTranscription,
          message: 'Transcription terminée'
        })}\n\n`);
        
        console.log('Streaming transcription completed');
      } catch (error: any) {
        console.error('Error in streaming transcription:', error);
        controller.enqueue(`data: ${JSON.stringify({ 
          status: 'error', 
          error: error.message || 'Unknown error'
        })}\n\n`);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, { headers });
} 