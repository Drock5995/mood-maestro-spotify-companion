'use client';

import { useState } from 'react';
import { SpotifyTrack } from '@/lib/spotify';
import Image from 'next/image';

interface TextToPlaylistCreatorProps {
  onFindSongs: (text: string) => void;
  onSavePlaylist: (name: string, tracks: SpotifyTrack[]) => void;
  onClear: () => void;
  isSearching: boolean;
  isSaving: boolean;
  foundTracks: SpotifyTrack[] | null;
  notFound: string[] | null;
  isSaved: boolean;
}

export const TextToPlaylistCreator: React.FC<TextToPlaylistCreatorProps> = ({
  onFindSongs,
  onSavePlaylist,
  onClear,
  isSearching,
  isSaving,
  foundTracks,
  notFound,
  isSaved,
}) => {
  const [text, setText] = useState('');
  const [playlistName, setPlaylistName] = useState('My New Playlist');

  const handleFindClick = () => {
    if (text.trim()) {
      onFindSongs(text);
    }
  };

  const handleSaveClick = () => {
    if (playlistName.trim() && foundTracks) {
      onSavePlaylist(playlistName, foundTracks);
    }
  };

  if (isSaved) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/50 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Playlist Saved! ✅</h3>
        <p className="text-green-200 mb-4">&quot;{playlistName}&quot; is now in your Spotify library.</p>
        <button
          onClick={() => {
            setText('');
            onClear();
          }}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition-colors"
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h2 className="text-2xl font-bold text-white mb-4">
        Create Playlist from Text 📋
      </h2>
      <p className="text-gray-300 mb-6">
        Paste a tracklist from a website, festival lineup, or a message, and we&apos;ll find the songs on Spotify for you.
      </p>

      {!foundTracks ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g.,&#10;Daft Punk - Around the World&#10;Justice - D.A.N.C.E.&#10;LCD Soundsystem - All My Friends"
            className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            rows={8}
            disabled={isSearching}
          />
          <button
            onClick={handleFindClick}
            disabled={isSearching || !text.trim()}
            className="w-full mt-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-full transition-all duration-200 font-bold flex items-center justify-center space-x-2"
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Finding Songs...</span>
              </>
            ) : (
              <span>Find Songs on Spotify</span>
            )}
          </button>
        </>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full sm:flex-1 bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500"
              placeholder="Enter playlist name"
            />
            <button
              onClick={handleSaveClick}
              disabled={isSaving || !playlistName.trim() || foundTracks.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-full transition-all duration-200 font-bold flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save to Spotify</span>
              )}
            </button>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">Found {foundTracks.length} songs:</h3>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 mb-4">
            {foundTracks.map((track) => (
              <div key={track.id} className="flex items-center space-x-3 bg-gray-900/50 p-2 rounded-md">
                <div className="w-10 h-10 rounded bg-gray-700 relative flex-shrink-0">
                  {track.album.images?.[0] && (
                    <Image src={track.album.images[0].url} alt={track.album.name} fill sizes="40px" className="rounded object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{track.name}</p>
                  <p className="text-gray-400 text-xs truncate">{track.artists.map(a => a.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>

          {notFound && notFound.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Couldn&apos;t find {notFound.length} songs:</h3>
              <div className="max-h-40 overflow-y-auto bg-gray-900/50 p-3 rounded-md text-gray-400 text-sm">
                {notFound.map((item, index) => (
                  <p key={index} className="truncate"> - {item}</p>
                ))}
              </div>
            </>
          )}
          
          <button onClick={() => { setText(''); onClear(); }} className="w-full text-center text-gray-400 hover:text-white mt-4 text-sm">
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};