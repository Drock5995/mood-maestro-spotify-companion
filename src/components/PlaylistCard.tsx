"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Music } from 'lucide-react';
import { SpotifyPlaylist } from '@/lib/spotify';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  index: number;
}

const gradients = [
  'from-purple-600 to-blue-500',
  'from-pink-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-indigo-500 to-violet-600',
  'from-red-500 to-yellow-500',
];

export default function PlaylistCard({ playlist, index }: PlaylistCardProps) {
  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      className={`relative p-6 rounded-2xl shadow-lg overflow-hidden cursor-pointer bg-gradient-to-br ${gradient}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
    >
      <div className="relative z-10">
        {playlist.images?.[0]?.url && (
          <Image
            src={playlist.images[0].url}
            alt={playlist.name}
            width={128}
            height={128}
            className="rounded-lg shadow-2xl mb-4 w-full h-auto aspect-square object-cover"
          />
        )}
        <h3 className="text-2xl font-extrabold text-white truncate" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
          {playlist.name}
        </h3>
        <p className="text-white/80 font-medium mt-1">{playlist.tracks.total} songs</p>
        
        <div className="flex items-center space-x-4 mt-4 text-white/90">
          <div className="flex items-center space-x-1">
            <Music size={16} />
            <span className="text-sm font-semibold">Vibe Check</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users size={16} />
            <span className="text-sm font-semibold">Community</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}