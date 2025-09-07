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

  constructor(initialAccessToken?: string) {
    // Always prioritize the token passed during construction
    if (initialAccessToken) {
      this.accessToken = initialAccessToken;
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage only if no token is explicitly provided
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
      const errorBody = await response.json();
      console.error("Spotify API Error:", errorBody);
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    // Handle cases where response might be empty
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
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
      items: Array<{ track: SpotifyTrack | null }>;
    }>(`/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists(id,name),album(id,name,images,release_date),uri,preview_url,popularity,explicit,duration_ms))`);
    
    return response.items
      .map(item => item.track)
      .filter((track): track is SpotifyTrack => track !== null);
  }

  async getSeveralArtists(artistIds: string[]): Promise<SpotifyArtist[]> {
    if (artistIds.length === 0) {
      return [];
    }
    // Spotify API limit is 50 artists per request
    const response = await this.makeRequest<{ artists: SpotifyArtist[] }>(
      `/artists?ids=${artistIds.slice(0, 50).join(',')}`
    );
    return response.artists.filter(artist => artist !== null);
  }

  async getUserTopArtists(limit: number = 5): Promise<SpotifyArtist[]> {
    const response = await this.makeRequest<{
      items: SpotifyArtist[];
      next: string | null;
      total: number;
    }>(`/me/top/artists?limit=${limit}&time_range=medium_term`);
    return response.items;
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    if (!query.trim()) return [];
    const response = await this.makeRequest<{
      tracks: {
        items: SpotifyTrack[];
      };
    }>(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
    return response.tracks.items;
  }

  async addTrackToPlaylist(playlistId: string, trackUri: string): Promise<{ snapshot_id: string }> {
    return this.makeRequest<{ snapshot_id: string }>(
      `/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        body: JSON.stringify({
          uris: [trackUri],
        }),
      }
    );
  }
}