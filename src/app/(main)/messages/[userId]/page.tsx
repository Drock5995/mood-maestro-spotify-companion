"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const otherUserId = params.userId as string;
  const { session } = useSpotify();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!session?.user || !otherUserId) return;
      setLoading(true);

      const profilePromise = supabase.from('profiles').select('*').eq('id', otherUserId).single();
      const messagesPromise = supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${session.user.id},receiver_id.eq.${otherUserId}),(sender_id.eq.${otherUserId},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      const [{ data: profileData }, { data: messageData }] = await Promise.all([profilePromise, messagesPromise]);
      
      setOtherUser(profileData);
      setMessages(messageData || []);
      setLoading(false);
    };

    if (session) {
      fetchInitialData();
    }
  }, [session, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  useEffect(() => {
    if (!session?.user || !otherUserId) return;

    const channel = supabase
      .channel(`messages:${session.user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if ((newMessage.sender_id === otherUserId && newMessage.receiver_id === session.user?.id)) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { data, error } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: otherUserId,
      content: content,
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
    } else if (data) {
      setMessages(prev => [...prev, data as Message]);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" size={48} /></div>;
  }

  if (!otherUser) {
    return <div className="flex items-center justify-center h-full">User not found.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b border-white/10 flex-shrink-0">
        <button onClick={() => router.push('/messages')} className="md:hidden mr-4 p-2"><ArrowLeft /></button>
        <Link href={`/profile/${otherUser.id}`} className="flex items-center space-x-3 group">
          <Image src={otherUser.avatar_url || `https://i.pravatar.cc/40?u=${otherUser.id}`} alt={otherUser.display_name || 'User'} width={40} height={40} className="rounded-full" />
          <h2 className="font-bold text-lg group-hover:underline">{otherUser.display_name}</h2>
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender_id === session?.user?.id ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
              <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p>
              <p className="text-xs text-gray-400 mt-1 text-right">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 border-t border-white/10 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.g.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 rounded-full p-3 text-white transition-colors disabled:opacity-50" disabled={!newMessage.trim()}>
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}