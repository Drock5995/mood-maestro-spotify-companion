'use client';

import React, { useState } from 'react';
import { SpotifyTrack } from '@/lib/spotify';
import { MoodCreator } from './MoodCreator';
import { GeneratedPlaylist } from './GeneratedPlaylist';
import { TextToPlaylistCreator } from './TextToPlaylistCreator';

interface PlaylistToolsSectionProps {
  // Props for AI Mood DJ
  onGeneratePlaylist: (prompt: string) => void;
  isGenerating: boolean;
  generatedPlaylist: SpotifyTrack[] | null;
  generatedPlaylistName: string;
  userId: string | null;
  onClearGeneratedPlaylist: () => void;

  // Props for Text to Playlist
  onFindSongs: (text: string) => void;
  onSavePlaylist: (name: string, tracks: SpotifyTrack[]) => void;
  onClearTextToPlaylist: () => void;
  isSearching: boolean;
  isSavingPlaylist: boolean;
  foundTracks: SpotifyTrack[] | null;
  notFound: string[] | null;
  playlistIsSaved: boolean;
}

export const PlaylistToolsSection: React.FC<PlaylistToolsSectionProps> = ({
  onGeneratePlaylist,
  isGenerating,
  generatedPlaylist,
  generatedPlaylistName,
  userId,
  onClearGeneratedPlaylist,
  onFindSongs,
  onSavePlaylist,
  onClearTextToPlaylist,
  isSearching,
  isSavingPlaylist,
  foundTracks,
  notFound,
  playlistIsSaved,
}) => {
  const [activeCreator, setActiveCreator] = useState<'mood' | 'text'>('mood');

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-4">Playlist Tools 🛠️</h2>
      <div className="flex border-b border-gray-700 mb-6">
        <button 
            onClick={() => setActiveCreator('mood')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeCreator === 'mood' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
        >
            ✨ AI Mood DJ
        </button>
        <button 
            onClick={() => setActiveCreator('text')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeCreator === 'text' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
        >
            📋 Create from Text
        </button>
      </div>

      {activeCreator === 'mood' && (
        <>
          {generatedPlaylist && userId ? (
            <GeneratedPlaylist 
              playlistName={generatedPlaylistName}
              tracks={generatedPlaylist}
              userId={userId}
              onClear={onClearGeneratedPlaylist}
            />
          ) : (
            <MoodCreator onGenerate={onGeneratePlaylist} isLoading={isGenerating} />
          )}
        </>
      )}

      {activeCreator === 'text' && (
        <TextToPlaylistCreator
          onFindSongs={onFindSongs}
          onSavePlaylist={onSavePlaylist}
          onClear={onClearTextToPlaylist}
          isSearching={isSearching}
          isSaving={isSavingPlaylist}
          foundTracks={foundTracks}
          notFound={notFound}
          isSaved={playlistIsSaved}
        />
      )}
    </section>
  );
};