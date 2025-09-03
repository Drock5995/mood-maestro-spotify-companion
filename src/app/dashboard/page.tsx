'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist, PlaylistWithTracks, MoodAnalysis } from '@/lib/spotify';
import { analyzePlaylistMood } from '@/lib/mood-analysis';
import { PlaylistMoodModal } from '@/components/PlaylistMoodModal';
import { supabase } from '@/integrations/supabase/client';

const spotify = new SpotifyAPI();

function DashboardContent() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [analyzingPlaylistId, setAnalyzingPlaylistId] = useState<string | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        if (accessToken) {
          spotify.setAccessToken(accessToken);
          const refreshToken = searchParams.get('refresh_token');
          const expiresIn = searchParams.get('expires_in');
          if (refreshToken) localStorage.setItem('spotify_refresh_token', refreshToken);
          if (expiresIn) {
            const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
            localStorage.setItem('spotify_token_expires_at', expiresAt.toString());
          }
          window.history.replaceState({}, '', '/dashboard');
        }

        if (!localStorage.getItem('spotify_access_token')) {
          router.push('/');
          return;
        }

        const [userData, playlistData] = await Promise.all([
          spotify.getCurrentUser(),
          spotify.getUserPlaylists(),
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

  const handleAnalyzePlaylist = async (playlist: SpotifyPlaylist) => {
    setAnalyzingPlaylistId(playlist.id);
    setError(null);

    try {
      const playlistWithDetails = await spotify.getPlaylistWithDetails(playlist.id);
      const initialAnalysis = analyzePlaylistMood(playlistWithDetails.audioFeatures || []);

      setSelectedPlaylist(playlistWithDetails);
      setMoodAnalysis({
        ...initialAnalysis,
        description: "Our AI is crafting a special description for this vibe...",
      });
      setShowMoodModal(true);

      // Asynchronously call the AI for a better description
      const { data, error: functionError } = await supabase.functions.invoke('openai-mood-description', {
        body: {
          moodData: initialAnalysis.audio_characteristics,
          primaryMood: initialAnalysis.overall_mood,
          playlistName: playlist.name,
        },
      });

      if (functionError) throw functionError;

      if (data.description) {
        setMoodAnalysis(prev => prev ? { ...prev, description: data.description } : null);
      }
    } catch (err) {
      console.error('Error during mood analysis:', err);
      // Fallback to the original, non-AI analysis if anything fails
      if (selectedPlaylist) {
        const fallbackAnalysis = analyzePlaylistMood(selectedPlaylist.audioFeatures || []);
        setMoodAnalysis(fallbackAnalysis);
      } else {
        setError('Failed to analyze playlist mood. Please try again.');
        setShowMoodModal(false);
      }
    } finally {
      setAnalyzingPlaylistId(null);
    }
  };

  const closeMoodModal = () => {
    setShowMoodModal(false);
    setSelectedPlaylist(null);
    setMoodAnalysis(null);
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-800">
      <div className="container mx-auto px-4 py-8">
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
                <p className="text-green-400 text-sm mb-3">
                  {playlist.tracks.total} track{playlist.tracks.total !== 1 ? 's' : ''}
                </p>
                
                <button
                  onClick={() => handleAnalyzePlaylist(playlist)}
                  disabled={!!analyzingPlaylistId}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  {analyzingPlaylistId === playlist.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>🎨</span>
                      <span>Analyze Mood</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-2">No playlists found</h3>
            <p className="text-gray-300">
              Create some playlists in Spotify and they&apos;ll appear here!
            </p>
          </div>
        )}
      </div>

      {selectedPlaylist && moodAnalysis && (
        <PlaylistMoodModal
          playlist={selectedPlaylist}
          analysis={moodAnalysis}
          isOpen={showMoodModal}
          onClose={closeMoodModal}
        />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-100 text-lg">Loading your music dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}