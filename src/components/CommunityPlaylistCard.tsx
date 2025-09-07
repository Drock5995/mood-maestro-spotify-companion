"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';
import toast from 'react-hot-toast';

export interface SharedPlaylist {
  id: string;
  spotify_playlist_id: string;
  playlist_name: string;
  playlist_cover_url: string | null;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  playlist_likes: Array<{ user_id: string }>;
}

interface CommunityPlaylistCardProps {
  playlist: SharedPlaylist;
  index: number;
  onClick: () => void;
}

export const CommunityPlaylistCard = ({ playlist, index, onClick }: CommunityPlaylistCardProps) => {
  const { session } = useSpotify();
  const [likeCount, setLikeCount] = useState(playlist.playlist_likes.length);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setIsLiked(playlist.playlist_likes.some(like => like.user_id === session.user.id));
    }
  }, [session, playlist.playlist_likes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) {
      toast.error("You must be logged in to like a playlist.");
      return;
    }

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    if (wasLiked) {
      const { error } = await supabase
        .from('playlist_likes')
        .delete()
        .match({ user_id: session.user.id, shared_playlist_id: playlist.id });
      
      if (error) {
        toast.error("Failed to unlike playlist.");
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } else {
      const { error } = await supabase
        .from('playlist_likes')
        .insert({ user_id: session.user.id, shared_playlist_id: playlist.id });
      
      if (error) {
        toast.error("Failed to like playlist.");
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    }
  };

  const ownerName = playlist.profiles?.display_name || 'A User';
  const ownerAvatar = playlist.profiles?.avatar_url || `https://i.pravatar.cc/40?u=${playlist.user_id}`;

  return (
    <motion.button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden group text-left w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Image src={playlist.playlist_cover_url || '/default-cover.png'} alt={playlist.playlist_name} width={500} height={500} className="w-full h-full object-cover aspect-square bg-gray-800 group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 text-white w-full">
        <h3 className="text-xl font-bold truncate">{playlist.playlist_name}</h3>
        <div className="flex items-center justify-between mt-2">
          <Link href={`/profile/${playlist.user_id}`} onClick={(e) => e.stopPropagation()} className="flex items-center space-x-2 min-w-0 group/profile">
            <Image src={ownerAvatar} alt={ownerName} width={24} height={24} className="rounded-full flex-shrink-0" />
            <span className="text-sm font-medium truncate group-hover/profile:underline">{ownerName}</span>
          </Link>
          <button onClick={handleLike} className="flex items-center space-x-1 bg-black/50 px-2 py-1 rounded-full transition-colors hover:bg-black/70 flex-shrink-0">
            <Heart className={`w-4 h-4 transition-all ${isLiked ? 'text-pink-500 fill-current' : 'text-pink-400'}`} />
            <span className="text-white font-semibold text-sm">{likeCount}</span>
          </button>
        </div>
      </div>
    </motion.button>
  );
};