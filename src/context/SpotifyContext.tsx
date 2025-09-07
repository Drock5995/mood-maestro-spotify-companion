"use client";

import { createContext, useContext } from 'react';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist } from '@/lib/spotify';
import { Session } from '@supabase/supabase-js';

export interface SpotifyContextType {
  spotifyApi: SpotifyAPI | null;
  user: SpotifyUser | null;
  playlists: SpotifyPlaylist[];
  loading: boolean;
  error: string | null;
  session: Session | null;
  onPlayTrack: (previewUrl: string | null) => void; // Added for audio playback
}

export const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};