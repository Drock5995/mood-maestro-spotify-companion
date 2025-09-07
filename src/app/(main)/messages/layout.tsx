"use client";

import { ReactNode } from 'react';
import FriendList from '@/components/FriendList';

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-white/10 hidden md:block">
        <FriendList />
      </div>
      <div className="w-full md:w-2/3 lg:w-3/4">
        {children}
      </div>
    </div>
  );
}