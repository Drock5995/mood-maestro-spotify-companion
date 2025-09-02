'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist } from '@/lib/spotify';

const spotify = new SpotifyAPI();

export default function Dashboard() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Handle tokens from OAuth callback
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const expiresIn = searchParams.get('expires_in');

        if (accessToken) {
          spotify.setAccessToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('spotify_refresh_token', refreshToken);
          }
          if (expiresIn) {
            const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('spotify_token_expires_at', expiresAt.toString());
          }
          // Clean URL
          window.history.replaceState({}, '', '/dashboard');
        }

        // Check if user has valid token
        const storedToken = localStorage.getItem('spotify_access_token');
        if (!storedToken && !accessToken) {
          router.push('/');
          return;
        }

        // Fetch user data and playlists
        const [userData, playlistData] = await Promise.all([
          spotify.getCurrentUser(),
          spotify.getUserPlaylists()
        ]);

        setUser(userData);
        setPlaylists(playlistData);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError('Failed to load your music data. Please try logging in again.');
        spotify.clearTokens();
        setTimeout(() => router.push('/'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [router, searchParams]);

  const handleLogout = () => {
    spotify.clearTokens();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg">Loading your music...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Oops! Something went wrong</h2>
          <p className="text-red-200">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {user?.images?.[0] && (
              <img
                src={user.images[0].url}
                alt={user.display_name}
                className="w-12 h-12 rounded-full border-2 border-green-500"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Hey {user?.display_name || 'Ashley'}! 🎵
              </h1>
              <p className="text-green-200">
                Here are your playlists, ready for your next mood
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full transition-colors text-sm"
          >
            Logout
          </button>
        </div>

        {/* Playlists Grid */}
        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-green-500/50"
              >
                <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700">
                  {playlist.images?.[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-white text-lg mb-1 line-clamp-2">
                  {playlist.name}
                </h3>
                <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                  {playlist.description || 'No description'}
                </p>
                <p className="text-green-400 text-sm">
                  {playlist.tracks.total} track{playlist.tracks.total !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No playlists found</h3>
            <p className="text-gray-300">
              Create some playlists in Spotify and they'll appear here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}