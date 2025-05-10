type TranscriptionDisplayProps = {
  transcription: string | null;
  error: string | null;
};

export default function TranscriptionDisplay({ 
  transcription, 
  error 
}: TranscriptionDisplayProps) {
  if (error) {
    return (
      <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!transcription) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="bg-gray-50 rounded-lg border border-gray-100">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Transcription</h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(transcription);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copier
          </button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{transcription}</p>
        </div>
      </div>
    </div>
  );
} 