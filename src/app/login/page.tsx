"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: [
          'user-read-private',
          'user-read-email',
          'playlist-read-private',
          'playlist-read-collaborative',
          'user-top-read',
          'playlist-modify-public',
          'playlist-modify-private',
        ].join(' '),
        redirectTo: 'https://playlisterr.netlify.app/dashboard',
      },
    });

    if (error) {
      console.error('Spotify login error:', error);
      alert(`Login failed: ${error.message}. Please try again.`);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const details = params.get('error_description');

    if (error) {
      let errorMessage = `Login failed: ${error}.`;
      if (details) {
        errorMessage += ` Details: ${decodeURIComponent(details)}`;
      }
      errorMessage += ` Please try again.`;
      alert(errorMessage);
      router.replace('/login');
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
            VibeSphere
          </h1>
        </div>
        <p className="text-lg sm:text-xl mb-8 text-gray-300 leading-relaxed">
          Your social Spotify hub. Analyze your playlists, share them with the community, and discover new music that matches your vibe.
        </p>
        <button
          onClick={handleLogin}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full text-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-70 shadow-lg"
        >
          Connect with Spotify
        </button>
      </div>
      <p className="text-gray-500 mt-8">Created by: David Spradlin</p>
    </main>
  );
}