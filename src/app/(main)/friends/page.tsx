"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import { useSpotify } from '@/context/SpotifyContext';
import { SpotifyPlaylist } from '@/lib/spotify';

interface MatchedPlaylist {
  id: string;
  name: string;
  owner: string;
  avatar: string;
  likes: number;
  image: string;
  match: number;
}

// Mock data for community playlists
const mockMatches: MatchedPlaylist[] = [
  { id: '1', name: 'Indie Vibes', owner: 'Alice', avatar: 'https://i.pravatar.cc/40?u=1', likes: 120, image: 'https://i.scdn.co/image/ab67706c0000bebb485cbbefc3593a745845ebb5', match: 92 },
  { id: '2', name: 'Late Night Jazz', owner: 'Bob', avatar: 'https://i.pravatar.cc/40?u=2', likes: 250, image: 'https://i.scdn.co/image/ab67706f00000002bdeb1c37f70041c595908c7c', match: 88 },
  { id: '3', name: 'Hip Hop Classics', owner: 'Charlie', avatar: 'https://i.pravatar.cc/40?u=3', likes: 500, image: 'https://i.scdn.co/image/ab67706c0000bebb9318b45e3e74643a8958248b', match: 85 },
];

const MatchCard = ({ playlist, index }: { playlist: MatchedPlaylist, index: number }) => (
  <motion.div
    className="bg-white/5 p-4 rounded-2xl flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.15 }}
  >
    <div className="relative mb-4">
      <Image src={playlist.image} alt={playlist.name} width={200} height={200} className="rounded-lg shadow-lg" />
      <div className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-xl">
        <span className="font-extrabold text-2xl">{playlist.match}%</span>
        <span className="text-xs font-bold uppercase">Match</span>
      </div>
    </div>
    <h3 className="text-lg font-bold">{playlist.name}</h3>
    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
      <Image src={playlist.avatar} alt={playlist.owner} width={24} height={24} className="rounded-full" />
      <span>by {playlist.owner}</span>
    </div>
  </motion.div>
);

export default function FriendsPage() {
  const { playlists } = useSpotify();
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [matches, setMatches] = useState<MatchedPlaylist[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const handleFindMatches = () => {
    if (!selectedPlaylist) return;
    setIsMatching(true);
    setMatches([]);
    setTimeout(() => {
      setMatches(mockMatches.sort(() => 0.5 - Math.random())); // Shuffle for variety
      setIsMatching(false);
    }, 1500);
  };

  return (
    <>
      <header className="mb-6 px-2">
        <h1 className="text-4xl font-extrabold text-white">
          Playlist <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Matchmaker</span>
        </h1>
        <p className="text-gray-400 mt-2">Find community playlists that share your vibe.</p>
      </header>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="bg-white/5 p-6 rounded-2xl max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Select one of your playlists</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {playlists.slice(0, 10).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlaylist(p)}
                className={`px-4 py-2 rounded-full font-semibold border-2 transition-all duration-300 ${
                  selectedPlaylist?.id === p.id
                    ? 'bg-purple-500 border-purple-500 text-white scale-105'
                    : 'bg-transparent border-gray-600 hover:border-purple-500 hover:text-purple-400'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleFindMatches}
            disabled={!selectedPlaylist || isMatching}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center mx-auto"
          >
            {isMatching ? (
              <>
                <Shuffle className="animate-spin mr-2" size={20} />
                Finding Matches...
              </>
            ) : (
              <>
                <Shuffle className="mr-2" size={20} />
                Find Matches
              </>
            )}
          </button>
        </div>

        {matches.length > 0 && (
          <div className="mt-10">
            <h2 className="text-3xl font-bold text-center mb-6">Top Matches for <span className="text-purple-400">{selectedPlaylist?.name}</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, index) => (
                <MatchCard key={match.id} playlist={match} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}