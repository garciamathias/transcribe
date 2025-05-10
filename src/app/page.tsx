'use client';

import { useState } from 'react';
import AudioDropzone from '@/components/AudioDropzone';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la clé API de l'environnement
  const apiKey = process.env.OPENAI_API_KEY || '';

  const handleFileUpload = async (file: File) => {
    // Réinitialiser les états
    setError(null);
    setTranscription(null);
    setIsUploading(true);
    
    try {
      // Vérification de la taille du fichier (25MB max pour Whisper API)
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux. Taille maximale: 25MB');
      }

      // Vérification du type de fichier
      if (!file.type.startsWith('audio/')) {
        throw new Error('Veuillez téléverser un fichier audio valide');
      }

      console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      // Préparer les données à envoyer
      const formData = new FormData();
      formData.append('file', file);
      
      // Si une clé API est disponible dans l'environnement, l'utiliser
      if (apiKey) {
        formData.append('apiKey', apiKey);
      }

      // Appel à notre API de transcription
      console.log('Sending request to API...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      // Vérifier si la réponse est vide
      const text = await response.text();
      if (!text) {
        throw new Error('Réponse vide du serveur. Veuillez réessayer.');
      }
      
      // Convertir le texte en JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la transcription.');
      }

      setTranscription(data.transcription);
      console.log('Transcription completed successfully');
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsUploading(false);
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
          <AudioDropzone onFileUpload={handleFileUpload} isUploading={isUploading} />
          
          <TranscriptionDisplay transcription={transcription} error={error} />

          {(transcription || error) && (
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
