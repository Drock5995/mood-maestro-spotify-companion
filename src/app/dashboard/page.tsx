'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist, PlaylistWithTracks, MoodAnalysis, SpotifyTrack, RecommendationOptions } from '@/lib/spotify';
import { analyzePlaylistMood, getPlaylistParametersFromPrompt } from '@/lib/mood-analysis';
import { PlaylistMoodModal } from '@/components/PlaylistMoodModal';

// Import new modular components
import { DashboardHeader } from '@/components/DashboardHeader';
import { LibraryDNASection } from '@/components/LibraryDNASection';
import { PlaylistToolsSection } from '@/components/PlaylistToolsSection';
import { UserPlaylistsSection } from '@/components/UserPlaylistsSection';

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
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // State for Library Analysis
  const [libraryAnalysis, setLibraryAnalysis] = useState<MoodAnalysis | null>(null);
  const [topArtists, setTopArtists] = useState<[string, number][]>([]);
  const [isAnalyzingLibrary, setIsAnalyzingLibrary] = useState(true);
  const [libraryAnalysisError, setLibraryAnalysisError] = useState<string | null>(null);

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

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeDashboard = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const expiresIn = searchParams.get('expires_in');
      const grantedScopes = searchParams.get('granted_scopes');

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
        setIsLoading(false);

        if (hasLibraryReadPermission) {
          analyzeLibrary();
        } else {
          setIsAnalyzingLibrary(false);
        }

      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setGeneralError('Failed to load your music data. Please try logging in again.');
        setIsLoading(false);
        setIsAnalyzingLibrary(false);
      }
    };

    const analyzeLibrary = async () => {
      setIsAnalyzingLibrary(true);
      setLibraryAnalysisError(null);
      setLibraryAnalysis(null);
      setTopArtists([]);

      try {
        const likedSongs = await spotify.getLikedSongs();

        if (likedSongs.length === 0) {
          setLibraryAnalysisError("You don't have any liked songs to analyze. Like some songs on Spotify to see your Library DNA!");
          return;
        }

        const artistCounts = likedSongs.reduce((acc, track) => {
          track.artists.forEach(artist => {
            acc[artist.name] = (acc[artist.name] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);
        const sortedArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
        setTopArtists(sortedArtists.slice(0, 5));

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
          setLibraryAnalysisError(errorMessage);
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
    setGeneralError(null);
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
    setGeneralError(null);
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
    setGeneralError(null);
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
      setGeneralError(null);
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
        <DashboardHeader user={user} onLogout={handleLogout} />

        {generalError && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8 text-center">
            <p>{generalError}</p>
          </div>
        )}

        <LibraryDNASection
          isAnalyzingLibrary={isAnalyzingLibrary}
          libraryAnalysis={libraryAnalysis}
          libraryAnalysisError={libraryAnalysisError}
          topArtists={topArtists}
        />

        <PlaylistToolsSection
          onGeneratePlaylist={handleGeneratePlaylist}
          isGenerating={isGenerating}
          generatedPlaylist={generatedPlaylist}
          generatedPlaylistName={generatedPlaylistName}
          userId={user?.id || null}
          onClearGeneratedPlaylist={() => setGeneratedPlaylist(null)}
          onFindSongs={handleFindSongs}
          onSavePlaylist={handleSavePlaylist}
          onClearTextToPlaylist={clearTextToPlaylist}
          isSearching={isSearching}
          isSavingPlaylist={isSavingPlaylist}
          foundTracks={foundTracks}
          notFound={notFound}
          playlistIsSaved={playlistIsSaved}
        />

        <UserPlaylistsSection
          playlists={playlists}
          onAnalyzePlaylist={handleAnalyzePlaylist}
          analyzingPlaylistId={analyzingPlaylistId}
        />
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