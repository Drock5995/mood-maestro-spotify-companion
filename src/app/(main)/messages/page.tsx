"use client";

import { MessageSquare } from 'lucide-react';
import FriendList from '@/components/FriendList';

export default function MessagesPage() {
  return (
    <>
      {/* Mobile view: show friend list first */}
      <div className="md:hidden">
        <FriendList />
      </div>
      {/* Desktop view: show placeholder */}
      <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500">
        <MessageSquare size={64} className="mb-4" />
        <h2 className="text-2xl font-bold text-gray-400">Select a conversation</h2>
        <p>Choose a friend from the list to start chatting.</p>
      </div>
    </>
  );
}