import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer'; // Buffer is available in Node.js environments

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      console.error('Refresh token is missing in request body.');
      return NextResponse.json({ error: 'Refresh token is missing' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Spotify client credentials (NEXT_PUBLIC_SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET) not configured for token refresh.');
      throw new Error('Spotify client credentials not configured for token refresh.');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Spotify token refresh failed with status:', response.status, 'details:', errorData);
      return NextResponse.json(
        { error: `Token refresh failed: ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const tokenData = await response.json();
    console.log('Spotify token refresh successful. New access token acquired.');
    return NextResponse.json(tokenData);
  } catch (error: unknown) {
    console.error('Error in refresh-token API route:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}