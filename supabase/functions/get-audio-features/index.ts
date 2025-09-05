import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify Spotify Access Token from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid Spotify access token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const spotifyAccessToken = authHeader.replace('Bearer ', '');

  try {
    const { trackIds } = await req.json();

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Bad Request: Missing or invalid trackIds array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Spotify API allows up to 100 track IDs per request
    const MAX_IDS_PER_REQUEST = 100;
    const audioFeatures: any[] = [];

    for (let i = 0; i < trackIds.length; i += MAX_IDS_PER_REQUEST) {
      const batchIds = trackIds.slice(i, i + MAX_IDS_PER_REQUEST);
      const spotifyResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${batchIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${spotifyAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!spotifyResponse.ok) {
        const errorData = await spotifyResponse.json();
        console.error('Spotify API error fetching audio features:', errorData);
        return new Response(JSON.stringify({ error: `Spotify API error: ${spotifyResponse.status} ${spotifyResponse.statusText}`, details: errorData }), {
          status: spotifyResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await spotifyResponse.json();
      audioFeatures.push(...data.audio_features);
    }

    return new Response(JSON.stringify(audioFeatures), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});