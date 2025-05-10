/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour augmenter la taille des requêtes
  experimental: {
    serverComponentsExternalPackages: ['openai'],
  },
  // Configuration pour les variables d'environnement
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  // Augmenter la taille maximale des requêtes
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
    responseLimit: '25mb',
  },
};

module.exports = nextConfig; 