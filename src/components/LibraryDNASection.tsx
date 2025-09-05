'use client';

import React from 'react';
import { MoodAnalysis } from '@/lib/spotify';
import { MoodCard } from './MoodCard';

interface LibraryDNASectionProps {
  isAnalyzingLibrary: boolean;
  libraryAnalysis: MoodAnalysis | null;
  libraryAnalysisError: string | null;
  topArtists: [string, number][];
}

export const LibraryDNASection: React.FC<LibraryDNASectionProps> = ({
  isAnalyzingLibrary,
  libraryAnalysis,
  libraryAnalysisError,
  topArtists,
}) => {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-4">Your Library DNA 🧬</h2>
      {isAnalyzingLibrary ? (
        <div className="text-center text-gray-300 p-8 bg-gray-800/50 rounded-xl">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Analyzing your liked songs...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {libraryAnalysis ? (
            <MoodCard analysis={libraryAnalysis} />
          ) : (
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex items-center justify-center">
              <p className="text-gray-400 text-center">
                {libraryAnalysisError || "Mood analysis for your library is unavailable."}
              </p>
            </div>
          )}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Top Artists</h3>
            {topArtists.length > 0 ? (
              <ul className="space-y-3">
                {topArtists.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between text-white">
                    <span>{name}</span>
                    <span className="text-sm text-gray-400">{count} liked songs</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No top artists found from your liked songs.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};