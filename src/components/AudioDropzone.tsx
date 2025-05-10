import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

type AudioDropzoneProps = {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  streamingStatus?: {
    status: string;
    message?: string;
  };
};

export default function AudioDropzone({ 
  onFileUpload, 
  isUploading,
  streamingStatus
}: AudioDropzoneProps) {
  const [filePreview, setFilePreview] = useState<{ name: string; size: number } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFilePreview({
        name: file.name,
        size: file.size,
      });
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': []
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''} transition-all duration-200 ease-in-out`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-500 font-medium">
              {streamingStatus?.message || 'Transcription en cours...'}
            </p>
            {streamingStatus?.status === 'transcribing' && (
              <p className="mt-1 text-xs text-gray-500">
                Les résultats apparaîtront au fur et à mesure
              </p>
            )}
          </div>
        ) : filePreview ? (
          <div className="py-2">
            <svg className="mx-auto h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="mt-2 text-sm font-medium text-blue-600">{filePreview.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(filePreview.size)}</p>
          </div>
        ) : (
          <div className="py-8">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-700">
              Glissez votre fichier audio ici
            </p>
            <p className="mt-1 text-xs text-gray-500">
              MP3, WAV, M4A, etc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 