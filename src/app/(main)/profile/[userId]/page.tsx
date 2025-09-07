"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Music, UserPlus, UserCheck, UserX, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPlaylistCard, SharedPlaylist } from '@/components/CommunityPlaylistCard';
import { useSpotify } from '@/context/SpotifyContext';
import toast from 'react-hot-toast';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  status: 'pending' | 'accepted';
  // True if the logged-in user sent the request
  initiated_by_me: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { session } = useSpotify();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [playlists, setPlaylists] = useState<SharedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [loadingFriendship, setLoadingFriendship] = useState(true);

  const isMyProfile = session?.user?.id === userId;

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const profilePromise = supabase.from('profiles').select('display_name, avatar_url').eq('id', userId).single();
    const playlistsPromise = supabase.from('shared_playlists').select(`id, spotify_playlist_id, playlist_name, playlist_cover_url, user_id, profiles ( display_name, avatar_url ), playlist_likes ( user_id )`).eq('user_id', userId).order('created_at', { ascending: false });

    const [{ data: profileData }, { data: playlistData }] = await Promise.all([profilePromise, playlistsPromise]);
    
    setProfile(profileData);
    if (playlistData) {
      setPlaylists(playlistData as unknown as SharedPlaylist[]);
    }
    
    setLoading(false);
  }, [userId]);

  const fetchFriendshipStatus = useCallback(async () => {
    if (!session?.user || isMyProfile) {
      setLoadingFriendship(false);
      return;
    }
    setLoadingFriendship(true);
    const { data } = await supabase
      .from('friends')
      .select('id, status, user_id')
      .or(`(user_id.eq.${session.user.id},friend_id.eq.${userId}),(user_id.eq.${userId},friend_id.eq.${session.user.id})`)
      .single();

    if (data) {
      setFriendship({
        id: data.id,
        status: data.status as 'pending' | 'accepted',
        initiated_by_me: data.user_id === session.user.id
      });
    } else {
      setFriendship(null);
    }
    setLoadingFriendship(false);
  }, [session, userId, isMyProfile]);

  useEffect(() => {
    if (session !== undefined) {
      fetchProfileData();
      fetchFriendshipStatus();
    }
  }, [session, fetchProfileData, fetchFriendshipStatus]);

  const handleAddFriend = async () => {
    if (!session?.user) return;
    const { error } = await supabase.from('friends').insert({ user_id: session.user.id, friend_id: userId, status: 'pending' });
    if (error) {
      toast.error('Could not send friend request.');
    } else {
      toast.success('Friend request sent!');
      fetchFriendshipStatus();
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendship) return;
    const { error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', friendship.id);
    if (error) {
      toast.error('Failed to accept request.');
    } else {
      toast.success('Friend request accepted!');
      fetchFriendshipStatus();
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendship) return;
    const { error } = await supabase.from('friends').delete().eq('id', friendship.id);
    if (error) {
      toast.error('Failed to remove friend.');
    } else {
      toast.success('Friend removed.');
      fetchFriendshipStatus();
    }
  };

  const renderFriendButton = () => {
    if (loadingFriendship) {
      return <div className="w-36 h-10 flex justify-center items-center"><Loader2 className="animate-spin" /></div>;
    }

    const baseClasses = "flex items-center justify-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 w-40 text-sm";

    if (!friendship) {
      return <button onClick={handleAddFriend} className={`${baseClasses} bg-purple-600 hover:bg-purple-700 text-white`}><UserPlus size={16} /><span>Add Friend</span></button>;
    }

    if (friendship.status === 'pending') {
      if (friendship.initiated_by_me) {
        return <button onClick={handleRemoveFriend} className={`${baseClasses} bg-gray-600 hover:bg-red-500/80 text-white`}><UserX size={16} /><span>Cancel Request</span></button>;
      } else {
        return <button onClick={handleAcceptRequest} className={`${baseClasses} bg-emerald-500 hover:bg-emerald-600 text-white`}><UserCheck size={16} /><span>Accept Request</span></button>;
      }
    }

    if (friendship.status === 'accepted') {
      return <button onClick={handleRemoveFriend} className={`${baseClasses} bg-white/10 hover:bg-red-500/80 text-white`}><UserCheck size={16} /><span>Friends</span></button>;
    }

    return null;
  };

  const renderActionButtons = () => {
    if (isMyProfile) return null;

    return (
      <div className="flex items-center gap-2">
        {renderFriendButton()}
        {friendship?.status === 'accepted' && (
          <button onClick={() => router.push(`/messages/${userId}`)} className="flex items-center justify-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 w-40 text-sm bg-sky-600 hover:bg-sky-700 text-white">
            <MessageCircle size={16} />
            <span>Message</span>
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>;
  }

  if (!profile) {
    return <div className="flex-1 flex flex-col items-center justify-center text-center"><User className="w-16 h-16 text-gray-500 mb-4" /><h2 className="text-2xl font-bold text-gray-400">User Not Found</h2><p className="text-gray-500 mt-2">This user could not be loaded.</p></div>;
  }

  return (
    <>
      <header className="mb-8 flex flex-col items-center text-center">
        <Image 
          src={profile.avatar_url || `https://i.pravatar.cc/150?u=${userId}`}
          alt={profile.display_name || 'User Avatar'}
          width={128}
          height={128}
          className="rounded-full border-4 border-purple-500 shadow-lg mb-4 w-24 h-24 md:w-32 md:h-32 object-cover"
        />
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">{profile.display_name || 'A Spotify Listener'}</h1>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <p className="text-gray-400 text-base">{playlists.length} {playlists.length === 1 ? 'Shared Playlist' : 'Shared Playlists'}</p>
          {renderActionButtons()}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto pr-2">
        {playlists.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <Music className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-400">No Playlists Shared Yet</h3>
            <p className="text-gray-500 mt-2">This user hasn't shared any playlists with the community.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {playlists.map((p, index) => (
              <CommunityPlaylistCard 
                key={p.id} 
                playlist={p} 
                index={index} 
                onClick={() => router.push(`/community?shared_id=${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}