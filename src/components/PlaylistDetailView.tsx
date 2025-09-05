"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Music, Users, Share2 } from 'lucide-react';
import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';

interface PlaylistDetailViewProps {
  playlist: SpotifyPlaylist;
  tracks: SpotifyTrack[];
  artists: SpotifyArtist[];
  onBack: () => void;
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

const gradients = [
  ['#8B5CF6', '#3B82F6'], // purple-blue
  ['#EC4899', '#F97316'], // pink-orange
  ['#10B981', '#14B8A6'], // emerald-teal
  ['#6366F1', '#8B5CF6'], // indigo-violet
  ['#EF4444', '#F59E0B'], // red-yellow
];

export default function PlaylistDetailView({ playlist, tracks, artists, onBack }: PlaylistDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'songs' | 'social'>('overview');

  const analysis = useMemo(() => {
    if (tracks.length === 0) return null;

    const totalDurationMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const avgPopularity = tracks.reduce((sum, track) => sum + track.popularity, 0) / tracks.length;
    
    const genreCounts = artists
      .flatMap(artist => artist.genres)
      .reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), count }));

    return {
      totalDuration: formatDuration(totalDurationMs),
      avgPopularity: avgPopularity.toFixed(0),
      topGenres,
    };
  }, [tracks, artists]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 p-6 rounded-xl text-center">
                <h3 className="text-4xl font-bold">{tracks.length}</h3>
                <p className="text-gray-400">Songs</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl text-center">
                <h3 className="text-4xl font-bold">{analysis?.totalDuration}</h3>
                <p className="text-gray-400">Total Duration</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl text-center">
                <h3 className="text-4xl font-bold">{analysis?.avgPopularity}</h3>
                <p className="text-gray-400">Avg. Popularity</p>
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Top Genres</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={analysis?.topGenres} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#A0AEC0' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1A202C', border: 'none', borderRadius: '10px' }} />
                    <Bar dataKey="count" barSize={20} radius={[0, 10, 10, 0]}>
                      {analysis?.topGenres.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#color${index % gradients.length})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        );
      case 'songs':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ul className="space-y-2">
              {tracks.map((track, index) => (
                <li key={track.id + index} className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <span className="w-8 text-gray-400">{index + 1}</span>
                  <Image src={track.album.images[0].url} alt={track.album.name} width={40} height={40} className="rounded mr-4" />
                  <div className="flex-grow">
                    <p className="font-semibold">{track.name}</p>
                    <p className="text-sm text-gray-400">{track.artists.map(a => a.name).join(', ')}</p>
                  </div>
                  <span className="text-sm text-gray-400">{formatDuration(track.duration_ms)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        );
      case 'social':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <h3 className="text-3xl font-bold mb-4">Coming Soon!</h3>
            <p className="text-gray-400">This is where you'll see likes, comments, and sharing options.</p>
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="absolute inset-0 bg-gray-900 p-6 flex flex-col overflow-y-auto"
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {gradients.map((grad, index) => (
            <linearGradient id={`color${index}`} x1="0" y1="0" x2="1" y2="0" key={index}>
              <stop offset="0%" stopColor={grad[0]} />
              <stop offset="100%" stopColor={grad[1]} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      <button onClick={onBack} className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 self-start">
        <ArrowLeft />
        <span>Back to Dashboard</span>
      </button>

      <header className="flex flex-col md:flex-row items-center text-center md:text-left gap-8 mb-8">
        <Image
          src={playlist.images[0].url}
          alt={playlist.name}
          width={200}
          height={200}
          className="rounded-2xl shadow-2xl flex-shrink-0"
        />
        <div>
          <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">Playlist</p>
          <h1 className="text-5xl md:text-7xl font-extrabold mt-2 mb-4">{playlist.name}</h1>
          <p className="text-gray-400 max-w-prose">{playlist.description || 'A collection of amazing tracks.'}</p>
        </div>
      </header>

      <nav className="flex items-center space-x-2 md:space-x-4 border-b border-white/10 mb-8">
        {([['overview', Music], ['songs', Users], ['social', Share2]] as const).map(([tab, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex items-center space-x-2 px-4 py-3 font-semibold transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            {activeTab === tab && (
              <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-full" layoutId="underline" />
            )}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </motion.div>
  );
}