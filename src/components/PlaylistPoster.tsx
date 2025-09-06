"use client";

import React from 'react';
import Image from 'next/image';
import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';
import { Music } from 'lucide-react';

interface PlaylistPosterProps {
  playlist: SpotifyPlaylist;
  tracks: SpotifyTrack[];
  artists: SpotifyArtist[];
  posterRef: React.RefObject<HTMLDivElement>;
}

const PlaylistPoster = ({ playlist, tracks, artists, posterRef }: PlaylistPosterProps) => {
  const topTracks = tracks.slice(0, 5);
  const topArtists = artists
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3);

  return (
    <div ref={posterRef} className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 w-[400px] h-[600px] text-white flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Image src={playlist.images[0].url} alt={playlist.name} width={100} height={100} className="rounded-lg shadow-lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm uppercase tracking-widest text-purple-300">VibeSphere Mix</p>
          <h1 className="text-3xl font-extrabold leading-tight truncate">{playlist.name}</h1>
        </div>
      </div>

      {/* Top Tracks */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2 border-b-2 border-purple-400 pb-1 inline-block">Top Tracks</h2>
        <ul className="space-y-2">
          {topTracks.map(track => (
            <li key={track.id} className="flex items-center text-sm truncate">
              <Music size={14} className="mr-2 text-gray-400 flex-shrink-0" />
              <span className="font-semibold truncate">{track.name}</span>
              <span className="text-gray-400 ml-2 truncate">- {track.artists.map(a => a.name).join(', ')}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Top Artists */}
      <div className="mb-auto">
        <h2 className="font-bold text-lg mb-3 border-b-2 border-purple-400 pb-1 inline-block">Featuring Artists</h2>
        <div className="flex space-x-4">
          {topArtists.map(artist => (
            <div key={artist.id} className="text-center">
              {artist.images[0]?.url && (
                <Image src={artist.images[0].url} alt={artist.name} width={64} height={64} className="rounded-full object-cover" />
              )}
              <p className="text-xs mt-2 font-semibold truncate w-16">{artist.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t border-white/20 pt-4 mt-4">
        <p className="text-lg font-bold">VibeSphere</p>
        <p className="text-xs text-gray-400">Your Social Spotify Hub</p>
      </div>
    </div>
  );
};

export default PlaylistPoster;