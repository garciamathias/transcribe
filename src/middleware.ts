import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ne pas modifier les en-têtes des requêtes GET
  if (request.method === 'GET') {
    return NextResponse.next();
  }
  
  // Pour les requêtes POST vers notre API de transcription
  if (request.nextUrl.pathname === '/api/transcribe' && request.method === 'POST') {
    // Créer une nouvelle instance de NextResponse
    const response = NextResponse.next();
    
    // Définir des en-têtes pour permettre un téléversement de fichier plus important
    // Cela s'applique uniquement au serveur, pas au client
    response.headers.set('Accept', '*/*');
    
    return response;
  }
  
  return NextResponse.next();
}

// Configurer le middleware pour s'exécuter uniquement sur notre route API
export const config = {
  matcher: '/api/:path*',
}; 