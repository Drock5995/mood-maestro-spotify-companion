"use client";

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { useSpotify } from '@/context/SpotifyContext';
import toast from 'react-hot-toast';
import { Loader2, Sparkles, Upload, Music } from 'lucide-react'; // Added Upload icon
import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection'; // Using funEmoji for animated look

interface ProfileEditFormProps {
  currentDisplayName: string | null;
  currentAvatarUrl: string | null;
  onSave: (newDisplayName: string, newAvatarUrl: string | null) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ currentDisplayName, currentAvatarUrl, onSave, onCancel }: ProfileEditFormProps) {
  const { session, user: spotifyUser } = useSpotify();
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || isSaving || isUploading) return;

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

  const handleGenerateAvatar = async () => {
    if (!session?.user) {
      toast.error("You must be logged in to generate an avatar.");
      return;
    }
    const avatar = createAvatar(funEmoji, {
      seed: session.user.id,
      size: 128,
    });
    const svg = await avatar.toDataUri();
    setAvatarUrl(svg);
    toast.success("New avatar generated!");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.user || !event.target.files || event.target.files.length === 0) {
      toast.error("Please select an image to upload.");
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${session.user.id}/${Math.random()}.${fileExt}`; // Unique path for each user's avatar

    setIsUploading(true);
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Set to true if you want to overwrite existing files at the same path
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar: ' + error.message);
    } else {
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        setAvatarUrl(publicUrlData.publicUrl);
        toast.success('Avatar uploaded successfully!');
      } else {
        toast.error('Failed to get public URL for uploaded avatar.');
      }
    }
    setIsUploading(false);
    // Clear the file input value to allow re-uploading the same file if needed
    event.target.value = '';
  };

  const handleUseSpotifyAvatar = () => {
    if (spotifyUser?.images?.[0]?.url) {
      setAvatarUrl(spotifyUser.images[0].url);
      toast.success("Using Spotify profile picture!");
    } else {
      toast.error("No Spotify profile picture available.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white/5 rounded-xl" aria-label="Edit Profile Form">
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
          aria-describedby="displayNameHelp"
        />
        <p id="displayNameHelp" className="sr-only">Enter your preferred display name, up to 50 characters.</p>
      </div>
      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <input
            type="url"
            id="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="flex-1 w-full sm:w-auto px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="https://example.com/your-avatar.jpg"
            aria-describedby="avatarUrlHelp"
          />
          <p id="avatarUrlHelp" className="sr-only">Enter a direct URL to your avatar image.</p>
          <div className="flex space-x-2">
            <label htmlFor="avatar-upload" className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer" title="Upload your own avatar" aria-label="Upload your own avatar image">
              {isUploading ? <Loader2 className="animate-spin" size={20} aria-hidden="true" /> : <Upload size={20} aria-hidden="true" />}
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
            </label>
            <button
              type="button"
              onClick={handleGenerateAvatar}
              className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center"
              title="Generate a fun avatar"
              aria-label="Generate a random fun emoji avatar"
              disabled={isUploading}
            >
              <Sparkles size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleUseSpotifyAvatar}
              className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center"
              title="Use Spotify profile picture"
              aria-label="Use your Spotify profile picture as avatar"
              disabled={isUploading || !spotifyUser?.images?.[0]?.url}
            >
              <Music size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        {avatarUrl && (
          <div className="mt-4 flex justify-center">
            <Image src={avatarUrl} alt="Avatar preview" width={96} height={96} className="rounded-full object-cover border-2 border-purple-500" />
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-full text-gray-300 hover:bg-white/10 transition-colors"
          disabled={isSaving || isUploading}
          aria-label="Cancel profile editing"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isSaving || isUploading}
          aria-label="Save profile changes"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" size={20} aria-hidden="true" /> : null}
          Save Changes
        </button>
      </div>
    </form>
  );
}