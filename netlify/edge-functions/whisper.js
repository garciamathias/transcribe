export default async (request, context) => {
  // Gérer les requêtes CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    console.log('Netlify Edge Function: receiving transcription request');
    
    // Récupérer les données du formulaire
    const formData = await request.formData();
    const file = formData.get('file');
    const apiKey = formData.get('apiKey') || context.env.OPENAI_API_KEY;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Vérifier la clé API
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Préparer la requête à l'API OpenAI
    const whisperUrl = 'https://api.openai.com/v1/audio/transcriptions';
    
    const openaiFormData = new FormData();
    openaiFormData.append('file', file);
    openaiFormData.append('model', 'whisper-1');

    // Envoyer la requête à OpenAI
    const openaiResponse = await fetch(whisperUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    // Gérer la réponse de l'API OpenAI
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorData);
      
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${openaiResponse.status}`, 
        details: errorData
      }), {
        status: openaiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Transmettre la réponse à l'utilisateur
    const transcriptionData = await openaiResponse.json();
    
    return new Response(JSON.stringify({ 
      transcription: transcriptionData.text,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(JSON.stringify({ 
      error: `Transcription error: ${error.message || 'Unknown error'}` 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}; 