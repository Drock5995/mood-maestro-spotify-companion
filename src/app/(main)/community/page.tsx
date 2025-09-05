"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface CommunityPlaylist {
  id: string;
  name: string;
  owner: string;
  avatar: string;
  likes: number;
  image: string;
}

// Mock data for community playlists
const mockPlaylists: CommunityPlaylist[] = [
  { id: '1', name: 'Indie Vibes', owner: 'Alice', avatar: 'https://i.pravatar.cc/40?u=1', likes: 120, image: 'https://i.scdn.co/image/ab67706c0000bebb485cbbefc3593a745845ebb5' },
  { id: '2', name: 'Late Night Jazz', owner: 'Bob', avatar: 'https://i.pravatar.cc/40?u=2', likes: 250, image: 'https://i.scdn.co/image/ab67706f00000002bdeb1c37f70041c595908c7c' },
  { id: '3', name: 'Hip Hop Classics', owner: 'Charlie', avatar: 'https://i.pravatar.cc/40?u=3', likes: 500, image: 'https://i.scdn.co/image/ab67706c0000bebb9318b45e3e74643a8958248b' },
  { id: '4', name: 'Workout Beats', owner: 'Diana', avatar: 'https://i.pravatar.cc/40?u=4', likes: 80, image: 'https://i.scdn.co/image/ab67706f000000029249b35f23fb596b6c004707' },
  { id: '5', name: 'Acoustic Chill', owner: 'Eve', avatar: 'https://i.pravatar.cc/40?u=5', likes: 310, image: 'https://i.scdn.co/image/ab67706f00000002c546524b2ed3c1340a8577f2' },
  { id: '6', name: '80s Flashback', owner: 'Frank', avatar: 'https://i.pravatar.cc/40?u=6', likes: 420, image: 'https://i.scdn.co/image/ab67706f00000002b54d5b6313b1b52509bee212' },
];

const CommunityPlaylistCard = ({ playlist, index }: { playlist: CommunityPlaylist, index: number }) => (
  <motion.div
    className="relative rounded-2xl overflow-hidden group cursor-pointer"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <Image src={playlist.image} alt={playlist.name} width={500} height={500} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
    <div className="absolute bottom-0 left-0 p-4 text-white">
      <h3 className="text-xl font-bold">{playlist.name}</h3>
      <div className="flex items-center space-x-2 mt-2">
        <Image src={playlist.avatar} alt={playlist.owner} width={24} height={24} className="rounded-full" />
        <span className="text-sm font-medium">{playlist.owner}</span>
      </div>
    </div>
    <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black/50 px-2 py-1 rounded-full">
      <Heart className="w-4 h-4 text-pink-400" />
      <span className="text-white font-semibold text-sm">{playlist.likes}</span>
    </div>
  </motion.div>
);

export default function CommunityPage() {
  const [playlists] = useState(mockPlaylists);

  return (
    <>
      <header className="mb-6 px-2">
        <h1 className="text-4xl font-extrabold text-white">
          Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Playlists</span>
        </h1>
        <p className="text-gray-400 mt-2">Discover what others are listening to.</p>
      </header>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((p, index) => (
            <CommunityPlaylistCard key={p.id} playlist={p} index={index} />
          ))}
        </div>
        {/* "Load More" button can be added here */}
      </div>
    </>
  );
}