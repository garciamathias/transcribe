'use client';

import { useState } from 'react';
import AudioDropzone from '@/components/AudioDropzone';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<{
    status: string;
    message?: string;
    currentSegment?: number;
    totalSegments?: number;
  } | null>(null);

  // Récupérer la clé API de l'environnement
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

  const handleFileUpload = async (file: File) => {
    // Réinitialiser les états
    setError(null);
    setTranscription(null);
    setIsUploading(true);
    setIsStreaming(true);
    setStreamingStatus({ status: 'preparing', message: 'Préparation du fichier...' });
    
    try {
      // Vérification de la taille du fichier (25MB max pour Whisper API)
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux. Taille maximale: 25MB');
      }

      // Vérification du type de fichier
      if (!file.type.startsWith('audio/')) {
        throw new Error('Veuillez téléverser un fichier audio valide');
      }

      console.log(`Uploading file: ${file.name}, size: ${file.size / (1024 * 1024)} MB, type: ${file.type}`);
      
      // Préparer les données à envoyer
      const formData = new FormData();
      formData.append('file', file);
      
      // Si une clé API est disponible dans l'environnement, l'utiliser
      if (apiKey) {
        formData.append('apiKey', apiKey);
      }

      // Appel à notre API de transcription avec streaming
      console.log('Starting streaming transcription...');
      setStreamingStatus({ status: 'connecting', message: 'Connexion au service de transcription...' });
      
      // Utiliser l'API EventSource pour recevoir les événements de streaming
      try {
        await fetchTranscriptionWithStreaming(formData);
      } catch (streamingError: any) {
        console.error('Streaming failed, trying fallback method:', streamingError);
        
        // Si le streaming échoue, essayer la méthode standard
        await fetchTranscriptionStandard(formData);
      }
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Une erreur est survenue.');
      setIsStreaming(false);
    } finally {
      setIsUploading(false);
      setStreamingStatus(null);
    }
  };

  // Fonction pour transcription avec streaming
  const fetchTranscriptionWithStreaming = (formData: FormData) => {
    return new Promise((resolve, reject) => {
      try {
        // Obtenir une URL unique pour éviter la mise en cache du navigateur
        const timestamp = Date.now();
        const url = `/api/transcribe-stream?t=${timestamp}`;
        
        // Créer une ReadableStream à partir de la réponse d'une requête fetch
        const fetchWithStream = async () => {
          try {
            const fetchResponse = await fetch(url, {
              method: 'POST',
              body: formData,
              headers: {
                Accept: 'text/event-stream',
              },
            });
            
            if (!fetchResponse.ok || !fetchResponse.body) {
              throw new Error('Streaming non supporté par le serveur');
            }
            
            // Créer un ReadableStream à partir de la réponse
            const reader = fetchResponse.body.getReader();
            const decoder = new TextDecoder();
            
            // Traiter les chunks de données
            let buffer = '';
            
            const processChunk = async () => {
              try {
                const { done, value } = await reader.read();
                
                if (done) {
                  resolve('Streaming completed');
                  return;
                }
                
                // Convertir le chunk en texte et l'ajouter au buffer
                buffer += decoder.decode(value, { stream: true });
                
                // Extraire et traiter les événements "data:"
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    const eventData = line.substring(5).trim();
                    onStreamMessage(eventData);
                  }
                }
                
                // Continuer à lire les chunks
                processChunk();
              } catch (error) {
                reader.cancel();
                reject(error);
              }
            };
            
            // Commencer le traitement
            processChunk();
          } catch (error) {
            reject(error);
          }
        };
        
        // Lancer la requête fetch avec streaming
        fetchWithStream();
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // Fonction pour gérer les messages de streaming
  const onStreamMessage = (eventDataStr: string) => {
    try {
      const eventData = JSON.parse(eventDataStr);
      console.log('Stream event:', eventData);
      
      // Mettre à jour le statut de streaming
      if (eventData.status) {
        setStreamingStatus(prev => ({ 
          ...prev, 
          status: eventData.status,
          message: eventData.message || prev?.message,
          currentSegment: eventData.currentSegment || prev?.currentSegment,
          totalSegments: eventData.totalSegments || prev?.totalSegments
        }));
      }
      
      // Gérer les différents types d'événements
      switch (eventData.status) {
        case 'error':
          setError(eventData.error || 'Une erreur est survenue pendant la transcription');
          setIsStreaming(false);
          break;
        
        case 'partial':
          // Mettre à jour la transcription partielle
          setTranscription(eventData.fullText);
          break;
          
        case 'complete':
          // Transcription terminée
          setTranscription(eventData.transcription);
          setIsStreaming(false);
          setIsUploading(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing stream event:', error, eventDataStr);
    }
  };
  
  // Fonction pour la méthode de transcription standard (fallback)
  const fetchTranscriptionStandard = async (formData: FormData) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
    try {
      setStreamingStatus({ status: 'processing', message: 'Transcription en cours (méthode standard)...' });
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      
      const text = await response.text();
      if (!text) {
        throw new Error('Réponse vide du serveur');
      }
      
      const data = JSON.parse(text);
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la transcription');
      }

      setTranscription(data.transcription);
      setIsStreaming(false);
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        throw new Error('La requête a pris trop de temps. Veuillez réessayer avec un fichier plus court');
      }
      throw fetchError;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Audio <span className="text-blue-600">Transcribe</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Glissez votre fichier audio pour le transcrire
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <AudioDropzone 
            onFileUpload={handleFileUpload} 
            isUploading={isUploading}
            streamingStatus={streamingStatus || undefined}
          />
          
          <TranscriptionDisplay 
            transcription={transcription} 
            error={error}
            isStreaming={isStreaming}
            streamingStatus={streamingStatus || undefined}
          />

          {(transcription || error) && !isStreaming && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setTranscription(null);
                  setError(null);
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Nouvelle transcription
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
