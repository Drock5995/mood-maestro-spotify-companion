"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Music } from 'lucide-react';
import { SpotifyPlaylist } from '@/lib/spotify';

export default function PlaylistCard({ playlist, index }: { playlist: SpotifyPlaylist, index: number }) {
  return (
    <motion.div
      className="relative p-4 rounded-lg shadow-lg overflow-hidden cursor-pointer group bg-gray-900/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      role="group"
      aria-label={`Playlist: ${playlist.name}`}
    >
      <div className="relative">
        {playlist.images?.[0]?.url ? (
          <Image
            src={playlist.images[0].url}
            alt={`Cover for ${playlist.name}`}
            width={200}
            height={200}
            className="rounded-md shadow-2xl w-full h-auto aspect-square object-cover transition-all duration-300 group-hover:opacity-50"
          />
        ) : (
          <div className="rounded-md shadow-2xl w-full aspect-square bg-gray-800 flex items-center justify-center" aria-label={`No cover image for ${playlist.name}`}>
            <Music className="w-12 h-12 text-gray-600" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-purple-600 rounded-full p-4 shadow-lg" aria-hidden="true">
            <Play className="w-8 h-8 text-white" fill="white" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-lg font-bold text-white truncate">{playlist.name}</h3>
        <p className="text-gray-400 text-sm mt-1">{playlist.tracks.total} songs</p>
      </div>
    </motion.div>
  );
}