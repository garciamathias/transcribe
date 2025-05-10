import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Augmenter la taille maximale du corps de la requête
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const clientApiKey = formData.get('apiKey') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Vérifier si le fichier est audio
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Uploaded file is not an audio file' },
        { status: 400 }
      );
    }

    // Utiliser la clé API fournie par le client ou celle de l'environnement
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Initialiser OpenAI avec la clé API
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    try {
      // Convertir le fichier en Blob avec le type MIME correct
      const arrayBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([arrayBuffer], { type: file.type });
      
      // Créer un objet File avec un nom et un type
      const fileObj = new File([fileBlob], file.name, { type: file.type });
      
      // Appel à l'API de transcription avec un try/catch dédié
      const transcription = await openai.audio.transcriptions.create({
        file: fileObj,
        model: 'whisper-1',
      });
      
      if (!transcription || !transcription.text) {
        throw new Error('La transcription a échoué: pas de texte retourné');
      }
      
      // Retourner la transcription
      return NextResponse.json({ 
        transcription: transcription.text,
        success: true
      });
    } catch (apiError: any) {
      console.error('OpenAI API error:', apiError);
      
      // Gérer les erreurs spécifiques de l'API OpenAI
      if (apiError.status === 401) {
        return NextResponse.json({ 
          error: 'Clé API OpenAI invalide ou expirée' 
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: `Erreur API OpenAI: ${apiError.message || 'Erreur inconnue'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in transcription route:', error);
    
    return NextResponse.json({ 
      error: `Erreur de transcription: ${error.message || 'Erreur inconnue'}` 
    }, { status: 500 });
  }
} 