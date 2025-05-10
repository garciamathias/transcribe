/**
 * Utilitaire pour le traitement et la segmentation de fichiers audio
 */

/**
 * Divise un fichier audio en segments pour un traitement progressif
 * @param file Fichier audio à segmenter
 * @param maxDurationSeconds Durée maximale de chaque segment en secondes (estimation)
 * @param maxSizeMB Taille maximale de chaque segment en MB
 * @returns Un tableau de segments de fichiers
 */
export async function segmentAudioFile(
  file: File, 
  maxDurationSeconds: number = 30,
  maxSizeMB: number = 20
): Promise<File[]> {
  // Si le fichier est petit, on le retourne directement sans segmentation
  if (file.size < maxSizeMB * 1024 * 1024) {
    return [file];
  }
  
  // Pour une implémentation réelle, on utiliserait Web Audio API pour segmenter
  // l'audio avec précision. Ici, on segmente approximativement en fonction de la taille
  const totalChunks = Math.ceil(file.size / (maxSizeMB * 1024 * 1024));
  const chunkSize = Math.ceil(file.size / totalChunks);
  
  const buffer = await file.arrayBuffer();
  const segments: File[] = [];
  
  // Créer les segments
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    
    // Créer un nouveau segment depuis le buffer original
    const chunkBuffer = buffer.slice(start, end);
    const segment = new File([chunkBuffer], `segment-${i+1}-${file.name}`, {
      type: file.type,
    });
    
    segments.push(segment);
  }
  
  return segments;
}

/**
 * Concatène des transcriptions en tenant compte du contexte
 * @param transcriptions Tableau de transcriptions partielles
 * @returns Transcription combinée
 */
export function combineTranscriptions(transcriptions: string[]): string {
  if (transcriptions.length <= 1) return transcriptions[0] || '';
  
  // On pourrait implémenter une logique plus sophistiquée pour améliorer les transitions
  // entre segments (éliminer les répétitions, corriger la ponctuation, etc.)
  return transcriptions.join(' ');
}

/**
 * Nettoie une transcription (améliore la ponctuation, formatage, etc.)
 * @param text Texte à nettoyer
 * @returns Texte nettoyé
 */
export function cleanTranscription(text: string): string {
  if (!text) return '';
  
  // Améliorer la ponctuation et le formatage
  let cleaned = text.trim();
  
  // Mettre une majuscule au début des phrases
  cleaned = cleaned.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
  
  // Assurer que la première lettre est en majuscule
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned;
} 