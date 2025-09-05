"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist } from '@/lib/spotify';

// Component to handle the actual dashboard content, wrapped in Suspense
function DashboardContent() {
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
    const grantedScopes = searchParams.get('granted_scopes');

    if (accessToken && refreshToken && expiresIn) {
      // Store tokens in localStorage for client-side persistence
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);
      localStorage.setItem('spotify_token_expires_at', (Date.now() + parseInt(expiresIn) * 1000).toString());
      localStorage.setItem('spotify_granted_scopes', grantedScopes || '');

      // Clear tokens from URL for cleaner UX and security
      router.replace('/dashboard', undefined);

      const api = new SpotifyAPI(accessToken);
      setSpotifyApi(api);
    } else {
      // Try to load from localStorage if not in URL
      const storedAccessToken = localStorage.getItem('spotify_access_token');
      const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
      const storedExpiresAt = localStorage.getItem('spotify_token_expires_at');

      if (storedAccessToken && storedRefreshToken && storedExpiresAt && Date.now() < parseInt(storedExpiresAt)) {
        const api = new SpotifyAPI(storedAccessToken);
        setSpotifyApi(api);
      } else {
        // No valid tokens, redirect to login
        router.push('/login');
        return;
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (spotifyApi) {
        try {
          const currentUser = await spotifyApi.getCurrentUser();
          setUser(currentUser);
          const userPlaylists = await spotifyApi.getUserPlaylists();
          setPlaylists(userPlaylists);
        } catch (err) {
          console.error('Failed to fetch Spotify data:', err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          // If token expired, redirect to login
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

  const handleLogout = () => {
    if (spotifyApi) {
      spotifyApi.clearTokens();
    }
    localStorage.clear(); // Clear all Spotify related items
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-900 to-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        <p className="mt-4 text-lg">Loading your Spotify data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-red-900 to-black text-white">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-lg mb-6">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out"
        >
          Try Logging In Again
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
          <h1 className="text-4xl font-extrabold text-green-400">
            Dashboard 🎨
          </h1>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out"
          >
            Logout
          </button>
        </header>

        {user && (
          <section className="mb-8 bg-gray-800 bg-opacity-70 p-6 rounded-lg shadow-lg flex items-center space-x-4">
            {user.images && user.images.length > 0 && (
              <Image
                src={user.images[0].url}
                alt={user.display_name || 'User'}
                width={80}
                height={80}
                className="rounded-full border-2 border-green-500"
              />
            )}
            <div>
              <h2 className="text-3xl font-bold mb-1">Welcome, {user.display_name || user.id}!</h2>
              <p className="text-gray-300">{user.email}</p>
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-green-300">Your Playlists 🎶</h2>
          {playlists.length === 0 ? (
            <p className="text-gray-400">No playlists found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="bg-gray-800 bg-opacity-70 p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                  {playlist.images && playlist.images.length > 0 && (
                    <Image
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      width={200}
                      height={200}
                      className="w-full h-48 object-cover rounded-md mb-3"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-white mb-1">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                  {playlist.description && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">{playlist.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4 text-green-300">Music Analysis (Coming Soon!) 📊</h2>
          <div className="bg-gray-800 bg-opacity-70 p-6 rounded-lg shadow-lg">
            <p className="text-gray-300">
              This section will feature detailed analysis of your music, moods, and more!
              Stay tuned for exciting insights.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

// Wrap DashboardContent in Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-900 to-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        <p className="mt-4 text-lg">Preparing dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}