# Audio Transcribe - Application de Transcription Audio

Cette application permet de transcription des fichiers audio en texte en utilisant l'API Whisper d'OpenAI.

## Fonctionnalités

- Glisser-déposer de fichiers audio
- Transcription via l'API Whisper d'OpenAI
- Affichage du texte transcrit avec possibilité de copier
- Gestion sécurisée de la clé API (stockée dans le localStorage du navigateur)
- Interface responsive et moderne

## Technologies utilisées

- Next.js 15
- TypeScript
- Tailwind CSS
- OpenAI API (Whisper)
- React Dropzone

## Configuration

1. Clonez ce dépôt
2. Installez les dépendances avec `npm install`
3. Créez un fichier `.env.local` avec votre clé API OpenAI (facultatif)
   ```
   OPENAI_API_KEY=votre_clé_api
   ```
4. Lancez l'application en mode développement avec `npm run dev`
5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Utilisation

1. Configurez votre clé API OpenAI (via l'interface ou le fichier `.env.local`)
2. Glissez-déposez un fichier audio dans la zone prévue à cet effet
3. Attendez que la transcription soit générée
4. Consultez et copiez le texte transcrit

## Déploiement

L'application peut être déployée sur Vercel ou tout autre hébergeur compatible avec Next.js.

```bash
npm run build
npm start
```

## Limitations

- La taille maximale des fichiers audio est limitée à 25 Mo (limitation de l'API Whisper)
- Les formats audio supportés sont MP3, WAV, M4A, FLAC, MP4, WEBM, etc.
- Nécessite une connexion Internet et une clé API OpenAI valide
