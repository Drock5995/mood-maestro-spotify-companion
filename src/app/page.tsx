'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSpotifyLogin = () => {
    setIsLoading(true);
    
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/callback`;
    // Added 'playlist-modify-public' to allow creating playlists for the user.
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read', // Required for accessing liked songs
      'user-top-read',
      'user-read-recently-played',
      'playlist-modify-public', // Required for creating public playlists
      'playlist-modify-private', // Good to have for creating private playlists
    ].join(' ');
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=spotify_auth&` +
      `show_dialog=true`; // This forces the consent screen to appear every time

    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Hey Ashley! 🎵
          </h1>
          <p className="text-xl text-green-200">
            Your personal music mood companion
          </p>
          <p className="text-gray-300 max-w-md mx-auto">
            Connect with Spotify to see your playlists and discover music that matches your vibe. 
            Because life&apos;s too short for songs that don&apos;t speak to your soul.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSpotifyLogin}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Connect with Spotify
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-400">
            We&apos;ll only access your playlists and profile info. 
            Your music taste secrets are safe with us. 🤐 
          </p>
        </div>
      </div>
    </div>
  );
}