"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Heart, Music, LogOut, User, MessageSquare } from 'lucide-react';
import { SpotifyPlaylist } from '@/lib/spotify';
import { useSpotify } from '@/context/SpotifyContext';
import { supabase } from '@/integrations/supabase/client';
import FriendRequestBell from './FriendRequestBell';

interface SidebarProps {
  onPlaylistClick: (playlist: SpotifyPlaylist) => void;
  selectedPlaylistId?: string | null;
}

const NavLink = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link 
      href={href} 
      className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
        isActive 
          ? 'bg-purple-500/10 text-purple-300 font-semibold' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 rounded-r-full"></div>}
      <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-purple-300' : 'text-gray-500 group-hover:text-white'}`} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
};

export default function Sidebar({ onPlaylistClick, selectedPlaylistId }: SidebarProps) {
  const { user, playlists, session } = useSpotify();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-72 bg-black/30 backdrop-blur-xl p-4 flex flex-col space-y-6 rounded-2xl border border-white/10 h-full">
      <div className="flex items-center justify-between p-2">
        {user && session?.user && (
          <Link href={`/profile/${session.user.id}`} className="flex items-center space-x-4 min-w-0 group">
            {user.images?.[0]?.url ? (
              <Image
                src={user.images[0].url}
                alt={`${user.display_name || 'User'}'s profile picture`}
                width={48}
                height={48}
                className="rounded-full border-2 border-transparent group-hover:border-purple-400 transition-colors"
              />
            ) : (
               <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center border-2 border-transparent group-hover:border-purple-400 transition-colors">
                <User size={24} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-white text-lg truncate group-hover:text-purple-300 transition-colors">{user.display_name}</h3>
              <p className="text-gray-400 text-sm truncate">{user.email}</p>
            </div>
          </Link>
        )}
        <FriendRequestBell />
      </div>

      <nav className="flex flex-col space-y-2" aria-label="Main navigation">
        <NavLink href="/dashboard" icon={Home} label="Dashboard" />
        <NavLink href="/community" icon={Users} label="Community" />
        <NavLink href="/friends" icon={Heart} label="Matchmaker" />
        <NavLink href="/messages" icon={MessageSquare} label="Messages" />
        {session?.user && <NavLink href={`/profile/${session.user.id}`} icon={User} label="My Profile" />}
      </nav>

      <div className="border-t border-white/10 flex-grow overflow-y-auto pt-4 pr-1 -mr-2 custom-scrollbar">
        <h4 className="text-gray-400 font-semibold text-sm uppercase tracking-wider px-3 mb-3">Your Playlists</h4>
        <ul className="space-y-1" aria-label="Your Spotify Playlists">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <button
                onClick={() => onPlaylistClick(playlist)}
                className={`w-full text-left flex items-center space-x-4 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  selectedPlaylistId === playlist.id
                    ? 'bg-purple-500/10 text-purple-300 font-semibold'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                aria-current={selectedPlaylistId === playlist.id ? 'true' : undefined}
                aria-label={`Select playlist ${playlist.name}`}
              >
                {selectedPlaylistId === playlist.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 rounded-r-full"></div>}
                <Music className={`w-5 h-5 flex-shrink-0 transition-colors ${selectedPlaylistId === playlist.id ? 'text-purple-300' : 'text-gray-500 group-hover:text-white'}`} aria-hidden="true" />
                <span className="truncate">{playlist.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 group"
          aria-label="Logout from VibeSphere"
        >
          <LogOut className="w-6 h-6 text-gray-500 group-hover:text-red-300 transition-colors" aria-hidden="true" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}