import { SupabaseClient } from '@supabase/supabase-js';

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
    release_date: string;
  };
  uri: string;
  preview_url: string | null;
  popularity: number;
  explicit: boolean;
  duration_ms: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  popularity: number;
  followers: {
    total: number;
  };
  uri: string;
}

export interface SpotifyAudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  valence: number; // musical positivity
  tempo: number;
  // Add other features if needed in the future
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
  private supabase: SupabaseClient | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(initialAccessToken: string | null, supabaseClient?: SupabaseClient) {
    this.accessToken = initialAccessToken;
    if (supabaseClient) {
      this.supabase = supabaseClient;
    }
  }

  setSupabaseClient(client: SupabaseClient) {
    this.supabase = client;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async refreshToken(): Promise<string> {
    if (!this.supabase) {
      throw new Error("Supabase client not set for token refresh.");
    }
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshPromise = (async () => {
        try {
          const { data, error } = await this.supabase!.functions.invoke('refresh-spotify-token');
          if (error) throw error;
          if (!data.access_token) throw new Error("No access token returned from refresh function.");
          
          this.setAccessToken(data.access_token);
          return data.access_token;
        } finally {
          this.isRefreshing = false;
          this.refreshPromise = null;
        }
      })();
    }
    return this.refreshPromise!;
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit, isRetry = false): Promise<T> {
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
      const errorBody = await response.json().catch(() => ({}));
      console.error("Spotify API Error:", errorBody);

      if ((response.status === 401 || response.status === 403) && !isRetry) {
        console.log("Token expired, attempting to refresh...");
        try {
          await this.refreshToken();
          console.log("Token refreshed, retrying original request.");
          return this.makeRequest(endpoint, options, true);
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          if (this.supabase) {
            await this.supabase.auth.signOut();
          }
          throw new Error('Session expired. Please log in again.');
        }
      }
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    return this.makeRequest<SpotifyUser>('/me');
  }

  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    const response = await this.makeRequest<{
      items: SpotifyPlaylist[];
    }>('/me/playlists?limit=50');
    return response.items;
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    return this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`);
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest<{
      items: Array<{ track: SpotifyTrack | null }>;
    }>(`/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists(id,name),album(id,name,images,release_date),uri,preview_url,popularity,explicit,duration_ms))`);
    return response.items.map(item => item.track).filter((track): track is SpotifyTrack => track !== null);
  }

  async getSeveralArtists(artistIds: string[]): Promise<SpotifyArtist[]> {
    if (artistIds.length === 0) return [];
    const response = await this.makeRequest<{ artists: SpotifyArtist[] }>(`/artists?ids=${artistIds.slice(0, 50).join(',')}`);
    return response.artists.filter(artist => artist !== null);
  }

  async getAudioFeaturesForTracks(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
    if (trackIds.length === 0) return [];
    const response = await this.makeRequest<{ audio_features: SpotifyAudioFeatures[] }>(`/audio-features?ids=${trackIds.slice(0, 100).join(',')}`);
    return response.audio_features.filter(features => features !== null);
  }

  async getUserTopArtists(limit: number = 5): Promise<SpotifyArtist[]> {
    const response = await this.makeRequest<{ items: SpotifyArtist[] }>(`/me/top/artists?limit=${limit}&time_range=medium_term`);
    return response.items;
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    if (!query.trim()) return [];
    const response = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
    return response.tracks.items;
  }

  async addTrackToPlaylist(playlistId: string, trackUri: string): Promise<{ snapshot_id: string }> {
    return this.makeRequest<{ snapshot_id: string }>(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: [trackUri] }),
    });
  }
}