"use client";

import { Menu, Music } from 'lucide-react';
import FriendRequestBell from './FriendRequestBell';
import Link from 'next/link';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <Music className="w-6 h-6 text-purple-400" />
        <span className="text-xl font-bold text-white">VibeSphere</span>
      </Link>
      <div className="flex items-center space-x-2">
        <FriendRequestBell />
        <button onClick={onMenuClick} className="p-2 text-gray-300 hover:text-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}