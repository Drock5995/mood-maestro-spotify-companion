import { NextRequest, NextResponse } from 'next/server';
import { SpotifyTokenResponse } from '@/lib/spotify';
import { Buffer } from 'buffer';

// This function handles the exchange of the authorization code for Spotify tokens.
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<SpotifyTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('Spotify client credentials (NEXT_PUBLIC_SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET) not configured.');
    throw new Error('Spotify client credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Spotify token exchange error details:', errorData);
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}. Spotify error: ${JSON.stringify(errorData)}`);
  }

  const tokenData: SpotifyTokenResponse = await response.json();
  console.log('Spotify token exchange successful. Received token data:', tokenData);
  return tokenData;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle authorization denial
  if (error) {
    console.error('Spotify authorization denied:', error);
    return NextResponse.redirect(new URL('/login?error=access_denied', request.url));
  }

  // Validate state parameter
  if (state !== 'spotify_auth') {
    console.error('Invalid state parameter received:', state);
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  if (!code) {
    console.error('No authorization code received.');
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    
    // Store tokens securely - for now using query params to pass to client
    // In production, consider using secure HTTP-only cookies or server-side storage
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('access_token', tokenData.access_token);
    dashboardUrl.searchParams.set('refresh_token', tokenData.refresh_token);
    dashboardUrl.searchParams.set('expires_in', tokenData.expires_in.toString());
    dashboardUrl.searchParams.set('granted_scopes', tokenData.scope);
    
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(new URL(`/login?error=token_exchange_failed&details=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`, request.url));
  }
}