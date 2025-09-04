'use client';

import { useState } from 'react';
import { MOOD_CATEGORIES } from '@/lib/mood-analysis';

interface MoodCreatorProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const presetMoods = ['happy', 'energetic', 'calm', 'sad']; // Using 'sad' for 'melancholic' key

export const MoodCreator: React.FC<MoodCreatorProps> = ({ onGenerate, isLoading }) => {
  const [customMood, setCustomMood] = useState('');

  const handleGenerate = (prompt: string) => {
    if (prompt.trim()) {
      onGenerate(prompt);
      setCustomMood('');
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h2 className="text-2xl font-bold text-white mb-4">
        AI Mood DJ ✨
      </h2>
      <p className="text-gray-300 mb-6">
        Tell me what you&apos;re in the mood for, and I&apos;ll craft the perfect playlist for you.
      </p>

      {/* Preset Moods */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
          Choose a Vibe
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {presetMoods.map((moodKey) => {
            const mood = MOOD_CATEGORIES[moodKey];
            return (
              <button
                key={moodKey}
                onClick={() => handleGenerate(mood.name)}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors"
              >
                <span className="text-xl">{mood.emoji}</span>
                <span className="font-medium">{mood.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Mood Input */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
          Or Describe Your Own
        </h3>
        <textarea
          value={customMood}
          onChange={(e) => setCustomMood(e.target.value)}
          placeholder="e.g., 'A rainy afternoon coffee shop vibe' or '80s movie training montage'"
          className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={() => handleGenerate(customMood)}
          disabled={isLoading || !customMood.trim()}
          className="w-full mt-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-full transition-all duration-200 font-bold flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Crafting Playlist...</span>
            </>
          ) : (
            <span>Generate Playlist</span>
          )}
        </button>
      </div>
    </div>
  );
};