import { NextRequest, NextResponse } from 'next/server';
import { SpotifyAPI } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle authorization denial
  if (error) {
    console.error('Spotify authorization denied:', error); // Added error logging
    return NextResponse.redirect(new URL('/?error=access_denied', request.url));
  }

  // Validate state parameter
  if (state !== 'spotify_auth') {
    console.error('Invalid state parameter received:', state); // Added error logging
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }

  if (!code) {
    console.error('No authorization code received.'); // Added error logging
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const redirectUri = `${new URL(request.url).origin}/api/callback`;
    const tokenData = await SpotifyAPI.exchangeCodeForToken(code, redirectUri);
    
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