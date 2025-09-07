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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
    if (!user) throw new Error('User not found')

    // 2. Get the user's refresh token from the database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('spotify_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError) throw tokenError;
    const refreshToken = tokenData.refresh_token;

    // 3. Request a new access token from Spotify
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const spotifyResponse = await response.json();
    if (!response.ok) {
      throw new Error(`Spotify token refresh failed: ${spotifyResponse.error_description || spotifyResponse.error}`);
    }

    // 4. Update the tokens in the database
    const newAccessToken = spotifyResponse.access_token;
    const newExpiresAt = new Date(Date.now() + spotifyResponse.expires_in * 1000);
    // Spotify might issue a new refresh token
    const newRefreshToken = spotifyResponse.refresh_token || refreshToken;

    const { error: updateError } = await supabaseAdmin
      .from('spotify_tokens')
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // 5. Return the new access token to the client
    return new Response(JSON.stringify({ access_token: newAccessToken }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error in refresh-spotify-token function:', err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})