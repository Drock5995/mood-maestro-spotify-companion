"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot } from 'lucide-react';
import { useSpotify } from '@/context/SpotifyContext';
import { Puter } from '@puter/js/client';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent';
  text: string;
}

export default function AIAgentPage() {
  const { session } = useSpotify();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Puter client
  const puter = useRef<Puter | null>(null);
  useEffect(() => {
    if (session?.user?.id) {
      // Replace with your actual Supabase Edge Function URL
      // Format: https://<PROJECT_REF>.supabase.co/functions/v1/ai-agent
      const edgeFunctionUrl = `https://jykbnnmvjpwmoxxhijgn.supabase.co/functions/v1/ai-agent`;
      puter.current = new Puter({
        endpoint: edgeFunctionUrl,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user || !puter.current) return;

    const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await puter.current.chat(input, { userId: session.user.id });
      const agentMessage: ChatMessage = { id: Date.now() + 1, sender: 'agent', text: response.response };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error communicating with AI agent:', error);
      toast.error('Failed to get a response from the AI agent. Please try again.');
      const errorMessage: ChatMessage = { id: Date.now() + 1, sender: 'agent', text: "Sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full text-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={24} />
        <p>Loading user session to connect AI agent...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b border-white/10 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <Bot className="text-purple-400" size={28} />
          <span>Playlist Assistant AI</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Ask me to find playlists on Spotify!</p>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">How can I help you find music today?</p>
            <p className="text-sm mt-2">Try asking: "Find some chill study music" or "Show me rock playlists."</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3 rounded-lg ${
              msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-white'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-md p-3 rounded-lg bg-gray-700 text-white flex items-center space-x-2">
              <Loader2 className="animate-spin" size={16} />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 border-t border-white/10 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            disabled={isSending}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 rounded-full p-3 text-white transition-colors disabled:opacity-50"
            disabled={!input.trim() || isSending}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}