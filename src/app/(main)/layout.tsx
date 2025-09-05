"use client";

import { useEffect, useState, Suspense, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist } from '@/lib/spotify';
import Sidebar from '@/components/Sidebar';
import { SpotifyContext } from '@/context/SpotifyContext';

function MainLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spotifyApi, setSpotifyApi] = useState<SpotifyAPI | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setLoading(true);
        setError(null);
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
            spotifyApi.clearTokens();
            router.push('/login');
          }
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [spotifyApi, router]);

  const contextValue = { spotifyApi, user, playlists, loading, error };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        <p className="mt-4 text-lg">Connecting to Spotify...</p>
      </div>
    );
  }

  if (error) {
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
    <SpotifyContext.Provider value={contextValue}>
      <div className="flex h-screen p-4 gap-4">
        <Sidebar 
          user={user} 
          playlists={playlists} 
          onPlaylistClick={(p) => router.push(`/dashboard?playlist_id=${p.id}`)}
        />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {children}
        </main>
      </div>
    </SpotifyContext.Provider>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        <p className="mt-4 text-lg">Loading App...</p>
      </div>
    }>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  );
}