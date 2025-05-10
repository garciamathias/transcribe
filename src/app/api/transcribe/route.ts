import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Augmenter la taille maximale du corps de la requête
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    },
    responseLimit: false,
  },
  runtime: 'edge', // Utiliser Edge Runtime pour de meilleures performances en serverless
};

export async function POST(req: NextRequest) {
  // Ajouter des en-têtes CORS pour les environnements serverless
  const headers = new Headers();
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.append('Access-Control-Allow-Headers', 'Content-Type');
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers
    });
  }
  
  try {
    console.log('Receiving transcription request...');
    
    // Extraire les données de la requête
    let formData;
    try {
      formData = await req.formData();
      console.log('FormData parsed successfully');
    } catch (e) {
      console.error('Error parsing formData:', e);
      return new NextResponse(
        JSON.stringify({ error: 'Error parsing form data' }),
        { status: 400, headers }
      );
    }
    
    const file = formData.get('file') as File;
    const clientApiKey = formData.get('apiKey') as string;
    
    if (!file) {
      console.error('No file in request');
      return new NextResponse(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers }
      );
    }

    console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Vérifier si le fichier est audio
    if (!file.type.startsWith('audio/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Uploaded file is not an audio file' }),
        { status: 400, headers }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > 25 * 1024 * 1024) {
      return new NextResponse(
        JSON.stringify({ error: 'File is too large. Maximum size is 25MB' }),
        { status: 400, headers }
      );
    }

    // Utiliser la clé API fournie par le client ou celle de l'environnement
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('No API key configured');
      return new NextResponse(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers }
      );
    }

    // Initialiser OpenAI avec la clé API
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    try {
      console.log('Preparing file for OpenAI API...');
      
      // Créer un objet de type File compatible avec l'API OpenAI
      const bytes = await file.arrayBuffer();
      
      // Utiliser directement le Blob pour plus de compatibilité en serverless
      const fileObj = new File([bytes], file.name, { type: file.type });
      
      console.log('Sending file to OpenAI Whisper API...');
      
      // Appel à l'API de transcription
      const transcription = await openai.audio.transcriptions.create({
        file: fileObj,
        model: 'whisper-1',
      });
      
      console.log('Transcription received successfully');
      
      if (!transcription || !transcription.text) {
        throw new Error('La transcription a échoué: pas de texte retourné');
      }
      
      // Retourner la transcription avec les en-têtes CORS
      return new NextResponse(
        JSON.stringify({ 
          transcription: transcription.text,
          success: true 
        }),
        { 
          status: 200, 
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (apiError: any) {
      console.error('OpenAI API error:', apiError);
      
      // Gérer les erreurs spécifiques de l'API OpenAI
      if (apiError.status === 401) {
        return new NextResponse(
          JSON.stringify({ error: 'Clé API OpenAI invalide ou expirée' }),
          { status: 401, headers }
        );
      }
      
      return new NextResponse(
        JSON.stringify({ error: `Erreur API OpenAI: ${apiError.message || 'Erreur inconnue'}` }),
        { status: 500, headers }
      );
    }
  } catch (error: any) {
    console.error('Error in transcription route:', error);
    
    // Ajouter des informations de débogage à la réponse d'erreur
    return new NextResponse(
      JSON.stringify({ 
        error: `Erreur de transcription: ${error.message || 'Erreur inconnue'}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 