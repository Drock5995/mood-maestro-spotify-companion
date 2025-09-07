"use client";

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react'; // Added Sparkles icon
import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection'; // Using funEmoji for animated look

interface ProfileEditFormProps {
  currentDisplayName: string | null;
  currentAvatarUrl: string | null;
  onSave: (newDisplayName: string, newAvatarUrl: string | null) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ currentDisplayName, currentAvatarUrl, onSave, onCancel }: ProfileEditFormProps) {
  const { session } = useSpotify();
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || isSaving) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() === '' ? null : displayName.trim(),
        avatar_url: avatarUrl.trim() === '' ? null : avatarUrl.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } else {
      toast.success('Profile updated successfully!');
      onSave(displayName.trim(), avatarUrl.trim());
    }
    setIsSaving(false);
  };

  const handleGenerateAvatar = () => {
    if (!session?.user) {
      toast.error("You must be logged in to generate an avatar.");
      return;
    }
    const avatar = createAvatar(funEmoji, {
      seed: session.user.id, // Use user ID as seed for consistent generation
      size: 128,
      // You can add more options here for customization
      // For example: mouth: ['smile', 'cute'], eyes: ['happy', 'wink']
    });
    const svg = avatar.toDataUriSync();
    setAvatarUrl(svg);
    toast.success("New avatar generated!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white/5 rounded-xl">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Your display name"
          maxLength={50}
        />
      </div>
      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
        <div className="flex items-center space-x-3">
          <input
            type="url"
            id="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="https://example.com/your-avatar.jpg"
          />
          <button
            type="button"
            onClick={handleGenerateAvatar}
            className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center"
            title="Generate a fun avatar"
          >
            <Sparkles size={20} />
          </button>
        </div>
        {avatarUrl && (
          <div className="mt-4 flex justify-center">
            <Image src={avatarUrl} alt="Avatar Preview" width={96} height={96} className="rounded-full object-cover border-2 border-purple-500" />
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-full text-gray-300 hover:bg-white/10 transition-colors"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          Save Changes
        </button>
      </div>
    </form>
  );
}