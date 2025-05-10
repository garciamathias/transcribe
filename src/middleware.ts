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
    
    // Configurer les en-têtes pour accepter les gros fichiers et désactiver la mise en cache
    response.headers.set('Accept', '*/*');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Connection', 'keep-alive');
    
    return response;
  }
  
  return NextResponse.next();
}

// Configurer le middleware pour s'exécuter uniquement sur notre route API
export const config = {
  matcher: '/api/:path*',
}; 