"use client";

import Image from 'next/image';
import { Home, Users, Heart, Music } from 'lucide-react';
import { SpotifyUser, SpotifyPlaylist } from '@/lib/spotify';

interface SidebarProps {
  user: SpotifyUser | null;
  playlists: SpotifyPlaylist[];
  onPlaylistClick: (playlist: SpotifyPlaylist) => void;
  selectedPlaylistId?: string | null;
}

const NavLink = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
  <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200">
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </a>
);

export default function Sidebar({ user, playlists, onPlaylistClick, selectedPlaylistId }: SidebarProps) {
  return (
    <aside className="w-64 bg-black/30 p-4 flex flex-col space-y-6 rounded-2xl">
      {/* Profile Section */}
      {user && (
        <div className="flex items-center space-x-4 p-2">
          {user.images?.[0]?.url && (
            <Image
              src={user.images[0].url}
              alt={user.display_name || 'User'}
              width={48}
              height={48}
              className="rounded-full border-2 border-purple-500"
            />
          )}
          <div>
            <h3 className="font-bold text-white text-lg">{user.display_name}</h3>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col space-y-2">
        <NavLink icon={Home} label="Home" />
        <NavLink icon={Users} label="Community" />
        <NavLink icon={Heart} label="Friends" />
      </nav>

      {/* Divider */}
      <div className="border-t border-white/10"></div>

      {/* Playlists */}
      <div className="flex-grow overflow-y-auto pr-2">
        <h4 className="text-gray-400 font-semibold text-sm uppercase tracking-wider px-3 mb-3">Your Playlists</h4>
        <ul className="space-y-1">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <button
                onClick={() => onPlaylistClick(playlist)}
                className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  selectedPlaylistId === playlist.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold shadow-lg'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Music className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{playlist.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}