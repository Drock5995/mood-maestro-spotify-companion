"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Music, Users, BarChart2 } from 'lucide-react';
import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import { useSpotify } from '@/context/SpotifyContext';
import PlaylistCard from '@/components/PlaylistCard';
import PlaylistDetailView from '@/components/PlaylistDetailView';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const gradients = [
  ['#8B5CF6', '#3B82F6'], ['#EC4899', '#F97316'], ['#10B981', '#14B8A6'],
  ['#6366F1', '#8B5CF6'], ['#EF4444', '#F59E0B'],
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { spotifyApi, playlists, loading, session, user, onPlayTrack } = useSpotify();

  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [playlistArtists, setPlaylistArtists] = useState<SpotifyArtist[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [sharedPlaylistsMap, setSharedPlaylistsMap] = useState<Map<string, string>>(new Map());
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [loadingTopArtists, setLoadingTopArtists] = useState(true);

  useEffect(() => {
    const fetchSharedPlaylists = async () => {
      if (session?.user) {
        const { data } = await supabase
          .from('shared_playlists')
          .select('id, spotify_playlist_id')
          .eq('user_id', session.user.id);
        if (data) {
          const newMap = new Map<string, string>();
          data.forEach(p => newMap.set(p.spotify_playlist_id, p.id));
          setSharedPlaylistsMap(newMap);
        }
      }
    };
    fetchSharedPlaylists();
  }, [session]);

  useEffect(() => {
    const fetchTopArtists = async () => {
      if (spotifyApi) {
        setLoadingTopArtists(true);
        try {
          const artists = await spotifyApi.getUserTopArtists(5);
          setTopArtists(artists);
        } catch (error) {
          console.error("Error fetching top artists:", error);
          toast.error("Failed to load top artists.");
        } finally {
          setLoadingTopArtists(false);
        }
      }
    };
    fetchTopArtists();
  }, [spotifyApi]);

  const totalSongs = useMemo(() => playlists.reduce((sum, playlist) => sum + playlist.tracks.total, 0), [playlists]);
  const topGenres = useMemo(() => {
    const genreCounts = topArtists.flatMap(a => a.genres).reduce((acc, g) => ({ ...acc, [g]: (acc[g] || 0) + 1 }), {} as Record<string, number>);
    return Object.entries(genreCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), count }));
  }, [topArtists]);

  const handleShareToggle = async (playlist: SpotifyPlaylist) => {
    if (!session?.user) return;
    const isCurrentlyShared = sharedPlaylistsMap.has(playlist.id);
    const newMap = new Map(sharedPlaylistsMap);
    const operationPromise = new Promise(async (resolve, reject) => {
      if (isCurrentlyShared) {
        const { error } = await supabase.from('shared_playlists').delete().match({ user_id: session.user.id, spotify_playlist_id: playlist.id });
        if (error) reject(error); else { newMap.delete(playlist.id); setSharedPlaylistsMap(newMap); resolve('un-shared'); }
      } else {
        const { data, error } = await supabase.from('shared_playlists').insert({ user_id: session.user.id, spotify_playlist_id: playlist.id, playlist_name: playlist.name, playlist_cover_url: playlist.images?.[0]?.url }).select('id, spotify_playlist_id').single();
        if (error) reject(error); else if (data) { newMap.set(data.spotify_playlist_id, data.id); setSharedPlaylistsMap(newMap); resolve('shared'); }
      }
    });
    toast.promise(operationPromise, { loading: isCurrentlyShared ? 'Un-sharing...' : 'Sharing...', success: (status) => `Playlist successfully ${status}!`, error: (err) => `Error: ${err.message}` });
  };

  const handlePlaylistSelect = useCallback(async (playlist: SpotifyPlaylist) => {
    if (!spotifyApi) return;
    setIsDetailLoading(true);
    setSelectedPlaylist(playlist);
    router.push(`/dashboard?playlist_id=${playlist.id}`, { scroll: false });
    try {
      const tracks = await spotifyApi.getPlaylistTracks(playlist.id);
      setPlaylistTracks(tracks);
      const artistIds = [...new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)))];
      if (artistIds.length > 0) {
        const artists = await spotifyApi.getSeveralArtists(artistIds);
        setPlaylistArtists(artists);
      } else setPlaylistArtists([]);
    } catch (err) { console.error('Failed to fetch playlist details:', err); } finally { setIsDetailLoading(false); }
  }, [spotifyApi, router]);

  useEffect(() => {
    const playlistId = searchParams.get('playlist_id');
    if (playlistId && playlists.length > 0) {
      const playlistToSelect = playlists.find(p => p.id === playlistId);
      if (playlistToSelect && (!selectedPlaylist || selectedPlaylist.id !== playlistId)) handlePlaylistSelect(playlistToSelect);
    } else if (!playlistId && selectedPlaylist) { setSelectedPlaylist(null); onPlayTrack(null); }
  }, [searchParams, playlists, selectedPlaylist, handlePlaylistSelect, onPlayTrack]);

  const handleBack = () => router.push('/dashboard', { scroll: false });

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>;

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}><defs>{gradients.map((grad, index) => <linearGradient id={`dashboardColor${index}`} x1="0" y1="0" x2="1" y2="0" key={index}><stop offset="0%" stopColor={grad[0]} /><stop offset="100%" stopColor={grad[1]} /></linearGradient>)}</defs></svg>
      <header className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2">Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{user?.display_name || 'VibeSphere User'}</span>!</h1>
        <p className="text-gray-400 text-lg">Here's a summary of your Spotify activity.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <motion.div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center space-x-4 transition-all duration-300 hover:bg-white/10 hover:border-purple-400/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Music className="w-8 h-8 text-purple-400 flex-shrink-0" />
          <div><p className="text-gray-400 text-sm">Total Playlists</p><h3 className="text-3xl font-bold text-white">{playlists.length}</h3></div>
        </motion.div>
        <motion.div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center space-x-4 transition-all duration-300 hover:bg-white/10 hover:border-pink-400/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Users className="w-8 h-8 text-pink-400 flex-shrink-0" />
          <div><p className="text-gray-400 text-sm">Total Songs</p><h3 className="text-3xl font-bold text-white">{totalSongs}</h3></div>
        </motion.div>
        <motion.div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col transition-all duration-300 hover:bg-white/10 hover:border-blue-400/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="flex items-center space-x-4 mb-2"><BarChart2 className="w-8 h-8 text-blue-400 flex-shrink-0" /><h3 className="text-xl font-bold text-white">Top Artists</h3></div>
          {loadingTopArtists ? <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div></div> : <ul className="text-gray-300 text-sm space-y-1">{topArtists.map((artist, idx) => <li key={artist.id} className="truncate">{idx + 1}. {artist.name}</li>)}</ul>}
        </motion.div>
        <motion.div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col transition-all duration-300 hover:bg-white/10 hover:border-emerald-400/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <div className="flex items-center space-x-4 mb-2"><BarChart2 className="w-8 h-8 text-emerald-400 flex-shrink-0" /><h3 className="text-xl font-bold text-white">Top Genres</h3></div>
          {loadingTopArtists ? <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500"></div></div> : <div style={{ width: '100%', height: 100 }}><ResponsiveContainer><BarChart data={topGenres} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" hide /><Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1A202C', border: 'none', borderRadius: '10px' }} /><Bar dataKey="count" barSize={10} radius={[0, 5, 5, 0]}>{topGenres.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#dashboardColor${index % gradients.length})`} />)}</Bar></BarChart></ResponsiveContainer></div>}
        </motion.div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div><h2 className="text-3xl sm:text-4xl font-extrabold text-white">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Playlists</span></h2><p className="text-gray-400 mt-1">A collection of your saved and created playlists on Spotify.</p></div>
        <div className="relative w-full sm:w-64">
          <input type="text" placeholder="Search playlists..." className="bg-white/5 border-2 border-transparent focus:border-purple-500 rounded-full py-2.5 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all w-full" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>
      <div className={`flex-1 pr-2 relative ${selectedPlaylist ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {playlists.map((playlist, index) => <div key={playlist.id} onClick={() => handlePlaylistSelect(playlist)}><PlaylistCard playlist={playlist} index={index} /></div>)}
        </div>
        <AnimatePresence>{selectedPlaylist && <PlaylistDetailView key={selectedPlaylist.id} playlist={selectedPlaylist} tracks={playlistTracks} artists={playlistArtists} onBack={handleBack} isShared={sharedPlaylistsMap.has(selectedPlaylist.id)} sharedPlaylistId={sharedPlaylistsMap.get(selectedPlaylist.id) || null} onShareToggle={() => handleShareToggle(selectedPlaylist)} onPlayTrack={onPlayTrack} isOwner={true} backButtonText="Back to Dashboard" />}</AnimatePresence>
        {isDetailLoading && <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div></div>}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}