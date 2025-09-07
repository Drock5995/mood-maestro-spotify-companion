"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPlaylistCard, SharedPlaylist } from '@/components/CommunityPlaylistCard';
import { useSpotify } from '@/context/SpotifyContext';
import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import PlaylistDetailView from '@/components/PlaylistDetailView';
import UserSearch from '@/components/UserSearch';

function CommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { spotifyApi, onPlayTrack } = useSpotify();

  const [playlists, setPlaylists] = useState<SharedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlaylist, setSelectedPlaylist] = useState<SharedPlaylist | null>(null);
  const [selectedPlaylistDetails, setSelectedPlaylistDetails] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [playlistArtists, setPlaylistArtists] = useState<SpotifyArtist[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchCommunityPlaylists = useCallback(async () => {
    setLoading(true);
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
        () => fetchCommunityPlaylists()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCommunityPlaylists]);

  const handlePlaylistSelect = useCallback(async (playlist: SharedPlaylist) => {
    if (!spotifyApi) return;
    
    setIsDetailLoading(true);
    setSelectedPlaylist(playlist);
    router.push(`/community?shared_id=${playlist.id}`, { scroll: false });

    try {
      const playlistDetails = await spotifyApi.getPlaylist(playlist.spotify_playlist_id);
      setSelectedPlaylistDetails(playlistDetails);

      const tracks = await spotifyApi.getPlaylistTracks(playlist.spotify_playlist_id);
      setPlaylistTracks(tracks);

      const artistIds = [...new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)))];
      if (artistIds.length > 0) {
        const artists = await spotifyApi.getSeveralArtists(artistIds);
        setPlaylistArtists(artists);
      } else {
        setPlaylistArtists([]);
      }
    } catch (err) {
      console.error('Failed to fetch playlist details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  }, [spotifyApi, router]);

  useEffect(() => {
    const sharedId = searchParams.get('shared_id');
    if (sharedId && playlists.length > 0) {
      const playlistToSelect = playlists.find(p => p.id === sharedId);
      if (playlistToSelect && (!selectedPlaylist || selectedPlaylist.id !== sharedId)) {
        handlePlaylistSelect(playlistToSelect);
      }
    } else if (!sharedId && selectedPlaylist) {
      setSelectedPlaylist(null);
      setSelectedPlaylistDetails(null);
      onPlayTrack(null);
    }
  }, [searchParams, playlists, selectedPlaylist, handlePlaylistSelect, onPlayTrack]);

  const handleBack = () => {
    router.push('/community', { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 px-2">
        <div>
          <h1 className="text-4xl font-extrabold text-white">
            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Playlists</span>
          </h1>
          <p className="text-gray-400 mt-2">Discover what others are listening to, or find a specific user.</p>
        </div>
        <UserSearch />
      </header>
      <div className={`flex-1 pr-2 relative ${selectedPlaylist ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-bold text-gray-400">It's quiet in here...</h3>
            <p className="text-gray-500 mt-2">Be the first to share a playlist from your dashboard!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.map((p, index) => (
              <CommunityPlaylistCard key={p.id} playlist={p} index={index} onClick={() => handlePlaylistSelect(p)} />
            ))}
          </div>
        )}
        <AnimatePresence>
          {selectedPlaylist && selectedPlaylistDetails && (
            <PlaylistDetailView
              key={selectedPlaylist.id}
              playlist={selectedPlaylistDetails}
              tracks={playlistTracks}
              artists={playlistArtists}
              onBack={handleBack}
              isShared={true}
              sharedPlaylistId={selectedPlaylist.id}
              onShareToggle={() => {}}
              onPlayTrack={onPlayTrack}
              isOwner={false}
              backButtonText="Back to Community"
            />
          )}
        </AnimatePresence>
        {isDetailLoading && (
           <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
           </div>
        )}
      </div>
    </>
  );
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityPageContent />
    </Suspense>
  );
}