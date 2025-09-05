"use client";

import { Menu, Music } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
      <div className="flex items-center space-x-2">
        <Music className="w-6 h-6 text-purple-400" />
        <span className="text-xl font-bold text-white">Playlist Connect</span>
      </div>
      <button onClick={onMenuClick} className="p-2 text-gray-300 hover:text-white">
        <Menu className="w-6 h-6" />
      </button>
    </header>
  );
}