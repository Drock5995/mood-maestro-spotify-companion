"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import Sidebar from '@/components/Sidebar';
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
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');

    if (accessToken && refreshToken && expiresIn) {
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);
      localStorage.setItem('spotify_token_expires_at', (Date.now() + parseInt(expiresIn) * 1000).toString());
      router.replace('/dashboard', undefined);
      const api = new SpotifyAPI(accessToken);
      setSpotifyApi(api);
    } else {
      const storedAccessToken = localStorage.getItem('spotify_access_token');
      const storedExpiresAt = localStorage.getItem('spotify_token_expires_at');
      if (storedAccessToken && storedExpiresAt && Date.now() < parseInt(storedExpiresAt)) {
        const api = new SpotifyAPI(storedAccessToken);
        setSpotifyApi(api);
      } else {
        router.push('/login');
      }
    }
  }, [searchParams, router]);

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
          if (err instanceof Error && err.message === 'Token expired') {
            router.push('/login');
          }
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [spotifyApi, router]);

  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
    if (!spotifyApi) return;
    
    setIsDetailLoading(true);
    setSelectedPlaylist(playlist);

    try {
      const tracks = await spotifyApi.getPlaylistTracks(playlist.id);
      setPlaylistTracks(tracks);

      if (tracks.length > 0) {
        const artistIds = [...new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)))];
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
      <div className="flex min-h-screen flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        <p className="mt-4 text-lg">Connecting to Spotify...</p>
      </div>
    );
  }

  if (error && !selectedPlaylist) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-white">
        <h1 className="text-3xl font-bold mb-4 text-red-400">Error</h1>
        <p className="text-lg mb-6 text-red-300">{error}</p>
        <button onClick={() => router.push('/login')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out">
          Try Logging In Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen p-4 gap-4 relative overflow-hidden">
      <Sidebar user={user} playlists={playlists} onPlaylistClick={handlePlaylistSelect} selectedPlaylistId={selectedPlaylist?.id} />
      <main className="flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-4xl font-extrabold text-white">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Playlist Connect</span>
          </h1>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-5 rounded-full transition duration-300 ease-in-out">
            Logout
          </button>
        </header>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist, index) => (
              <div key={playlist.id} onClick={() => handlePlaylistSelect(playlist)}>
                <PlaylistCard playlist={playlist} index={index} />
              </div>
            ))}
          </div>
        </div>
      </main>
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
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        <p className="mt-4 text-lg">Loading Dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}