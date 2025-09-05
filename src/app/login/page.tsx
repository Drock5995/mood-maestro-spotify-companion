"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';

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
      'user-top-read',
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
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const details = params.get('details');

    if (error) {
      let errorMessage = `Login failed: ${error}.`;
      if (details) {
        errorMessage += ` Details: ${decodeURIComponent(details)}`;
      }
      errorMessage += ` Please try again.`;
      alert(errorMessage);
      router.replace('/login', undefined);
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-black -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="text-center p-8 sm:p-12 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full border border-white/10">
        <div className="flex justify-center items-center mb-6">
          <Music className="w-12 h-12 text-purple-400" />
          <h1 className="text-4xl sm:text-5xl font-extrabold ml-4 text-white tracking-tight">
            Music Mood Maestro
          </h1>
        </div>
        <p className="text-lg sm:text-xl mb-8 text-gray-300 leading-relaxed">
          Connect with Spotify to unlock personalized insights into your music, discover your top artists, and analyze your playlist vibes.
        </p>
        <button
          onClick={handleLogin}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full text-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-70 shadow-lg"
        >
          Connect with Spotify
        </button>
      </div>
    </main>
  );
}