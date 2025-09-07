"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';

export interface SongSuggestion {
  id: string;
  spotify_track_id: string;
  spotify_track_name: string;
  spotify_artist_name: string;
  spotify_album_cover_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  suggester_user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SuggestionManagerProps {
  sharedPlaylistId: string;
  spotifyPlaylistId: string;
}

export default function SuggestionManager({ sharedPlaylistId, spotifyPlaylistId }: SuggestionManagerProps) {
  const { spotifyApi } = useSpotify();
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    const { data } = await supabase
      .from('song_suggestions')
      .select('*, profiles(display_name, avatar_url)')
      .eq('shared_playlist_id', sharedPlaylistId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setSuggestions(data as any);
    }
    setLoading(false);
  }, [sharedPlaylistId]);

  useEffect(() => {
    setLoading(true);
    fetchSuggestions();

    const channel = supabase
      .channel(`suggestions:${sharedPlaylistId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'song_suggestions', filter: `shared_playlist_id=eq.${sharedPlaylistId}` },
        () => fetchSuggestions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sharedPlaylistId, fetchSuggestions]);

  const handleSuggestion = async (suggestion: SongSuggestion, newStatus: 'accepted' | 'rejected') => {
    if (!spotifyApi) return;

    if (newStatus === 'accepted') {
      try {
        const trackUri = `spotify:track:${suggestion.spotify_track_id}`;
        await spotifyApi.addTrackToPlaylist(spotifyPlaylistId, trackUri);
      } catch (error) {
        console.error("Failed to add track to Spotify:", error);
        alert("Failed to add track. Your Spotify token might have expired. Please try logging out and back in.");
        return;
      }
    }

    const { data, error } = await supabase
      .from('song_suggestions')
      .update({ status: newStatus })
      .eq('id', suggestion.id)
      .select()
      .single();

    if (!error && data) {
      setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, status: newStatus } : s));
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-2xl font-bold text-gray-400">No Suggestions Yet</h3>
        <p className="text-gray-500 mt-2">When users suggest songs, they will appear here for your review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map(s => (
        <div key={s.id} className="flex items-center p-3 bg-white/5 rounded-lg">
          <Image src={s.spotify_album_cover_url || ''} alt={s.spotify_track_name} width={48} height={48} className="rounded mr-4" />
          <div className="flex-grow min-w-0">
            <p className="font-semibold truncate">{s.spotify_track_name}</p>
            <p className="text-sm text-gray-400 truncate">{s.spotify_artist_name}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span>Suggested by</span>
              <Link href={`/profile/${s.suggester_user_id}`} className="flex items-center space-x-1 hover:underline">
                <Image src={s.profiles?.avatar_url || ''} alt={s.profiles?.display_name || 'user'} width={16} height={16} className="rounded-full" />
                <span>{s.profiles?.display_name}</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {s.status === 'pending' ? (
              <>
                <button onClick={() => handleSuggestion(s, 'accepted')} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 transition-colors"><Check size={18} /></button>
                <button onClick={() => handleSuggestion(s, 'rejected')} className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"><X size={18} /></button>
              </>
            ) : (
              <div className={`flex items-center space-x-2 text-sm font-semibold px-3 py-1 rounded-full ${
                s.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {s.status === 'accepted' ? <Check size={14} /> : <X size={14} />}
                <span>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}