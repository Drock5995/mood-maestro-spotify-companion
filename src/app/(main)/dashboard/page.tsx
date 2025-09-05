"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import { useSpotify } from '@/context/SpotifyContext';
import PlaylistCard from '@/components/PlaylistCard';
import PlaylistDetailView from '@/components/PlaylistDetailView';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { spotifyApi, playlists, loading } = useSpotify();

  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [playlistArtists, setPlaylistArtists] = useState<SpotifyArtist[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handlePlaylistSelect = useCallback(async (playlist: SpotifyPlaylist) => {
    if (!spotifyApi) return;
    
    setIsDetailLoading(true);
    setSelectedPlaylist(playlist);
    router.push(`/dashboard?playlist_id=${playlist.id}`, { scroll: false });

    try {
      const tracks = await spotifyApi.getPlaylistTracks(playlist.id);
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
    const playlistId = searchParams.get('playlist_id');
    if (playlistId && playlists.length > 0) {
      const playlistToSelect = playlists.find(p => p.id === playlistId);
      if (playlistToSelect && (!selectedPlaylist || selectedPlaylist.id !== playlistId)) {
        handlePlaylistSelect(playlistToSelect);
      }
    }
  }, [searchParams, playlists, selectedPlaylist, handlePlaylistSelect]);

  const handleBack = () => {
    setSelectedPlaylist(null);
    router.push('/dashboard', { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Playlists</span>
          </h1>
          <p className="text-gray-400 mt-1">A collection of your saved and created playlists on Spotify.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search playlists..."
            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-64"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto pr-2 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist, index) => (
            <div key={playlist.id} onClick={() => handlePlaylistSelect(playlist)}>
              <PlaylistCard playlist={playlist} index={index} />
            </div>
          ))}
        </div>
        <AnimatePresence>
          {selectedPlaylist && (
            <PlaylistDetailView
              playlist={selectedPlaylist}
              tracks={playlistTracks}
              artists={playlistArtists}
              onBack={handleBack}
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

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}