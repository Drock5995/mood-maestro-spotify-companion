"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';
import { Loader2 } from 'lucide-react';

interface Friend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function FriendList() {
  const { session } = useSpotify();
  const pathname = usePathname();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!session?.user) return;
      setLoading(true);

      const { data: friendships, error: friendsError } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        setLoading(false);
        return;
      }

      const friendIds = friendships.map(f => f.user_id === session.user.id ? f.friend_id : f.user_id);
      const uniqueFriendIds = [...new Set(friendIds)];

      if (uniqueFriendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', uniqueFriendIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else {
        setFriends(profiles as Friend[]);
      }
      setLoading(false);
    };

    if (session) {
      fetchFriends();
    }
  }, [session]);

  if (loading) {
    return <div className="p-4 text-center flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold p-4 border-b border-white/10 flex-shrink-0">Messages</h2>
      <nav className="flex-grow overflow-y-auto">
        {friends.length === 0 ? (
          <p className="p-4 text-center text-gray-400">You have no friends to message yet.</p>
        ) : (
          <ul>
            {friends.map(friend => (
              <li key={friend.id}>
                <Link href={`/messages/${friend.id}`} className={`flex items-center space-x-3 p-3 transition-colors hover:bg-white/10 ${pathname === `/messages/${friend.id}` ? 'bg-white/10' : ''}`}>
                  <Image src={friend.avatar_url || `https://i.pravatar.cc/40?u=${friend.id}`} alt={friend.display_name || 'Friend'} width={40} height={40} className="rounded-full" />
                  <span className="font-semibold truncate">{friend.display_name || 'A User'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}