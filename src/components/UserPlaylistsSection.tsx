'use client';

import React from 'react';
import Image from 'next/image';
import { SpotifyPlaylist } from '@/lib/spotify';

interface UserPlaylistsSectionProps {
  playlists: SpotifyPlaylist[];
  onAnalyzePlaylist: (playlist: SpotifyPlaylist) => void;
  analyzingPlaylistId: string | null;
}

export const UserPlaylistsSection: React.FC<UserPlaylistsSectionProps> = ({
  playlists,
  onAnalyzePlaylist,
  analyzingPlaylistId,
}) => {
  return (
    <section>
      <h2 className="text-3xl font-bold text-white mb-4">Your Playlists</h2>
      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-green-500/50"
            >
              <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700 relative">
                {playlist.images?.[0] ? (
                  <Image
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-white text-lg mb-1 line-clamp-2">
                {playlist.name}
              </h3>
              <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                {playlist.description || 'No description'}
              </p>
              <p className="text-green-400 text-sm mb-3">
                {playlist.tracks.total} track{playlist.tracks.total !== 1 ? 's' : ''}
              </p>
              
              <button
                onClick={() => onAnalyzePlaylist(playlist)}
                disabled={!!analyzingPlaylistId}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
              >
                {analyzingPlaylistId === playlist.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>🎨</span>
                    <span>Analyze Mood</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white mb-2">No playlists found</h3>
          <p className="text-gray-300">
            Create some playlists in Spotify and they&apos;ll appear here!
          </p>
        </div>
      )}
    </section>
  );
};