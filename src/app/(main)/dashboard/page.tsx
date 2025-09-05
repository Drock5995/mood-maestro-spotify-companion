"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import PlaylistCard from '@/components/PlaylistCard';
import PlaylistDetailView from '@/components/PlaylistDetailView';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spotifyApi, setSpotifyApi] = useState<SpotifyAPI | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for detail view
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [playlistArtists, setPlaylistArtists] = useState<SpotifyArtist[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    // Token handling is now in layout, just initialize API client
    const storedAccessToken = localStorage.getItem('spotify_access_token');
    if (storedAccessToken) {
      const api = new SpotifyAPI(storedAccessToken);
      setSpotifyApi(api);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (spotifyApi) {
        try {
          const [currentUser, userPlaylists] = await Promise.all([
            spotifyApi.getCurrentUser(),
            spotifyApi.getUserPlaylists(),
          ]);
          setUser(currentUser);
          setPlaylists(userPlaylists);
        } catch (err) {
          console.error('Failed to fetch Spotify data:', err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [spotifyApi]);

  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
    if (!spotifyApi) return;
    
    setIsDetailLoading(true);
    setSelectedPlaylist(playlist);

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
      setError('Could not load playlist details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleLogout = () => {
    if (spotifyApi) spotifyApi.clearTokens();
    localStorage.clear();
    router.push('/login');
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
      <header className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-4xl font-extrabold text-white">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Playlist Connect</span>
        </h1>
        <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-5 rounded-full transition duration-300 ease-in-out">
          Logout
        </button>
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
          {selectedPlaylist && !isDetailLoading && (
            <PlaylistDetailView
              playlist={selectedPlaylist}
              tracks={playlistTracks}
              artists={playlistArtists}
              onBack={() => setSelectedPlaylist(null)}
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
  // The Suspense boundary is now in the layout
  return <DashboardContent />;
}