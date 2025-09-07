"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toPng } from 'html-to-image';
import { ArrowLeft, Music, Users, Share2, CheckCircle, Send, Play, Pause, Image as ImageIcon, GitPullRequest, Zap } from 'lucide-react';
import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';
import CommentCard, { CommentWithProfile } from './CommentCard';
import PlaylistPoster from './PlaylistPoster';
import SuggestionManager from './SuggestionManager';
import SongSuggester from './SongSuggester';
import toast from 'react-hot-toast';

interface PlaylistDetailViewProps {
  playlist: SpotifyPlaylist;
  tracks: SpotifyTrack[];
  artists: SpotifyArtist[];
  onBack: () => void;
  isShared: boolean;
  sharedPlaylistId: string | null;
  onShareToggle: () => void;
  onPlayTrack: (previewUrl: string | null) => void;
  isOwner?: boolean;
  backButtonText?: string;
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

const gradients = [
  ['#8B5CF6', '#3B82F6'], ['#EC4899', '#F97316'], ['#10B981', '#14B8A6'],
  ['#6366F1', '#8B5CF6'], ['#EF4444', '#F59E0B'],
];

export default function PlaylistDetailView({ playlist, tracks, artists, onBack, isShared, sharedPlaylistId, onShareToggle, onPlayTrack, isOwner = false, backButtonText = "Back" }: PlaylistDetailViewProps) {
  const { session } = useSpotify();
  const [activeTab, setActiveTab] = useState<'overview' | 'songs' | 'social' | 'poster' | 'suggestions'>('overview');
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPlayingTrackId, setCurrentPlayingTrackId] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDownloadPoster = useCallback(() => {
    if (posterRef.current === null) {
      return;
    }
    toPng(posterRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${playlist.name.replace(/[^a-zA-Z0-9]/g, '-')}-poster.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Oops, something went wrong!', err);
      });
  }, [playlist.name]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!sharedPlaylistId) {
        setComments([]);
        return;
      }
      const { data, error } = await supabase
        .from('playlist_comments')
        .select('id, comment_text, created_at, user_id, profiles(display_name, avatar_url)')
        .eq('shared_playlist_id', sharedPlaylistId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching comments:", error);
        toast.error("Could not load comments.");
      } else if (data) {
        const formattedComments: CommentWithProfile[] = data.map((comment: any) => ({
          ...comment,
          profiles: comment.profiles[0] || null,
        }));
        setComments(formattedComments);
      }
    };
    
    fetchComments();

    if (!sharedPlaylistId) return;

    const channel = supabase
      .channel(`playlist-comments:${sharedPlaylistId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'playlist_comments', filter: `shared_playlist_id=eq.${sharedPlaylistId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [sharedPlaylistId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user || !sharedPlaylistId) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('playlist_comments')
      .insert({
        user_id: session.user.id,
        shared_playlist_id: sharedPlaylistId,
        comment_text: newComment,
      });

    if (error) {
      console.error('Error posting comment:', error);
      toast.error("Failed to post comment.");
    } else {
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleTrackPlayToggle = (track: SpotifyTrack) => {
    if (currentPlayingTrackId === track.id) {
      onPlayTrack(null);
      setCurrentPlayingTrackId(null);
    } else if (track.preview_url) {
      onPlayTrack(track.preview_url);
      setCurrentPlayingTrackId(track.id);
    } else {
      console.log(`No preview available for ${track.name}`);
    }
  };

  const analysis = useMemo(() => {
    if (tracks.length === 0) return null;
    const totalDurationMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const avgPopularity = tracks.reduce((sum, track) => sum + track.popularity, 0) / tracks.length;
    const genreCounts = artists.flatMap(a => a.genres).reduce((acc, g) => ({ ...acc, [g]: (acc[g] || 0) + 1 }), {} as Record<string, number>);
    const topGenres = Object.entries(genreCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), count }));

    // New release decade analysis
    const decadeCounts = tracks.reduce((acc, track) => {
      const year = parseInt(track.album.release_date.substring(0, 4));
      if (!isNaN(year)) {
        const decade = Math.floor(year / 10) * 10;
        const decadeLabel = `${decade}s`;
        acc[decadeLabel] = (acc[decadeLabel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const releaseDecades = Object.entries(decadeCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([name, count]) => ({ name, count }));

    const explicitCount = tracks.filter(track => track.explicit).length;

    return { 
      totalDuration: formatDuration(totalDurationMs), 
      avgPopularity: avgPopularity.toFixed(0), 
      topGenres,
      releaseDecades,
      explicitCount,
    };
  }, [tracks, artists]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="tabpanel" id="overview-tabpanel" aria-labelledby="overview-tab">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 p-6 rounded-xl text-center"><h3 className="text-3xl sm:text-4xl font-bold">{tracks.length}</h3><p className="text-gray-400">Songs</p></div>
            <div className="bg-white/5 p-6 rounded-xl text-center"><h3 className="text-3xl sm:text-4xl font-bold">{analysis?.totalDuration}</h3><p className="text-gray-400">Total Duration</p></div>
            <div className="bg-white/5 p-6 rounded-xl text-center"><h3 className="text-3xl sm:text-4xl font-bold">{analysis?.avgPopularity}</h3><p className="text-gray-400">Avg. Popularity</p></div>
            <div className="bg-white/5 p-6 rounded-xl text-center"><h3 className="text-3xl sm:text-4xl font-bold">{analysis?.explicitCount}</h3><p className="text-gray-400">Explicit Tracks</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Top Genres</h3>
              <div style={{ width: '100%', height: 300 }} aria-label="Top Genres Chart">
                <ResponsiveContainer>
                  <BarChart data={analysis?.topGenres} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={120} tick={{ fill: '#A0AEC0' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1A202C', border: 'none', borderRadius: '10px' }} />
                    <Bar dataKey="count" barSize={20} radius={[0, 10, 10, 0]}>{analysis?.topGenres?.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#color${index % gradients.length})`} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Release Decades</h3>
              <div style={{ width: '100%', height: 300 }} aria-label="Release Decades Chart">
                <ResponsiveContainer>
                  <BarChart data={analysis?.releaseDecades} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={80} tick={{ fill: '#A0AEC0' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1A202C', border: 'none', borderRadius: '10px' }} />
                    <Bar dataKey="count" barSize={20} radius={[0, 10, 10, 0]}>{analysis?.releaseDecades?.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#color${(index + 2) % gradients.length})`} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      );
      case 'songs': return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="tabpanel" id="songs-tabpanel" aria-labelledby="songs-tab">
          <ul className="space-y-2" aria-label="Playlist tracks">{tracks.map((track, index) => (
            <li key={track.id + index} className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <span className="w-8 text-gray-400" aria-hidden="true">{index + 1}</span>
              <Image src={track.album.images[0].url} alt={`Album cover for ${track.name}`} width={40} height={40} className="rounded mr-4" />
              <div className="flex-grow min-w-0">
                <p className="font-semibold truncate">{track.name}</p>
                <p className="text-sm text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
              </div>
              <span className="text-sm text-gray-400 ml-2" aria-hidden="true">{formatDuration(track.duration_ms)}</span>
              <button
                onClick={() => handleTrackPlayToggle(track)}
                className={`ml-4 p-2 rounded-full transition-colors ${track.preview_url ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                disabled={!track.preview_url}
                title={track.preview_url ? (currentPlayingTrackId === track.id ? `Pause preview for ${track.name}` : `Play preview for ${track.name}`) : `No preview available for ${track.name}`}
                aria-label={track.preview_url ? (currentPlayingTrackId === track.id ? `Pause preview for ${track.name}` : `Play preview for ${track.name}`) : `No preview available for ${track.name}`}
              >
                {currentPlayingTrackId === track.id ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              </button>
            </li>
          ))}</ul>
        </motion.div>
      );
      case 'social': return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full" role="tabpanel" id="social-tabpanel" aria-labelledby="social-tab">
          {!isShared ? (
            <div className="text-center py-16 flex-1 flex flex-col justify-center items-center" role="status">
              <Share2 className="w-12 h-12 text-gray-600 mb-4" aria-hidden="true" />
              <h3 className="text-2xl font-bold text-gray-400">This Playlist Isn&apos;t Shared</h3>
              <p className="text-gray-500 mt-2">Share this playlist with the community to enable comments and suggestions.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 -mr-4 mb-4" aria-live="polite" aria-atomic="false">
                <div className="space-y-2">
                  {comments.map(comment => <CommentCard key={comment.id} comment={comment} />)}
                </div>
              </div>
              <form onSubmit={handleCommentSubmit} className="flex items-center space-x-3 mt-auto pt-4 border-t border-white/10">
                <Image src={session?.user?.user_metadata.avatar_url || `https://i.pravatar.cc/40?u=${session?.user?.id}`} alt="Your avatar" width={40} height={40} className="rounded-full" />
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={!sharedPlaylistId ? "Loading comments..." : "Add a comment..."}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  disabled={isSubmitting || !sharedPlaylistId}
                  aria-label="Add a new comment"
                />
                <button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 rounded-full p-3 text-white transition-colors disabled:opacity-50" 
                  disabled={isSubmitting || !newComment.trim() || !sharedPlaylistId}
                  aria-label="Submit comment"
                >
                  <Send size={20} aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </motion.div>
      );
      case 'poster': return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center" role="tabpanel" id="poster-tabpanel" aria-labelledby="poster-tab">
            <p className="text-center text-gray-400 mb-4">Here&apos;s a shareable poster for your playlist!</p>
            <PlaylistPoster posterRef={posterRef} playlist={playlist} tracks={tracks} artists={artists} />
            <button
                onClick={handleDownloadPoster}
                className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                aria-label="Download playlist poster as image"
            >
                Download Poster
            </button>
        </motion.div>
      );
      case 'suggestions': return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="tabpanel" id="suggestions-tabpanel" aria-labelledby="suggestions-tab">
          {!isShared || !sharedPlaylistId ? (
            <div className="text-center py-16" role="status">
              <GitPullRequest className="w-12 h-12 text-gray-600 mb-4 mx-auto" aria-hidden="true" />
              <h3 className="text-2xl font-bold text-gray-400">Share to Get Suggestions</h3>
              <p className="text-gray-500 mt-2">You must share this playlist to the community to receive song suggestions.</p>
            </div>
          ) : (
            <>
              <SongSuggester sharedPlaylistId={sharedPlaylistId} />
              {isOwner && (
                <>
                  <h3 className="text-xl font-bold mt-8 mb-4 border-t border-white/10 pt-6">Manage Suggestions</h3>
                  <SuggestionManager sharedPlaylistId={sharedPlaylistId} spotifyPlaylistId={playlist.id} />
                </>
              )}
            </>
          )}
        </motion.div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="absolute inset-0 bg-gray-900 p-4 sm:p-6 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="playlist-detail-title"
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}><defs>{gradients.map((grad, index) => (
        <linearGradient id={`color${index}`} x1="0" y1="0" x2="1" y2="0" key={index}><stop offset="0%" stopColor={grad[0]} /><stop offset="100%" stopColor={grad[1]} /></linearGradient>
      ))}</defs></svg>

      <button onClick={onBack} className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 self-start" aria-label={backButtonText}><ArrowLeft aria-hidden="true" /><span>{backButtonText}</span></button>

      <header className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-8 mb-8">
        {playlist.images?.[0]?.url ? (
          <Image 
            src={playlist.images[0].url} 
            alt={`Cover for ${playlist.name}`} 
            width={200} 
            height={200} 
            className="rounded-2xl shadow-2xl flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 object-cover" 
          />
        ) : (
          <div className="rounded-2xl shadow-2xl flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-gray-800 flex items-center justify-center">
            <Music className="w-16 h-16 text-gray-600" />
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">Playlist</p>
          <h1 id="playlist-detail-title" className="text-4xl sm:text-5xl md:text-6xl font-extrabold mt-2 mb-4">{playlist.name}</h1>
          <p className="text-gray-400 max-w-prose text-sm sm:text-base">{playlist.description || 'A collection of amazing tracks.'}</p>
          <button 
            onClick={onShareToggle} 
            disabled={!isOwner}
            className={`mt-4 flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 ${isShared ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'} ${!isOwner ? 'cursor-not-allowed opacity-70' : ''}`}
            aria-label={isShared ? 'Playlist is shared to community' : 'Share playlist to community'}
            aria-pressed={isShared}
          >
            {isShared ? <CheckCircle size={20} aria-hidden="true" /> : <Share2 size={20} aria-hidden="true" />}
            <span>{isShared ? 'Shared to Community' : 'Share to Community'}</span>
          </button>
        </div>
      </header>

      <nav className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 border-b border-white/10 mb-8 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto" role="tablist" aria-label="Playlist details tabs">
        {([
          ['overview', Music], ['songs', Users], ['social', Share2], 
          ['suggestions', GitPullRequest], ['poster', ImageIcon]
        ] as const).map(([tab, Icon]) => (
          <button 
            key={tab} 
            id={`${tab}-tab`}
            onClick={() => setActiveTab(tab)} 
            className={`relative flex-shrink-0 flex items-center space-x-2 px-3 sm:px-4 py-3 font-semibold transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            role="tab"
            aria-controls={`${tab}-tabpanel`}
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
          >
            <Icon className="w-5 h-5" aria-hidden="true" /><span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-full" layoutId="underline" />}
          </button>
        ))}
      </nav>

      <div className={`flex-1 ${activeTab === 'social' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </div>
    </motion.div>
  );
}