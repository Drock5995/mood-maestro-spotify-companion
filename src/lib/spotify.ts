import { Buffer } from 'buffer'; // Import Buffer for client_secret encoding

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  tracks: {
    total: number;
  };
  public: boolean;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
}

export interface SpotifyAudioFeatures {
  id: string;
  acousticness: number;      // 0.0 to 1.0 (acoustic vs electric)
  danceability: number;      // 0.0 to 1.0 (how suitable for dancing)
  energy: number;            // 0.0 to 1.0 (intensity and power)
  instrumentalness: number;  // 0.0 to 1.0 (likelihood of no vocals)
  liveness: number;          // 0.0 to 1.0 (presence of audience)
  loudness: number;          // -60 to 0 dB (overall loudness)
  speechiness: number;       // 0.0 to 1.0 (presence of spoken words)
  tempo: number;             // BPM (tempo)
  valence: number;           // 0.0 to 1.0 (musical positiveness)
  key: number;               // 0-11 (pitch class)
  mode: number;              // 0 or 1 (major or minor)
  time_signature: number;    // 3-7 (time signature)
}

export interface PlaylistWithTracks extends SpotifyPlaylist {
  trackDetails?: SpotifyTrack[];
  audioFeatures?: SpotifyAudioFeatures[];
}

export interface MoodAnalysis {
  overall_mood: string;
  mood_scores: {
    happy: number;
    sad: number;
    energetic: number;
    calm: number;
    romantic: number;
    angry: number;
  };
  audio_characteristics: {
    avg_valence: number;
    avg_energy: number;
    avg_danceability: number;
    avg_tempo: number;
  };
  description: string;
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';

export class SpotifyAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null; // Unix timestamp in ms

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('spotify_access_token');
      this.refreshToken = localStorage.getItem('spotify_refresh_token');
      const expiresAt = localStorage.getItem('spotify_token_expires_at');
      this.tokenExpiresAt = expiresAt ? parseInt(expiresAt, 10) : null;
    }
  }

  setAccessToken(token: string, refreshToken?: string, expiresIn?: number) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('spotify_access_token', token);
      if (refreshToken) {
        this.refreshToken = refreshToken;
        localStorage.setItem('spotify_refresh_token', refreshToken);
      }
      if (expiresIn) {
        this.tokenExpiresAt = Date.now() + expiresIn * 1000;
        localStorage.setItem('spotify_token_expires_at', this.tokenExpiresAt.toString());
      }
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_token_expires_at');
    }
  }

  private isTokenExpired(): boolean {
    // Consider token expired if it's within 60 seconds of actual expiry
    return !this.accessToken || !this.tokenExpiresAt || Date.now() >= (this.tokenExpiresAt - 60 * 1000);
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      this.clearTokens();
      throw new Error('No refresh token available. Please log in again.');
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify client credentials not configured for token refresh.');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Spotify token refresh failed:', errorData);
        this.clearTokens(); // Clear tokens if refresh fails
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: SpotifyTokenResponse = await response.json();
      // Spotify might not return a new refresh token, so keep the old one if not provided
      this.setAccessToken(tokenData.access_token, tokenData.refresh_token || this.refreshToken, tokenData.expires_in);
      console.log('Access token refreshed successfully.');
    } catch (error) {
      console.error('Error refreshing access token:', error);
      this.clearTokens();
      throw error;
    }
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit, retry = true): Promise<T> {
    if (this.isTokenExpired()) {
      console.log('[SpotifyAPI] Access token expired or near expiry, attempting to refresh...');
      try {
        await this.refreshAccessToken();
      } catch (refreshError) {
        console.error('[SpotifyAPI] Failed to refresh token, redirecting to login.', refreshError);
        this.clearTokens();
        // Redirect to login page if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/'; 
        }
        throw refreshError; // Re-throw to stop current request
      }
    }

    if (!this.accessToken) {
      throw new Error('No access token available after refresh attempt.');
    }

    console.log(`[SpotifyAPI] Making request to ${endpoint}`);
    console.log(`[SpotifyAPI] Using access token (first 10 chars): ${this.accessToken.substring(0, 10)}...`);
    console.log(`[SpotifyAPI] Token expires at: ${this.tokenExpiresAt ? new Date(this.tokenExpiresAt).toLocaleString() : 'N/A'}`);
    console.log(`[SpotifyAPI] Current time: ${new Date().toLocaleString()}`);

    const response = await fetch(`${SPOTIFY_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[SpotifyAPI] Spotify API request failed: ${endpoint}`);
      console.error(`[SpotifyAPI] Status: ${response.status}, Status Text: ${response.statusText}`);
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError.error && parsedError.error.message) {
          console.error(`[SpotifyAPI] Response Body (parsed error message):`, parsedError.error.message);
        } else {
          console.error(`[SpotifyAPI] Response Body (parsed full object):`, JSON.stringify(parsedError, null, 2));
        }
      } catch (e) {
        console.error(`[SpotifyAPI] Response Body (raw):`, errorBody);
      }

      if (response.status === 401 && retry) {
        console.warn('[SpotifyAPI] Received 401 Unauthorized. Attempting token refresh and retrying request...');
        this.clearTokens(); // Clear potentially bad token
        try {
          await this.refreshAccessToken();
          // Retry the original request with the new token
          return this.makeRequest<T>(endpoint, options, false); // Do not retry again to prevent infinite loop
        } catch (refreshError) {
          console.error('[SpotifyAPI] Failed to refresh token after 401, redirecting to login.', refreshError);
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          throw refreshError;
        }
      }
      throw new Error(`Spotify API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    return this.makeRequest<SpotifyUser>('/me');
  }

  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    const response = await this.makeRequest<{
      items: SpotifyPlaylist[];
      next: string | null;
      total: number;
    }>('/me/playlists?limit=50');
    
    return response.items;
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let url = `/playlists/${playlistId}/tracks?limit=50`;
    
    while (url) {
      const response = await this.makeRequest<{
        items: Array<{
          track: SpotifyTrack;
        }>;
        next: string | null;
      }>(url);
      
      tracks.push(...response.items.map(item => item.track));
      url = response.next ? response.next.replace('https://api.spotify.com/v1', '') : '';
    }
    
    return tracks;
  }

  async getAudioFeatures(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
    if (trackIds.length === 0) return [];
    
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }
    
    const allFeatures: SpotifyAudioFeatures[] = [];
    
    for (const chunk of chunks) {
      const response = await this.makeRequest<{
        audio_features: (SpotifyAudioFeatures | null)[];
      }>(`/audio-features?ids=${chunk.join(',')}`);
      
      const validFeatures = response.audio_features.filter(
        (features): features is SpotifyAudioFeatures => features !== null
      );
      
      allFeatures.push(...validFeatures);
    }
    
    return allFeatures;
  }

  async getPlaylistWithDetails(playlistId: string): Promise<PlaylistWithTracks> {
    const [playlist, tracks] = await Promise.all([
      this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`),
      this.getPlaylistTracks(playlistId)
    ]);
    
    const trackIds = tracks.map(track => track.id);
    const audioFeatures = trackIds.length > 0 ? await this.getAudioFeatures(trackIds) : [];
    
    return {
      ...playlist,
      trackDetails: tracks,
      audioFeatures
    };
  }
}

export const spotify = new SpotifyAPI();