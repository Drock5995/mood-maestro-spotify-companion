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
      'user-top-read', // Added scope for top artists
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-950 to-black text-white">
      <div className="text-center p-8 sm:p-12 bg-gray-900 bg-opacity-80 rounded-2xl shadow-2xl max-w-lg w-full border border-green-700">
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-green-400 tracking-tight">
          Music Mood Maestro 🎵
        </h1>
        <p className="text-lg sm:text-xl mb-8 text-gray-300 leading-relaxed">
          Connect with Spotify to unlock personalized insights into your music, discover your top artists, and analyze your playlist vibes.
        </p>
        <button
          onClick={handleLogin}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-70 shadow-lg"
        >
          Connect with Spotify
        </button>
      </div>
    </main>
  );
}