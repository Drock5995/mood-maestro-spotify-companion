'use client';

import React from 'react';
import { MoodAnalysis, MOOD_CATEGORIES } from '@/lib/mood-analysis';

interface MoodCardProps {
  analysis: MoodAnalysis;
  className?: string;
}

export const MoodCard: React.FC<MoodCardProps> = ({ analysis, className = '' }) => {
  const primaryMoodCategory = MOOD_CATEGORIES[analysis.overall_mood];
  
  return (
    <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{primaryMoodCategory.emoji}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{primaryMoodCategory.name}</h3>
            <p className="text-gray-300 text-sm">{primaryMoodCategory.description}</p>
          </div>
        </div>
        <div 
          className="w-8 h-8 rounded-full border-2 border-white/20"
          style={{ backgroundColor: analysis.color_scheme.primary }}
        />
      </div>

      {/* Description */}
      <p className="text-gray-200 mb-6 leading-relaxed">
        {analysis.description}
      </p>

      {/* Mood Scores */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Mood Breakdown
        </h4>
        {Object.entries(analysis.mood_scores)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 4)
          .map(([mood, score]) => {
            const category = MOOD_CATEGORIES[mood];
            return (
              <div key={mood} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{category.emoji}</span>
                  <span className="text-white text-sm">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.round(score * 100)}%`,
                        backgroundColor: category.colorScheme.primary
                      }}
                    />
                  </div>
                  <span className="text-gray-300 text-xs w-8">
                    {Math.round(score * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Audio Characteristics */}
      <div className="border-t border-gray-700/50 pt-4">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
          Audio Insights
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-green-400 text-lg font-bold">
              {Math.round(analysis.audio_characteristics.avg_valence * 100)}%
            </div>
            <div className="text-gray-400 text-xs">Positivity</div>
          </div>
          <div className="text-center">
            <div className="text-orange-400 text-lg font-bold">
              {Math.round(analysis.audio_characteristics.avg_energy * 100)}%
            </div>
            <div className="text-gray-400 text-xs">Energy</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 text-lg font-bold">
              {Math.round(analysis.audio_characteristics.avg_danceability * 100)}%
            </div>
            <div className="text-gray-400 text-xs">Danceability</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 text-lg font-bold">
              {Math.round(analysis.audio_characteristics.avg_tempo)}
            </div>
            <div className="text-gray-400 text-xs">BPM</div>
          </div>
        </div>
      </div>
    </div>
  );
};