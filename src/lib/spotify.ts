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

  constructor() {
    if (typeof window !== 'undefined') {
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

    console.log(`Making request to ${endpoint} with token: ${this.accessToken.substring(0, 10)}...`); // Log token
    const response = await fetch(`${SPOTIFY_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Get the raw error body
      console.error(`Spotify API request failed: ${endpoint}`);
      console.error(`Status: ${response.status}, Status Text: ${response.statusText}`);
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError.error && parsedError.error.message) {
          console.error(`Response Body (parsed error message):`, parsedError.error.message);
        } else {
          console.error(`Response Body (parsed full object):`, JSON.stringify(parsedError, null, 2));
        }
      } catch (e) {
        console.error(`Response Body (raw):`, errorBody);
      }

      if (response.status === 401) {
        this.clearTokens();
        throw new Error('Token expired');
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
    
    // Spotify API allows up to 100 track IDs per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }
    
    const allFeatures: SpotifyAudioFeatures[] = [];
    
    for (const chunk of chunks) {
      const response = await this.makeRequest<{
        audio_features: (SpotifyAudioFeatures | null)[];
      }>(`/audio-features?ids=${chunk.join(',')}`);
      
      // Filter out null values (tracks without audio features)
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