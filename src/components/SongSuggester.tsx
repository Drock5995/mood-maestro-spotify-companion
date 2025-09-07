"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, PlusCircle } from 'lucide-react';
import { useSpotify } from '@/context/SpotifyContext';
import { SpotifyTrack } from '@/lib/spotify';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';

interface SongSuggesterProps {
  sharedPlaylistId: string;
}

export default function SongSuggester({ sharedPlaylistId }: SongSuggesterProps) {
  const { spotifyApi, session } = useSpotify();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const search = async () => {
      if (debouncedSearchTerm && spotifyApi) {
        setIsSearching(true);
        const results = await spotifyApi.searchTracks(debouncedSearchTerm, 5);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };
    search();
  }, [debouncedSearchTerm, spotifyApi]);

  const handleSuggest = async (track: SpotifyTrack) => {
    if (!session?.user) {
      toast.error("You must be logged in to suggest a song.");
      return;
    }

    const suggestionPromise = supabase
      .from('song_suggestions')
      .insert({
        shared_playlist_id: sharedPlaylistId,
        suggester_user_id: session.user.id,
        spotify_track_id: track.id,
        spotify_track_name: track.name,
        spotify_artist_name: track.artists.map(a => a.name).join(', '),
        spotify_album_cover_url: track.album.images?.[0]?.url,
      });

    toast.promise(suggestionPromise, {
      loading: 'Submitting suggestion...',
      success: 'Suggestion submitted for review!',
      error: 'Failed to submit suggestion.',
    });
  };

  return (
    <div className="bg-white/5 p-4 rounded-lg mb-6">
      <h3 className="text-xl font-bold mb-4">Suggest a Song</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for a track..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full"
        />
      </div>
      {isSearching && <p className="text-center mt-4 text-gray-400">Searching...</p>}
      {searchResults.length > 0 && (
        <ul className="mt-4 space-y-2">
          {searchResults.map(track => (
            <li key={track.id} className="flex items-center p-2 bg-white/5 rounded-md">
              <Image src={track.album.images[0].url} alt={track.name} width={40} height={40} className="rounded mr-3" />
              <div className="flex-grow min-w-0">
                <p className="font-semibold truncate">{track.name}</p>
                <p className="text-sm text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
              </div>
              <button
                onClick={() => handleSuggest(track)}
                className="ml-3 p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Suggest this song"
              >
                <PlusCircle size={24} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}