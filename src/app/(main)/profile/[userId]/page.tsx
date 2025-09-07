"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPlaylistCard, SharedPlaylist } from '@/components/CommunityPlaylistCard';
import { useSpotify } from '@/context/SpotifyContext';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { session } = useSpotify();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [playlists, setPlaylists] = useState<SharedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch profile info
    let { data: profileData } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();
    
    if (!profileData && session?.user?.id === userId) {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          display_name: session.user.user_metadata.full_name,
          avatar_url: session.user.user_metadata.avatar_url,
        })
        .select('display_name, avatar_url')
        .single();

      if (error) console.error("Error creating profile:", error);
      else profileData = newProfile;
    }
    
    setProfile(profileData);

    // Fetch user's shared playlists
    const { data: playlistData } = await supabase
      .from('shared_playlists')
      .select(`
        id,
        spotify_playlist_id,
        playlist_name,
        playlist_cover_url,
        user_id,
        profiles ( display_name, avatar_url ),
        playlist_likes ( user_id )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (playlistData) {
      setPlaylists(playlistData as unknown as SharedPlaylist[]);
    }
    
    setLoading(false);
  }, [userId, session]);

  useEffect(() => {
    if (session !== undefined) {
      fetchProfileData();
    }
  }, [session, fetchProfileData]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-playlists:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_playlists' },
        () => {
          fetchProfileData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchProfileData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <User className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-400">User Not Found</h2>
        <p className="text-gray-500 mt-2">This profile could not be loaded.</p>
      </div>
    );
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
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">
          {profile.display_name || 'A Spotify Listener'}
        </h1>
        <p className="text-gray-400 mt-2 text-base md:text-lg">
          {playlists.length} {playlists.length === 1 ? 'Shared Playlist' : 'Shared Playlists'}
        </p>
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