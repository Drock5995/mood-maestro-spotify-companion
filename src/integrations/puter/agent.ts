import { Puter, Tool } from '@puter/js';
import { SpotifyAPI, SpotifyTrack, SpotifyPlaylist } from '@/lib/spotify';

interface AgentTools {
  spotify: SpotifyAPI;
}

export class MusicAgent {
  private puter: Puter;
  private spotifyApi: SpotifyAPI;

  constructor(spotifyApi: SpotifyAPI) {
    if (!process.env.NEXT_PUBLIC_PUTER_API_KEY) {
      throw new Error('NEXT_PUBLIC_PUTER_API_KEY is not set. Please configure it in your environment variables.');
    }
    this.puter = new Puter({
      apiKey: process.env.NEXT_PUBLIC_PUTER_API_KEY,
    });
    this.spotifyApi = spotifyApi;
  }

  private getSpotifyTools(): Tool<AgentTools>[] {
    return [
      {
        name: 'searchTracks',
        description: 'Search for tracks on Spotify by a query string. Returns track ID, name, artists, album, and a preview URL if available.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query for tracks.' },
            limit: { type: 'number', description: 'Maximum number of tracks to return (default 5).' },
          },
          required: ['query'],
        },
        handler: async ({ query, limit = 5 }) => {
          const tracks = await this.spotifyApi.searchTracks(query, limit);
          return JSON.stringify(tracks.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map(a => a.name).join(', '),
            album: track.album.name,
            preview_url: track.preview_url,
          })));
        },
      },
      {
        name: 'getUserPlaylists',
        description: 'Get the current user\'s Spotify playlists. Returns playlist ID, name, total number of tracks, and public status.',
        parameters: {
          type: 'object',
          properties: {},
        },
        handler: async () => {
          const playlists = await this.spotifyApi.getUserPlaylists();
          return JSON.stringify(playlists.map(p => ({
            id: p.id,
            name: p.name,
            total_tracks: p.tracks.total,
            public: p.public,
          })));
        },
      },
    ];
  }

  async chat(message: string): Promise<string> {
    const tools = this.getSpotifyTools();
    const response = await this.puter.chat(message, { tools });
    return response.content;
  }
}