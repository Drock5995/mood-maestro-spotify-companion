'use client';

import React from 'react';
import Image from 'next/image';
import { SpotifyUser } from '@/lib/spotify';

interface DashboardHeaderProps {
  user: SpotifyUser | null;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        {user?.images?.[0] && (
          <Image
            src={user.images[0].url}
            alt={user.display_name || 'User avatar'}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full border-2 border-green-500"
          />
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Hey {user?.display_name || 'Ashley'}! 🎵
          </h1>
          <p className="text-green-200">
            Welcome to your music dashboard.
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full transition-colors text-sm"
      >
        Logout
      </button>
    </header>
  );
};