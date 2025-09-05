// Removed: import { Buffer } from 'buffer'; // Buffer is no longer needed client-side

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
    url:string;
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
  uri: string; // Added track URI for adding to playlists
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

export interface RecommendationOptions {
  seed_artists?: string[];
  seed_genres?: string[];
  seed_tracks?: string[];
  limit?: number;
  target_valence?: number;
  target_energy?: number;
  target_danceability?: number;
  target_tempo?: number;
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

    try {
      // Call the new server-side API route to refresh the token
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server-side token refresh failed:', errorData);
        this.clearTokens(); // Clear tokens if refresh fails
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: SpotifyTokenResponse = await response.json();
      // Spotify might not return a new refresh token, so keep the old one if not provided
      this.setAccessToken(tokenData.access_token, tokenData.refresh_token || this.refreshToken, tokenData.expires_in);
      console.log('Access token refreshed successfully via API route.');
    } catch (error: unknown) { // Changed 'e' to 'error: unknown'
      console.error('Error refreshing access token via API route:', error instanceof Error ? error.message : String(error));
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
      // Handle 401 Unauthorized with a retry
      if (response.status === 401 && retry) {
        console.warn('[SpotifyAPI] Received 401 Unauthorized. Attempting token refresh and retrying request...');
        try {
          await this.refreshAccessToken();
          return this.makeRequest<T>(endpoint, options, false); // Retry only once
        } catch (refreshError) {
          console.error('[SpotifyAPI] Failed to refresh token after 401, redirecting to login.', refreshError);
          this.clearTokens();
          if (typeof window !== 'undefined') { window.location.href = '/'; }
          throw refreshError;
        }
      }
      // Handle 403 Forbidden by throwing an error, not forcing a logout.
      if (response.status === 403) {
        console.error('[SpotifyAPI] Received 403 Forbidden. The token may be invalid or lack permissions for this specific request.');
        throw new Error(`Spotify API error: 403 Forbidden. Your session may be invalid or lack permissions for this operation.`);
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
    }>('/me/playlists?limit=50');
    return response.items;
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let url = `/playlists/${playlistId}/tracks?limit=50`;
    while (url) {
      const response = await this.makeRequest<{
        items: Array<{ track: SpotifyTrack | null }>;
        next: string | null;
      }>(url);
      tracks.push(...response.items.map(item => item.track).filter((t): t is SpotifyTrack => t !== null));
      url = response.next ? response.next.replace(SPOTIFY_BASE_URL, '') : '';
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
      allFeatures.push(...response.audio_features.filter((f): f is SpotifyAudioFeatures => f !== null));
    }
    return allFeatures;
  }

  async getPlaylistWithDetails(playlistId: string): Promise<PlaylistWithTracks> {
    const [playlist, tracks] = await Promise.all([
      this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`),
      this.getPlaylistTracks(playlistId)
    ]);
    const trackIds = tracks.map(track => track.id).filter(id => id);
    const audioFeatures = trackIds.length > 0 ? await this.getAudioFeatures(trackIds) : [];
    return { ...playlist, trackDetails: tracks, audioFeatures };
  }

  async searchTracks(query: string, limit: number = 1): Promise<SpotifyTrack[]> {
    if (!query.trim()) {
      return [];
    }
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
    });
    const response = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(`/search?${params.toString()}`);
    return response.tracks.items;
  }

  async getLikedSongs(): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let url = `/me/tracks?limit=50`;
    while (url) {
      const response = await this.makeRequest<{
        items: Array<{ track: SpotifyTrack | null }>;
        next: string | null;
      }>(url);
      tracks.push(...response.items.map(item => item.track).filter((t): t is SpotifyTrack => t !== null));
      url = response.next ? response.next.replace(SPOTIFY_BASE_URL, '') : '';
    }
    return tracks;
  }

  async getRecommendations(options: RecommendationOptions): Promise<{ tracks: SpotifyTrack[] }> {
    const params = new URLSearchParams();
    if (options.seed_artists) params.append('seed_artists', options.seed_artists.join(','));
    if (options.seed_genres) params.append('seed_genres', options.seed_genres.join(','));
    if (options.seed_tracks) params.append('seed_tracks', options.seed_tracks.join(','));
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.target_valence) params.append('target_valence', options.target_valence.toString());
    if (options.target_energy) params.append('target_energy', options.target_energy.toString());
    if (options.target_danceability) params.append('target_danceability', options.target_danceability.toString());
    if (options.target_tempo) params.append('target_tempo', options.target_tempo.toString());
    return this.makeRequest<{ tracks: SpotifyTrack[] }>(`/recommendations?${params.toString()}`);
  }

  async createPlaylist(userId: string, name: string, description: string): Promise<SpotifyPlaylist> {
    return this.makeRequest<SpotifyPlaylist>(`/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({ name, description, public: true }),
    });
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<{ snapshot_id: string }> {
    let lastResponse: { snapshot_id: string } = { snapshot_id: '' };
    for (let i = 0; i < trackUris.length; i += 100) {
      const chunk = trackUris.slice(i, i + 100);
      lastResponse = await this.makeRequest<{ snapshot_id: string }>(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ uris: chunk }),
      });
    }
    return lastResponse;
  }
}

export const spotify = new SpotifyAPI();