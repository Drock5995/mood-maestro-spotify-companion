"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPlaylistCard, SharedPlaylist } from '@/components/CommunityPlaylistCard';

export default function CommunityPage() {
  const [playlists, setPlaylists] = useState<SharedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommunityPlaylists = useCallback(async () => {
    const { data, error } = await supabase
      .from('shared_playlists')
      .select(`
        id,
        spotify_playlist_id,
        playlist_name,
        playlist_cover_url,
        user_id,
        profiles ( display_name, avatar_url ),
        playlist_likes ( user_id )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching community playlists:', error);
    } else if (data) {
      setPlaylists(data as unknown as SharedPlaylist[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCommunityPlaylists();

    const channel = supabase
      .channel('community-playlists')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_playlists' },
        () => {
          fetchCommunityPlaylists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCommunityPlaylists]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 px-2">
        <h1 className="text-4xl font-extrabold text-white">
          Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Playlists</span>
        </h1>
        <p className="text-gray-400 mt-2">Discover what others are listening to.</p>
      </header>
      <div className="flex-1 overflow-y-auto pr-2">
        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-bold text-gray-400">It's quiet in here...</h3>
            <p className="text-gray-500 mt-2">Be the first to share a playlist from your dashboard!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.map((p, index) => (
              <CommunityPlaylistCard key={p.id} playlist={p} index={index} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}