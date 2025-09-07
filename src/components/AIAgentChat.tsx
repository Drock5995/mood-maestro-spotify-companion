"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot } from 'lucide-react';
import { useSpotify } from '@/context/SpotifyContext';
import { MusicAgent } from '@/integrations/puter/agent';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  sender: 'user' | 'agent';
  text: string;
}

export default function AIAgentChat() {
  const { spotifyApi, loading: spotifyLoading, error: spotifyError } = useSpotify();
  const [agent, setAgent] = useState<MusicAgent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spotifyApi && !spotifyLoading && !spotifyError) {
      try {
        setAgent(new MusicAgent(spotifyApi));
      } catch (e: any) {
        console.error("Failed to initialize AI agent:", e);
        toast.error(`AI Agent initialization failed: ${e.message}`);
      }
    } else if (spotifyError) {
      toast.error(`Cannot initialize AI Agent: ${spotifyError}`);
    }
  }, [spotifyApi, spotifyLoading, spotifyError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !agent) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const agentResponse = await agent.chat(userMessage.text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'agent', text: agentResponse }]);
    } catch (error) {
      console.error("Error communicating with AI agent:", error);
      toast.error("Failed to get a response from the AI agent.");
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'agent', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsSending(false);
    }
  };

  if (spotifyLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading Spotify data for AI...
      </div>
    );
  }

  if (spotifyError) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        Error: {spotifyError}. AI Agent cannot function without Spotify access.
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Loader2 className="animate-spin mr-2" size={24} /> Initializing AI Agent...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/5 rounded-lg shadow-lg">
      <header className="p-4 border-b border-white/10 flex items-center space-x-3">
        <Bot className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">VibeSphere AI Chat</h2>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <p>Start a conversation with your VibeSphere AI!</p>
            <p className="text-sm mt-2">Try asking: "What are my top playlists?" or "Search for tracks by Taylor Swift."</p>
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
            <div className="max-w-md p-3 rounded-lg bg-gray-700 text-white flex items-center">
              <Loader2 className="animate-spin mr-2" size={16} /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI agent..."
            className="flex-1 bg-white/10 border border-white/20 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            disabled={isSending || !agent}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 rounded-full p-3 text-white transition-colors disabled:opacity-50"
            disabled={!input.trim() || isSending || !agent}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}