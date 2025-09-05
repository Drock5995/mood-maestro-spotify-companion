"use client";

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SpotifyAPI, SpotifyUser, SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import PlaylistPoster from '@/components/PlaylistPoster';

// Helper function to format milliseconds to MM:SS
const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

// Component to handle the actual dashboard content, wrapped in Suspense
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spotifyApi, setSpotifyApi] = useState<SpotifyAPI | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [playlistArtists, setPlaylistArtists] = useState<SpotifyArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SpotifyTrack | 'release_date'; direction: 'ascending' | 'descending' } | null>(null);
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');

    if (accessToken && refreshToken && expiresIn) {
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);
      localStorage.setItem('spotify_token_expires_at', (Date.now() + parseInt(expiresIn) * 1000).toString());
      router.replace('/dashboard', undefined);
      const api = new SpotifyAPI(accessToken);
      setSpotifyApi(api);
    } else {
      const storedAccessToken = localStorage.getItem('spotify_access_token');
      const storedExpiresAt = localStorage.getItem('spotify_token_expires_at');
      if (storedAccessToken && storedExpiresAt && Date.now() < parseInt(storedExpiresAt)) {
        const api = new SpotifyAPI(storedAccessToken);
        setSpotifyApi(api);
      } else {
        router.push('/login');
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (spotifyApi) {
        try {
          const [currentUser, userPlaylists, userTopArtists] = await Promise.all([
            spotifyApi.getCurrentUser(),
            spotifyApi.getUserPlaylists(),
            spotifyApi.getUserTopArtists(10),
          ]);
          setUser(currentUser);
          setPlaylists(userPlaylists);
          setTopArtists(userTopArtists);
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
    setPlaylistArtists([]);
    setError(null);
    setSortConfig(null); // Reset sort on new playlist selection

    try {
      const tracks = await spotifyApi.getPlaylistTracks(playlist.id);
      setPlaylistTracks(tracks);

      if (tracks.length > 0) {
        const artistIds = [...new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)))];
        const artistDetails = await spotifyApi.getSeveralArtists(artistIds);
        setPlaylistArtists(artistDetails);
      }
    } catch (err) {
      console.error('Failed to fetch playlist details:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching playlist details.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleLogout = () => {
    if (spotifyApi) spotifyApi.clearTokens();
    localStorage.clear();
    router.push('/login');
  };

  const sortedTracks = useMemo(() => {
    let sortableTracks = [...playlistTracks];
    if (sortConfig !== null) {
      sortableTracks.sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        if (sortConfig.key === 'release_date') {
          aValue = new Date(a.album.release_date).getTime();
          bValue = new Date(b.album.release_date).getTime();
        } else {
          aValue = a[sortConfig.key as keyof SpotifyTrack];
          bValue = b[sortConfig.key as keyof SpotifyTrack];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTracks;
  }, [playlistTracks, sortConfig]);

  const requestSort = (key: keyof SpotifyTrack | 'release_date') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const analysisData = useMemo(() => {
    if (playlistTracks.length === 0) return null;

    const totalTracks = playlistTracks.length;
    const explicitTracks = playlistTracks.filter(track => track.explicit).length;
    const explicitPercentage = totalTracks > 0 ? (explicitTracks / totalTracks) * 100 : 0;
    const averagePopularity = totalTracks > 0 ? playlistTracks.reduce((sum, track) => sum + track.popularity, 0) / totalTracks : 0;
    const uniqueArtistsCount = new Set(playlistTracks.flatMap(track => track.artists.map(artist => artist.name))).size;

    const topArtistsInPlaylist = Object.entries(
      playlistTracks.flatMap(track => track.artists).reduce((acc, artist) => {
        acc[artist.name] = (acc[artist.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name]) => name);

    const releaseYears = playlistTracks.map(track => parseInt(track.album.release_date.substring(0, 4))).filter(year => !isNaN(year));
    const averageReleaseYear = releaseYears.length > 0 ? Math.round(releaseYears.reduce((sum, year) => sum + year, 0) / releaseYears.length) : 'N/A';

    const topGenres = Object.entries(
      playlistArtists.flatMap(artist => artist.genres).reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name]) => name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

    return {
      totalTracks,
      explicitPercentage,
      averagePopularity,
      uniqueArtistsCount,
      topArtistsInPlaylist,
      averageReleaseYear,
      topGenres,
    };
  }, [playlistTracks, playlistArtists]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-950 to-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        <p className="mt-4 text-lg text-green-300">Loading your Spotify data...</p>
      </div>
    );
  }

  if (error && !analysisLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-red-950 to-black text-white">
        <h1 className="text-3xl font-bold mb-4 text-red-400">Error</h1>
        <p className="text-lg mb-6 text-red-300">{error}</p>
        <button onClick={() => router.push('/login')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out">
          Try Logging In Again
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 to-black text-white p-6 sm:p-8 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-4 border-b border-gray-700">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-400 mb-4 sm:mb-0">Dashboard 🎨</h1>
          <button onClick={handleLogout} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
            Logout
          </button>
        </header>

        {user && (
          <section className="mb-12 bg-gray-900 bg-opacity-70 p-6 rounded-xl shadow-lg flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 border border-green-800">
            {user.images?.[0]?.url && <Image src={user.images[0].url} alt={user.display_name || 'User'} width={96} height={96} className="rounded-full border-4 border-green-500 shadow-md" />}
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold mb-1 text-white">Welcome, {user.display_name || user.id}!</h2>
              <p className="text-gray-300 text-lg">{user.email}</p>
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-green-300">Your Top Artists 🎤</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {topArtists.map((artist) => (
              <div key={artist.id} className="bg-gray-800 bg-opacity-70 p-4 rounded-xl shadow-md hover:shadow-xl hover:bg-gray-700 transition-all duration-300 cursor-pointer border border-transparent">
                {artist.images?.[0]?.url && <Image src={artist.images[0].url} alt={artist.name} width={250} height={250} className="w-full h-48 object-cover rounded-lg mb-3 shadow-sm" />}
                <h3 className="text-xl font-semibold text-white mb-1 truncate">{artist.name}</h3>
                <p className="text-gray-400 text-sm capitalize">{artist.genres.slice(0, 2).join(', ')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-green-300">Your Playlists 🎶</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist) => (
              <div key={playlist.id} className={`bg-gray-800 bg-opacity-70 p-4 rounded-xl shadow-md hover:shadow-xl hover:bg-gray-700 transition-all duration-300 cursor-pointer ${selectedPlaylist?.id === playlist.id ? 'border-2 border-green-500 ring-2 ring-green-500' : 'border border-transparent'}`} onClick={() => fetchPlaylistDetails(playlist)}>
                {playlist.images?.[0]?.url && <Image src={playlist.images[0].url} alt={playlist.name} width={250} height={250} className="w-full h-48 object-cover rounded-lg mb-3 shadow-sm" />}
                <h3 className="text-xl font-semibold text-white mb-1 truncate">{playlist.name}</h3>
                <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6 text-green-300">Playlist Deep Dive 📊</h2>
          <div className="bg-gray-900 bg-opacity-70 p-6 rounded-xl shadow-lg border border-green-800">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
                <p className="mt-4 text-xl text-green-300">Analyzing {selectedPlaylist?.name || 'playlist'}...</p>
              </div>
            ) : selectedPlaylist && analysisData ? (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-green-400 mb-4 sm:mb-0">Analysis for &quot;{selectedPlaylist.name}&quot;</h3>
                  <button
                    onClick={() => setShowPoster(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                  >
                    Generate Poster
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-green-300 font-bold mb-2">Key Stats</h4>
                    <p><strong>Avg. Popularity:</strong> {analysisData.averagePopularity.toFixed(0)}</p>
                    <p><strong>Avg. Release Year:</strong> {analysisData.averageReleaseYear}</p>
                    <p><strong>Explicit Content:</strong> {analysisData.explicitPercentage.toFixed(0)}%</p>
                    <p><strong>Unique Artists:</strong> {analysisData.uniqueArtistsCount}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-green-300 font-bold mb-2">Top Artists</h4>
                    <ul className="list-decimal list-inside">{analysisData.topArtistsInPlaylist.map(artist => <li key={artist}>{artist}</li>)}</ul>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-green-300 font-bold mb-2">Top Genres</h4>
                    <ul className="list-decimal list-inside">{analysisData.topGenres.map(genre => <li key={genre}>{genre}</li>)}</ul>
                  </div>
                </div>

                <h4 className="text-xl sm:text-2xl font-semibold mt-6 mb-4 text-green-400">Tracks ({playlistTracks.length})</h4>
                <div className="flex items-center space-x-2 sm:space-x-4 mb-4 text-sm sm:text-base">
                  <span className="font-semibold text-gray-300">Sort by:</span>
                  {['popularity', 'release_date', 'duration_ms'].map((key) => (
                    <button
                      key={key}
                      onClick={() => requestSort(key as keyof SpotifyTrack | 'release_date')}
                      className={`px-3 py-1 rounded-full transition-colors duration-200 ${sortConfig?.key === key ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                    >
                      {key.replace('_', ' ').replace('ms', '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      {sortConfig?.key === key && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                    </button>
                  ))}
                </div>

                <div className="max-h-96 overflow-y-auto pr-2">
                  <ul className="space-y-2">
                    {sortedTracks.map((track, index) => (
                      <li key={track.id + index} className="flex items-center space-x-4 bg-gray-800 bg-opacity-50 p-3 rounded-lg border border-gray-700">
                        <span className="text-gray-400 font-mono text-lg w-6 text-center">{index + 1}</span>
                        {track.album?.images?.[0]?.url && <Image src={track.album.images[0].url} alt={track.album.name} width={48} height={48} className="rounded-md shadow-sm" />}
                        <div className="flex-grow">
                          <p className="text-white font-medium">{track.name}</p>
                          <p className="text-gray-400 text-sm">{track.artists.map(artist => artist.name).join(', ')}</p>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-300">
                          <span className="w-20 hidden md:inline">Released: {track.album.release_date.substring(0, 4)}</span>
                          <span className="w-16 hidden sm:inline">Pop: {track.popularity}</span>
                          <span className="w-12 font-mono">{formatDuration(track.duration_ms)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-lg py-8 text-center">Select a playlist above for a deep dive analysis!</p>
            )}
          </div>
        </section>
      </div>
      {showPoster && selectedPlaylist && (
        <PlaylistPoster 
          playlist={selectedPlaylist} 
          tracks={playlistTracks} 
          onClose={() => setShowPoster(false)} 
        />
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-950 to-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        <p className="mt-4 text-lg text-green-300">Preparing dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}