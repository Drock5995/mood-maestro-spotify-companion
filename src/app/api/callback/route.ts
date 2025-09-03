import { NextRequest, NextResponse } from 'next/server';
import { SpotifyTokenResponse } from '@/lib/spotify';
import { Buffer } from 'buffer'; // This line is now correctly uncommented

// Helper function for token exchange, now local to this server-side route
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<SpotifyTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
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
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
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
    return NextResponse.redirect(new URL('/?error=access_denied', request.url));
  }

  // Validate state parameter
  if (state !== 'spotify_auth') {
    console.error('Invalid state parameter received:', state);
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }

  if (!code) {
    console.error('No authorization code received.');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const redirectUri = `${new URL(request.url).origin}/api/callback`;
    // Use the local exchangeCodeForToken function
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    
    // Explicitly log the granted scopes here
    console.log('Spotify token exchange successful. Granted scopes:', tokenData.scope);
    
    // Store tokens securely - for now using query params to pass to client
    // In production, consider using secure HTTP-only cookies
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('access_token', tokenData.access_token);
    dashboardUrl.searchParams.set('refresh_token', tokenData.refresh_token);
    dashboardUrl.searchParams.set('expires_in', tokenData.expires_in.toString());
    
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
  }
}