"use client";

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist, SpotifyTrack } from '@/lib/spotify';

// Component to handle the actual dashboard content, wrapped in Suspense
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spotifyApi, setSpotifyApi] = useState<SpotifyAPI | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');
    const grantedScopes = searchParams.get('granted_scopes');

    if (accessToken && refreshToken && expiresIn) {
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);
      localStorage.setItem('spotify_token_expires_at', (Date.now() + parseInt(expiresIn) * 1000).toString());
      localStorage.setItem('spotify_granted_scopes', grantedScopes || '');

      router.replace('/dashboard', undefined);

      const api = new SpotifyAPI(accessToken);
      setSpotifyApi(api);
    } else {
      const storedAccessToken = localStorage.getItem('spotify_access_token');
      const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
      const storedExpiresAt = localStorage.getItem('spotify_token_expires_at');

      if (storedAccessToken && storedRefreshToken && storedExpiresAt && Date.now() < parseInt(storedExpiresAt)) {
        const api = new SpotifyAPI(storedAccessToken);
        setSpotifyApi(api);
      } else {
        router.push('/login');
        return;
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (spotifyApi) {
        try {
          const currentUser = await spotifyApi.getCurrentUser();
          setUser(currentUser);
          const userPlaylists = await spotifyApi.getUserPlaylists();
          setPlaylists(userPlaylists);
        } catch (err) {
          console.error('Failed to fetch Spotify data:', err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          if (err instanceof Error && err.message === 'Token expired') {
            router.push('/login');
          }
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [spotifyApi, router]);

  const fetchPlaylistDetails = async (playlist: SpotifyPlaylist) => {
    if (!spotifyApi) return;
    setSelectedPlaylist(playlist);
    setAnalysisLoading(true);
    setPlaylistTracks([]);
    setError(null);

    try {
      const tracks = await spotifyApi.getPlaylistTracks(playlist.id);
      setPlaylistTracks(tracks);
    } catch (err) {
      console.error('Failed to fetch playlist details:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching playlist details.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleLogout = () => {
    if (spotifyApi) {
      spotifyApi.clearTokens();
    }
    localStorage.clear();
    router.push('/login');
  };

  const analysisData = useMemo(() => {
    if (playlistTracks.length === 0) return null;

    const totalTracks = playlistTracks.length;
    const explicitTracks = playlistTracks.filter(track => track.explicit).length;
    const explicitPercentage = (explicitTracks / totalTracks) * 100;
    const averagePopularity = playlistTracks.reduce((sum, track) => sum + track.popularity, 0) / totalTracks;
    const uniqueArtists = new Set(playlistTracks.flatMap(track => track.artists.map(artist => artist.name))).size;

    let moodDescription = `This playlist contains ${totalTracks} tracks by ${uniqueArtists} unique artists. `;

    if (explicitTracks > 0) {
      moodDescription += `Approximately ${explicitPercentage.toFixed(0)}% of the tracks contain explicit content, suggesting a potentially mature or edgy vibe. `;
    } else {
      moodDescription += `It appears to be free of explicit content, indicating a generally clean listening experience. `;
    }

    if (averagePopularity > 75) {
      moodDescription += `With a high average popularity score of ${averagePopularity.toFixed(0)}, this playlist is likely filled with well-known hits and trending songs, perfect for an energetic or widely appealing mood.`;
    } else if (averagePopularity > 50) {
      moodDescription += `With an average popularity score of ${averagePopularity.toFixed(0)}, it offers a balanced mix of popular and moderately known tracks, suitable for a diverse and engaging listening experience.`;
    } else if (averagePopularity > 25) {
      moodDescription += `With an average popularity score of ${averagePopularity.toFixed(0)}, this playlist leans towards more niche or discovery-oriented tracks, potentially offering a unique and reflective mood.`;
    } else {
      moodDescription += `With a lower average popularity score of ${averagePopularity.toFixed(0)}, this playlist seems to feature more obscure or deep-cut tracks, ideal for focused listening or exploring new sounds.`;
    }

    return {
      totalTracks,
      explicitTracks,
      explicitPercentage,
      averagePopularity,
      uniqueArtists,
      moodDescription,
    };
  }, [playlistTracks]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-900 to-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        <p className="mt-4 text-lg">Loading your Spotify data...</p>
      </div>
    );
  }

  if (error && !analysisLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-red-900 to-black text-white">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-lg mb-6">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out"
        >
          Try Logging In Again
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-black text-white p-6 sm:p-8 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-700">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-400 mb-4 sm:mb-0">
            Dashboard 🎨
          </h1>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
          >
            Logout
          </button>
        </header>

        {user && (
          <section className="mb-10 bg-gray-800 bg-opacity-70 p-6 rounded-xl shadow-lg flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {user.images && user.images.length > 0 && (
              <Image
                src={user.images[0].url}
                alt={user.display_name || 'User'}
                width={96}
                height={96}
                className="rounded-full border-4 border-green-500 shadow-md"
              />
            )}
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold mb-1 text-white">Welcome, {user.display_name || user.id}!</h2>
              <p className="text-gray-300 text-lg">{user.email}</p>
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-3xl font-bold mb-6 text-green-300">Your Playlists 🎶</h2>
          {playlists.length === 0 ? (
            <p className="text-gray-400 text-lg">No playlists found. Connect to Spotify to see your playlists here!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {playlists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className={`bg-gray-800 bg-opacity-70 p-4 rounded-xl shadow-md hover:shadow-xl hover:bg-gray-700 transition-all duration-300 cursor-pointer 
                              ${selectedPlaylist?.id === playlist.id ? 'border-2 border-green-500 ring-2 ring-green-500' : 'border border-transparent'}`}
                  onClick={() => fetchPlaylistDetails(playlist)}
                >
                  {playlist.images && playlist.images.length > 0 && (
                    <Image
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      width={250}
                      height={250}
                      className="w-full h-48 object-cover rounded-lg mb-3 shadow-sm"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-white mb-1 truncate">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                  {playlist.description && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">{playlist.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6 text-green-300">Playlist Vibe Analysis 📊</h2>
          <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl shadow-lg">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
                <p className="mt-4 text-xl text-green-300">Analyzing {selectedPlaylist?.name || 'playlist'} vibe...</p>
              </div>
            ) : selectedPlaylist && analysisData ? (
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold mb-4 text-green-400">Vibe for &quot;{selectedPlaylist.name}&quot;</h3>
                <p className="text-lg text-gray-200 mb-8 leading-relaxed">{analysisData.moodDescription}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-gray-600">
                    <p className="text-gray-300 text-sm">Total Tracks</p>
                    <p className="text-white text-2xl font-bold mt-1">{analysisData.totalTracks}</p>
                  </div>
                  <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-gray-600">
                    <p className="text-gray-300 text-sm">Unique Artists</p>
                    <p className="text-white text-2xl font-bold mt-1">{analysisData.uniqueArtists}</p>
                  </div>
                  <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-gray-600">
                    <p className="text-gray-300 text-sm">Explicit Content</p>
                    <p className="text-white text-2xl font-bold mt-1">{analysisData.explicitPercentage.toFixed(0)}%</p>
                  </div>
                  <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-gray-600">
                    <p className="text-gray-300 text-sm">Average Popularity</p>
                    <p className="text-white text-2xl font-bold mt-1">{analysisData.averagePopularity.toFixed(0)}</p>
                  </div>
                </div>

                <h4 className="text-xl sm:text-2xl font-semibold mt-6 mb-4 text-green-400">Tracks in &quot;{selectedPlaylist.name}&quot; ({playlistTracks.length})</h4>
                <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {playlistTracks.length > 0 ? (
                    <ul className="space-y-3">
                      {playlistTracks.map(track => (
                        <li key={track.id} className="flex items-center space-x-4 bg-gray-700 bg-opacity-50 p-3 rounded-lg hover:bg-gray-600 transition-colors duration-200">
                          {track.album?.images?.[0]?.url && (
                            <Image
                              src={track.album.images[0].url}
                              alt={track.album.name}
                              width={48}
                              height={48}
                              className="rounded-md shadow-sm"
                            />
                          )}
                          <div>
                            <p className="text-white font-medium text-lg">{track.name}</p>
                            <p className="text-gray-400 text-sm">{track.artists.map(artist => artist.name).join(', ')}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-lg">No tracks found for this playlist.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-lg py-8 text-center">
                Select a playlist above to see its vibe analysis!
              </p>
            )}
            {error && analysisLoading && (
              <p className="text-red-400 mt-4 text-center">Error during analysis: {error}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// Wrap DashboardContent in Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-900 to-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        <p className="mt-4 text-lg">Preparing dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}