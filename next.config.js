/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour augmenter la taille des requêtes
  experimental: {
    serverComponentsExternalPackages: ['openai'],
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  // Configuration pour les variables d'environnement
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
  // Optimisations pour l'environnement serverless
  swcMinify: true,
  output: 'standalone',
  compress: true,
  // Optimisations d'images pour Netlify
  images: {
    domains: ['*'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configuration pour les gros fichiers
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
    responseLimit: '25mb',
  },
  // Optimisation pour Netlify Edge Functions
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externaliser OpenAI pour éviter les problèmes de bundling
      config.externals.push('openai');
    }
    return config;
  },
};

module.exports = nextConfig; 