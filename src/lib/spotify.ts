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
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  uri: string;
  preview_url: string | null;
}

export interface SpotifyAudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';
const SUPABASE_PROJECT_ID = 'jykbnnmvjpwmoxxhijgn'; // Your Supabase Project ID
const GET_AUDIO_FEATURES_EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-audio-features`;

export class SpotifyAPI {
  private accessToken: string | null = null;

  constructor(initialAccessToken?: string) {
    if (initialAccessToken) {
      this.accessToken = initialAccessToken;
    } else if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('spotify_access_token');
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('spotify_access_token', token);
    }
  }

  clearTokens() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_token_expires_at');
    }
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${SPOTIFY_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearTokens();
        throw new Error('Token expired');
      }
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
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
    const response = await this.makeRequest<{
      items: Array<{ track: SpotifyTrack }>;
      next: string | null;
      total: number;
    }>(`/playlists/${playlistId}/tracks?limit=100`); // Fetch up to 100 tracks
    
    return response.items.map(item => item.track).filter(track => track !== null); // Filter out null tracks
  }

  async getAudioFeaturesForTracks(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
    if (!this.accessToken) {
      throw new Error('No Spotify access token available to fetch audio features.');
    }

    const response = await fetch(GET_AUDIO_FEATURES_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`, // Pass Spotify token to Edge Function
      },
      body: JSON.stringify({ trackIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error invoking Edge Function for audio features:', errorData);
      throw new Error(`Failed to get audio features: ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }
}