'use client';

import React from 'react';
import { PlaylistWithTracks, MoodAnalysis } from '@/lib/spotify';
import { MoodCard } from './MoodCard';

interface PlaylistMoodModalProps {
  playlist: PlaylistWithTracks;
  analysis: MoodAnalysis;
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistMoodModal: React.FC<PlaylistMoodModalProps> = ({ 
  playlist, 
  analysis, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {playlist.images?.[0] && (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className="w-16 h-16 rounded-lg"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{playlist.name}</h2>
              <p className="text-gray-400">
                {playlist.tracks.total} tracks • Mood Analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Mood Analysis */}
            <div>
              <MoodCard analysis={analysis} />
            </div>

            {/* Track List Preview */}
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Sample Tracks ({Math.min(playlist.trackDetails?.length || 0, 10)})
              </h3>
              <div className="space-y-3">
                {playlist.trackDetails?.slice(0, 10).map((track, index) => (
                  <div key={track.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                      {track.album.images?.[0] ? (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album.name}
                          className="w-full h-full rounded object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{track.name}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {track.artists.map(artist => artist.name).join(', ')}
                      </p>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                    </div>
                  </div>
                ))}
                {(playlist.trackDetails?.length || 0) > 10 && (
                  <div className="text-center py-2">
                    <span className="text-gray-400 text-sm">
                      +{(playlist.trackDetails?.length || 0) - 10} more tracks
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Audio Analysis */}
          {playlist.audioFeatures && playlist.audioFeatures.length > 0 && (
            <div className="mt-6 bg-gray-800/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Detailed Audio Analysis</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnalysisMetric
                  label="Acousticness"
                  value={getAverageFeature(playlist.audioFeatures, 'acousticness')}
                  description="How acoustic vs electric"
                  color="bg-green-500"
                />
                <AnalysisMetric
                  label="Speechiness"
                  value={getAverageFeature(playlist.audioFeatures, 'speechiness')}
                  description="Presence of spoken words"
                  color="bg-blue-500"
                />
                <AnalysisMetric
                  label="Instrumentalness"
                  value={getAverageFeature(playlist.audioFeatures, 'instrumentalness')}
                  description="Likelihood of no vocals"
                  color="bg-purple-500"
                />
                <AnalysisMetric
                  label="Liveness"
                  value={getAverageFeature(playlist.audioFeatures, 'liveness')}
                  description="Live performance feel"
                  color="bg-red-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full transition-colors"
            >
              Close Analysis
            </button>
            <button
              onClick={() => window.open(`https://open.spotify.com/playlist/${playlist.id}`, '_blank')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full transition-colors flex items-center space-x-2"
            >
              <span>Open in Spotify</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for analysis metrics
const AnalysisMetric: React.FC<{
  label: string;
  value: number;
  description: string;
  color: string;
}> = ({ label, value, description, color }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-white font-medium text-sm">{label}</span>
      <span className="text-gray-300 text-sm">{Math.round(value * 100)}%</span>
    </div>
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
      <div 
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
    <p className="text-gray-400 text-xs">{description}</p>
  </div>
);

// Helper function to calculate average feature
function getAverageFeature(features: any[], featureName: string): number {
  if (features.length === 0) return 0;
  const sum = features.reduce((acc, feature) => acc + (feature[featureName] || 0), 0);
  return sum / features.length;
}