"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read', // Added this scope for audio features
    ].join(' ');

    if (!clientId) {
      console.error('Spotify Client ID is not set. Please check your .env.local file.');
      alert('Spotify Client ID is not configured.');
      return;
    }

    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=spotify_auth`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    // Check for error query parameter after redirect
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const details = params.get('details'); // Get the detailed error message

    if (error) {
      let errorMessage = `Login failed: ${error}.`;
      if (details) {
        errorMessage += ` Details: ${decodeURIComponent(details)}`;
      }
      errorMessage += ` Please try again.`;
      alert(errorMessage);
      // Clear the error from the URL
      router.replace('/login', undefined);
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-900 to-black text-white">
      <div className="text-center p-8 bg-gray-800 bg-opacity-70 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-5xl font-extrabold mb-6 text-green-400">
          Music Mood Maestro 🎵
        </h1>
        <p className="text-lg mb-8 text-gray-300">
          Connect with Spotify to get a detailed analysis of your music and discover new vibes!
        </p>
        <button
          onClick={handleLogin}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
        >
          Connect with Spotify
        </button>
      </div>
    </main>
  );
}