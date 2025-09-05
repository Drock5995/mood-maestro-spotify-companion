"use client";

import { useEffect, useState, Suspense, ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist } from '@/lib/spotify';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { SpotifyContext } from '@/context/SpotifyContext';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import AudioPlayer from '@/components/AudioPlayer'; // Import the new AudioPlayer

function MainLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [spotifyApi, setSpotifyApi] = useState<SpotifyAPI | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPlayingTrackPreviewUrl, setCurrentPlayingTrackPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.provider_token) {
        localStorage.setItem('spotify_access_token', session.provider_token);
        const api = new SpotifyAPI(session.provider_token);
        setSpotifyApi(api);
      } else if (!session) {
        localStorage.removeItem('spotify_access_token');
        router.push('/login');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        if (session.provider_token) {
          localStorage.setItem('spotify_access_token', session.provider_token);
          const api = new SpotifyAPI(session.provider_token);
          setSpotifyApi(api);
        }
      } else {
        setLoading(false);
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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
            await supabase.auth.signOut();
          }
        } finally {
          setLoading(false);
        }
      }
    };

    if (session) {
      fetchData();
    }
  }, [spotifyApi, session, router]);

  const handlePlayTrack = (previewUrl: string | null) => {
    setCurrentPlayingTrackPreviewUrl(previewUrl);
  };

  const contextValue = { spotifyApi, user, playlists, loading, error, session, onPlayTrack: handlePlayTrack };
  const playlistId = searchParams.get('playlist_id');

  if (loading && !user) {
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
        <button onClick={() => supabase.auth.signOut()} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out">
          Try Logging In Again
        </button>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // This comment is added to force re-compilation and address a persistent build error.
  return (
    <SpotifyContext.Provider value={contextValue}>
      <div className="h-screen bg-black/20 lg:p-4 lg:flex lg:gap-4 pb-16"> {/* Added pb-16 for player */}
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <Sidebar 
            onPlaylistClick={(p) => router.push(`/dashboard?playlist_id=${p.id}`)}
            selectedPlaylistId={playlistId}
          />
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-full w-72 z-50 lg:hidden overflow-y-auto"
              >
                <Sidebar 
                  onPlaylistClick={(p) => router.push(`/dashboard?playlist_id=${p.id}`)}
                  selectedPlaylistId={playlistId}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
          <main className={`flex-1 flex flex-col relative bg-black/30 backdrop-blur-lg lg:rounded-2xl lg:border lg:border-white/10 p-4 sm:p-6 ${isSidebarOpen ? 'overflow-y-hidden lg:overflow-y-auto' : 'overflow-y-auto'}`}>
            {children}
          </main>
        </div>
      </div>
      <AudioPlayer src={currentPlayingTrackPreviewUrl} onEnded={() => setCurrentPlayingTrackPreviewUrl(null)} />
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