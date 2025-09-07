import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { owner_user_id, spotify_playlist_id, details } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the owner's access token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('spotify_tokens')
      .select('access_token')
      .eq('user_id', owner_user_id)
      .single();

    if (tokenError) throw new Error(`Could not find token for user ${owner_user_id}`);
    const accessToken = tokenData.access_token;

    // 2. Call Spotify API to update playlist details
    const response = await fetch(`https://api.spotify.com/v1/playlists/${spotify_playlist_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(details),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Spotify API Error:", errorBody);
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})