'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist, PlaylistWithTracks, MoodAnalysis, SpotifyTrack, RecommendationOptions } from '@/lib/spotify';
import { analyzePlaylistMood, getPlaylistParametersFromPrompt } from '@/lib/mood-analysis';
import { PlaylistMoodModal } from '@/components/PlaylistMoodModal';
import { MoodCreator } from '@/components/MoodCreator';
import { GeneratedPlaylist } from '@/components/GeneratedPlaylist';
import { TextToPlaylistCreator } from '@/components/TextToPlaylistCreator';
import { MoodCard } from '@/components/MoodCard';

const spotify = new SpotifyAPI();

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function DashboardContent() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null); // Renamed to generalError
  
  // State for Library Analysis
  const [libraryAnalysis, setLibraryAnalysis] = useState<MoodAnalysis | null>(null);
  const [topArtists, setTopArtists] = useState<[string, number][]>([]);
  const [isAnalyzingLibrary, setIsAnalyzingLibrary] = useState(true);
  const [libraryAnalysisError, setLibraryAnalysisError] = useState<string | null>(null); // New state for specific library error

  // State for Mood Analysis Modal
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [analyzingPlaylistId, setAnalyzingPlaylistId] = useState<string | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);

  // State for AI Mood DJ
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<SpotifyTrack[] | null>(null);
  const [generatedPlaylistName, setGeneratedPlaylistName] = useState('');

  // State for Text to Playlist
  const [isSearching, setIsSearching] = useState(false);
  const [foundTracks, setFoundTracks] = useState<SpotifyTrack[] | null>(null);
  const [notFound, setNotFound] = useState<string[] | null>(null);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [playlistIsSaved, setPlaylistIsSaved] = useState(false);

  // State to toggle between creators
  const [activeCreator, setActiveCreator] = useState<'mood' | 'text'>('mood');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeDashboard = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const expiresIn = searchParams.get('expires_in');
      const grantedScopes = searchParams.get('granted_scopes'); // Diagnostic: get granted scopes

      let hasLibraryReadPermission = true;
      if (grantedScopes) {
        console.log("Granted scopes from Spotify:", grantedScopes);
        if (!grantedScopes.includes('user-library-read')) {
          hasLibraryReadPermission = false;
          setLibraryAnalysisError("The 'user-library-read' permission was not granted by Spotify. This is required to analyze your liked songs. Please try revoking the app's access in your Spotify account settings, then log in again.");
        }
      }

      if (accessToken) {
        spotify.setAccessToken(accessToken, refreshToken || undefined, expiresIn ? parseInt(expiresIn) : undefined);
        window.history.replaceState({}, '', '/dashboard');
      }

      if (!localStorage.getItem('spotify_access_token')) {
        router.push('/');
        return;
      }

      try {
        const [userData, playlistData] = await Promise.all([
          spotify.getCurrentUser(),
          spotify.getUserPlaylists(),
        ]);
        setUser(userData);
        setPlaylists(playlistData);
        setIsLoading(false); // Basic data loaded, show page

        // Now, perform the library analysis only if we have permission
        if (hasLibraryReadPermission) {
          analyzeLibrary();
        } else {
          setIsAnalyzingLibrary(false); // Skip analysis if permission is missing
        }

      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setGeneralError('Failed to load your music data. Please try logging in again.');
        // The makeRequest function will handle redirecting, so we don't need to do it here.
        setIsLoading(false);
        setIsAnalyzingLibrary(false);
      }
    };

    const analyzeLibrary = async () => {
      setIsAnalyzingLibrary(true);
      setLibraryAnalysisError(null); // Clear previous library error
      setLibraryAnalysis(null); // Clear previous mood analysis
      setTopArtists([]); // Clear previous top artists

      try {
        const likedSongs = await spotify.getLikedSongs();

        if (likedSongs.length === 0) {
          setLibraryAnalysisError("You don't have any liked songs to analyze. Like some songs on Spotify to see your Library DNA!");
          return; // Exit if no liked songs
        }

        // Always calculate top artists if liked songs are available
        const artistCounts = likedSongs.reduce((acc, track) => {
          track.artists.forEach(artist => {
            acc[artist.name] = (acc[artist.name] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);
        const sortedArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
        setTopArtists(sortedArtists.slice(0, 5));

        // Attempt to get audio features
        try {
          const trackIds = likedSongs.map(t => t.id);
          const audioFeatures = await spotify.getAudioFeatures(trackIds);
          const analysis = analyzePlaylistMood(audioFeatures);
          setLibraryAnalysis(analysis);
        } catch (audioFeaturesError: unknown) {
          console.error("Could not fetch audio features for library:", audioFeaturesError);
          let errorMessage = "An unknown error occurred while fetching audio features for your liked songs. Mood analysis for your library is unavailable.";
          if (audioFeaturesError instanceof Error) {
            if (audioFeaturesError.message.includes('403 Forbidden')) {
              errorMessage = "Spotify denied access to audio features (403 Forbidden). This is often a temporary issue or requires a fresh authorization. Please try logging out, then go to your Spotify account settings (Apps section) to 'REMOVE ACCESS' for this app, and then log in again.";
            } else if (audioFeaturesError.message.includes('No access token available')) {
              errorMessage = "Your Spotify session has expired. Please log out and log back in.";
            } else {
              errorMessage = `Error fetching audio features: ${audioFeaturesError.message}. Mood analysis for your library is unavailable.`;
            }
          }
          setLibraryAnalysisError(errorMessage); // Set specific library error
        }

      } catch (e: unknown) {
        console.error("Could not analyze library (initial fetch of liked songs failed):", e);
        let errorMessage = "Failed to load your liked songs. Please try logging in again.";
        if (e instanceof Error) {
          if (e.message.includes('403 Forbidden')) {
            errorMessage = "Spotify denied access to your liked songs (403 Forbidden). This might be a temporary issue, or your Spotify session might need to be refreshed. Please try logging out and logging back in.";
          } else if (e.message.includes('No access token available')) {
            errorMessage = "Your Spotify session has expired. Please log out and log back in.";
          } else {
            errorMessage = `Error loading liked songs: ${e.message}.`;
          }
        }
        setLibraryAnalysisError(errorMessage);
      } finally {
        setIsAnalyzingLibrary(false);
      }
    };

    initializeDashboard();
  }, [router, searchParams]);

  const handleLogout = () => {
    spotify.clearTokens();
    router.push('/');
  };

  const handleAnalyzePlaylist = async (playlist: SpotifyPlaylist) => {
    setAnalyzingPlaylistId(playlist.id);
    setGeneralError(null); // Clear general error
    try {
      const playlistWithDetails = await spotify.getPlaylistWithDetails(playlist.id);
      const analysis = analyzePlaylistMood(playlistWithDetails.audioFeatures || []);
      setSelectedPlaylist(playlistWithDetails);
      setMoodAnalysis(analysis);
      setShowMoodModal(true);
    } catch (err) {
      console.error('Error during mood analysis:', err);
      setGeneralError('Failed to analyze playlist mood. Please try again.');
    } finally {
      setAnalyzingPlaylistId(null);
    }
  };

  const closeMoodModal = () => {
    setShowMoodModal(false);
    setSelectedPlaylist(null);
    setMoodAnalysis(null);
  };

  const handleGeneratePlaylist = async (prompt: string) => {
    setIsGenerating(true);
    setGeneratedPlaylist(null);
    setGeneratedPlaylistName('');
    setGeneralError(null); // Clear general error
    try {
      const { playlistName, recommendationOptions } = getPlaylistParametersFromPrompt(prompt);
      setGeneratedPlaylistName(playlistName);
      const finalOptions: RecommendationOptions = { ...recommendationOptions, limit: 40 };
      if (!finalOptions.seed_genres?.length) {
        const likedSongs = await spotify.getLikedSongs();
        if (likedSongs.length > 0) {
          const likedSongsForSeeding = shuffleArray(likedSongs).slice(0, 2);
          finalOptions.seed_tracks = likedSongsForSeeding.map(t => t.id);
          finalOptions.seed_artists = likedSongsForSeeding.flatMap(t => t.artists.map(a => a.id)).slice(0, 1);
        }
      }
      if (!(finalOptions.seed_artists?.length || finalOptions.seed_genres?.length || finalOptions.seed_tracks?.length)) {
        finalOptions.seed_genres = ['pop', 'indie'];
      }
      const { tracks: recommendedTracks } = await spotify.getRecommendations(finalOptions);
      const likedSongs = await spotify.getLikedSongs();
      const likedSongsToAdd = likedSongs.length > 0 ? shuffleArray(likedSongs).slice(0, 10) : [];
      const finalPlaylist = shuffleArray([...likedSongsToAdd, ...recommendedTracks]);
      const uniqueTracks = Array.from(new Map(finalPlaylist.map(track => [track.id, track])).values());
      setGeneratedPlaylist(uniqueTracks.slice(0, 50));
    } catch (err) {
      console.error("Error generating playlist:", err);
      setGeneralError("Failed to generate playlist. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFindSongs = async (text: string) => {
    setIsSearching(true);
    setFoundTracks(null);
    setNotFound(null);
    setGeneralError(null); // Clear general error
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const searchPromises = lines.map(line => spotify.searchTracks(line, 1));
    try {
        const results = await Promise.all(searchPromises);
        const found: SpotifyTrack[] = [];
        const notFoundItems: string[] = [];
        results.forEach((result, index) => {
            if (result.length > 0) {
                found.push(result[0]);
            } else {
                notFoundItems.push(lines[index]);
            }
        });
        setFoundTracks(found);
        setNotFound(notFoundItems);
    } catch (err) {
        console.error("Error searching for tracks:", err);
        setGeneralError("An error occurred while searching for songs. Please try again.");
    } finally {
        setIsSearching(false);
    }
  };

  const handleSavePlaylist = async (name: string, tracks: SpotifyTrack[]) => {
      if (!user) {
          setGeneralError("User not found. Cannot save playlist.");
          return;
      }
      setIsSavingPlaylist(true);
      setGeneralError(null); // Clear general error
      try {
          const newPlaylist = await spotify.createPlaylist(user.id, name, `Created from text by Ashley's Music Mood App.`);
          const trackUris = tracks.map(track => track.uri);
          await spotify.addTracksToPlaylist(newPlaylist.id, trackUris);
          setPlaylistIsSaved(true);
      } catch (err) {
          console.error("Failed to save playlist:", err);
          setGeneralError("Oops! Couldn't save the playlist. Please try again.");
      } finally {
          setIsSavingPlaylist(false);
      }
  };

  const clearTextToPlaylist = () => {
      setFoundTracks(null);
      setNotFound(null);
      setPlaylistIsSaved(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {user?.images?.[0] && (
              <Image
                src={user.images[0].url}
                alt={user.display_name || 'User avatar'}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full border-2 border-green-500"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Hey {user?.display_name || 'Ashley'}! 🎵
              </h1>
              <p className="text-green-200">
                Welcome to your music dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full transition-colors text-sm"
          >
            Logout
          </button>
        </header>

        {generalError && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8 text-center">
            <p>{generalError}</p>
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Your Library DNA 🧬</h2>
          {isAnalyzingLibrary ? (
            <div className="text-center text-gray-300 p-8 bg-gray-800/50 rounded-xl">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              Analyzing your liked songs...
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {libraryAnalysis ? (
                <MoodCard analysis={libraryAnalysis} />
              ) : (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex items-center justify-center">
                  <p className="text-gray-400 text-center">
                    {libraryAnalysisError || "Mood analysis for your library is unavailable."}
                  </p>
                </div>
              )}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-4">Top Artists</h3>
                {topArtists.length > 0 ? (
                  <ul className="space-y-3">
                    {topArtists.map(([name, count]) => (
                      <li key={name} className="flex items-center justify-between text-white">
                        <span>{name}</span>
                        <span className="text-sm text-gray-400">{count} liked songs</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No top artists found from your liked songs.</p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Playlist Tools 🛠️</h2>
          <div className="flex border-b border-gray-700 mb-6">
            <button 
                onClick={() => setActiveCreator('mood')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${activeCreator === 'mood' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
            >
                ✨ AI Mood DJ
            </button>
            <button 
                onClick={() => setActiveCreator('text')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${activeCreator === 'text' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
            >
                📋 Create from Text
            </button>
          </div>

          {activeCreator === 'mood' && (
            <>
              {generatedPlaylist && user ? (
                <GeneratedPlaylist 
                  playlistName={generatedPlaylistName}
                  tracks={generatedPlaylist}
                  userId={user.id}
                  onClear={() => setGeneratedPlaylist(null)}
                />
              ) : (
                <MoodCreator onGenerate={handleGeneratePlaylist} isLoading={isGenerating} />
              )}
            </>
          )}

          {activeCreator === 'text' && (
            <TextToPlaylistCreator
              onFindSongs={handleFindSongs}
              onSavePlaylist={handleSavePlaylist}
              onClear={clearTextToPlaylist}
              isSearching={isSearching}
              isSaving={isSavingPlaylist}
              foundTracks={foundTracks}
              notFound={notFound}
              isSaved={playlistIsSaved}
            />
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold text-white mb-4">Your Playlists</h2>
          {playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-green-500/50"
                >
                  <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700 relative">
                    {playlist.images?.[0] ? (
                      <Image
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover"
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
        </section>
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