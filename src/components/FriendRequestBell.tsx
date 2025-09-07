"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, UserCheck, UserX } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';
import toast from 'react-hot-toast';

interface FriendRequest {
  id: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }
}

export default function FriendRequestBell() {
  const { session } = useSpotify();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRequests = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('friends')
      .select('id, profiles:user_id(id, display_name, avatar_url)')
      .eq('friend_id', session.user.id)
      .eq('status', 'pending');

    if (error) {
      console.error("Error fetching friend requests:", error);
    } else {
      setRequests(data as any);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchRequests();

      const channel = supabase
        .channel(`friend-requests:${session.user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'friends', filter: `friend_id=eq.${session.user.id}` },
          () => fetchRequests()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const handleResponse = async (requestId: string, accept: boolean, requesterName: string) => {
    if (accept) {
      const { error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId);
      if (error) toast.error("Failed to accept request.");
      else toast.success(`Friend request from ${requesterName} accepted!`);
    } else {
      const { error } = await supabase.from('friends').delete().eq('id', requestId);
      if (error) toast.error("Failed to decline request.");
      else toast.success(`Friend request from ${requesterName} declined.`);
    }
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-400 hover:text-white"
        aria-label={`Friend requests. You have ${requests.length} pending requests.`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Bell size={22} aria-hidden="true" />
        {requests.length > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-gray-800" aria-hidden="true">
            {requests.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-white/10 rounded-lg shadow-lg z-20"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-3 border-b border-white/10">
            <h3 className="font-semibold text-white">Friend Requests</h3>
          </div>
          {requests.length === 0 ? (
            <p className="p-4 text-center text-gray-400" role="status">No pending requests.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {requests.map(req => {
                const requesterName = req.profiles.display_name || 'A User';
                return (
                  <li key={req.id} className="flex items-center justify-between p-3 hover:bg-white/5" role="menuitem">
                    <div className="flex items-center space-x-3 min-w-0">
                      <Image 
                        src={req.profiles.avatar_url || `https://i.pravatar.cc/40?u=${req.profiles.id}`} 
                        alt={`${requesterName}'s avatar`} 
                        width={40} 
                        height={40} 
                        className="rounded-full" 
                      />
                      <span className="font-semibold truncate">{requesterName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleResponse(req.id, true, requesterName)} 
                        className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40" 
                        title={`Accept request from ${requesterName}`}
                        aria-label={`Accept friend request from ${requesterName}`}
                      >
                        <UserCheck size={16} aria-hidden="true" />
                      </button>
                      <button 
                        onClick={() => handleResponse(req.id, false, requesterName)} 
                        className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40" 
                        title={`Decline request from ${requesterName}`}
                        aria-label={`Decline friend request from ${requesterName}`}
                      >
                        <UserX size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}