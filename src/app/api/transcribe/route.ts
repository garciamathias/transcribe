import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // Créer un objet de type File compatible avec l'API OpenAI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Créer un fichier temporaire en mémoire
    const fileObject = new File([buffer], file.name, { type: file.type });

    // Appel à l'API de transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fileObject,
      model: 'whisper-1',
    });

    return NextResponse.json({ 
      transcription: transcription.text 
    });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: error.message || 'Error transcribing audio' },
      { status: 500 }
    );
  }
} 