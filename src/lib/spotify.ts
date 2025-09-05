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
  popularity: number; // Added popularity
  explicit: boolean; // Added explicit status
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
    
    // Filter out null tracks and ensure popularity and explicit fields are present
    return response.items.map(item => item.track).filter(track => track !== null).map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      uri: track.uri,
      preview_url: track.preview_url,
      popularity: track.popularity || 0, // Default to 0 if not present
      explicit: track.explicit || false, // Default to false if not present
    }));
  }

  async getUserTopArtists(limit: number = 5): Promise<SpotifyArtist[]> {
    const response = await this.makeRequest<{
      items: SpotifyArtist[];
      next: string | null;
      total: number;
    }>(`/me/top/artists?limit=${limit}&time_range=medium_term`); // medium_term for last 6 months
    return response.items;
  }
}