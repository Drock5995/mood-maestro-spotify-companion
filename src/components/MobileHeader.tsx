"use client";

import { Menu, Music } from 'lucide-react';
import FriendRequestBell from './FriendRequestBell';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-gray-900/70 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40"> {/* Adjusted background */}
      <div className="flex items-center space-x-2">
        <Music className="w-6 h-6 text-primary-400" /> {/* Using primary color */}
        <span className="text-xl font-bold text-white">VibeSphere</span> {/* Changed app name */}
      </div>
      <div className="flex items-center space-x-2">
        <FriendRequestBell />
        <button onClick={onMenuClick} className="p-2 text-gray-300 hover:text-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"> {/* Added focus styles */}
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}