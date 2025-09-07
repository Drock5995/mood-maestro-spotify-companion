"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import { useSpotify } from '@/context/SpotifyContext';
import { SpotifyPlaylist, SpotifyTrack } from '@/lib/spotify';
import { supabase } from '@/integrations/supabase/client';
import { SharedPlaylist } from '@/components/CommunityPlaylistCard'; // Re-using the interface
import toast from 'react-hot-toast';
import Link from 'next/link';

interface MatchedPlaylist {
  id: string; // This will be the shared_playlist_id from Supabase
  spotifyPlaylistId: string; // The actual Spotify ID
  name: string;
  owner: string;
  avatar: string;
  likes: number;
  image: string;
  match: number; // Calculated match percentage
}

const MatchCard = ({ playlist, index }: { playlist: MatchedPlaylist, index: number }) => (
  <motion.div
    className="bg-white/5 p-4 rounded-2xl flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.15 }}
  >
    <Link href={`/community?shared_id=${playlist.id}`} className="relative mb-4 block group">
      <Image src={playlist.image} alt={playlist.name} width={200} height={200} className="rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-xl">
        <span className="font-extrabold text-2xl">{playlist.match}%</span>
        <span className="text-xs font-bold uppercase">Match</span>
      </div>
    </Link>
    <h3 className="text-lg font-bold">{playlist.name}</h3>
    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
      <Image src={playlist.avatar} alt={playlist.owner} width={24} height={24} className="rounded-full" />
      <span>by {playlist.owner}</span>
    </div>
  </motion.div>
);

export default function FriendsPage() {
  const { spotifyApi, playlists: userPlaylists, loading: loadingUserPlaylists } = useSpotify();
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [matches, setMatches] = useState<MatchedPlaylist[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [communityPlaylists, setCommunityPlaylists] = useState<SharedPlaylist[]>([]);
  const [loadingCommunityPlaylists, setLoadingCommunityPlaylists] = useState(true);

  const fetchCommunityPlaylists = useCallback(async () => {
    setLoadingCommunityPlaylists(true);
    const { data, error } = await supabase
      .from('shared_playlists')
      .select(`
        id,
        spotify_playlist_id,
        playlist_name,
        playlist_cover_url,
        user_id,
        profiles ( display_name, avatar_url ),
        playlist_likes ( user_id )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching community playlists:', error);
      toast.error('Failed to load community playlists for matching.');
    } else if (data) {
      setCommunityPlaylists(data as unknown as SharedPlaylist[]);
    }
    setLoadingCommunityPlaylists(false);
  }, []);

  useEffect(() => {
    fetchCommunityPlaylists();
  }, [fetchCommunityPlaylists]);

  const calculateMatchScore = (userTracks: SpotifyTrack[], communityTracks: SpotifyTrack[]): number => {
    const userArtistIds = new Set(userTracks.flatMap(track => track.artists.map(artist => artist.id)));
    const communityArtistIds = new Set(communityTracks.flatMap(track => track.artists.map(artist => artist.id)));

    if (userArtistIds.size === 0 || communityArtistIds.size === 0) {
      return 0;
    }

    let commonArtistsCount = 0;
    userArtistIds.forEach(artistId => {
      if (communityArtistIds.has(artistId)) {
        commonArtistsCount++;
      }
    });

    // Simple match percentage based on common artists relative to the smaller set
    const maxPossibleMatches = Math.min(userArtistIds.size, communityArtistIds.size);
    return maxPossibleMatches > 0 ? Math.round((commonArtistsCount / maxPossibleMatches) * 100) : 0;
  };

  const handleFindMatches = async () => {
    if (!selectedPlaylist || !spotifyApi) {
      toast.error("Please select a playlist first.");
      return;
    }

    setIsMatching(true);
    setMatches([]);
    toast.loading("Analyzing your playlist and finding matches...", { id: 'matchingToast' });

    try {
      // 1. Get tracks for the user's selected playlist
      const userPlaylistTracks = await spotifyApi.getPlaylistTracks(selectedPlaylist.id);
      if (userPlaylistTracks.length === 0) {
        toast.error("Your selected playlist has no tracks to analyze.", { id: 'matchingToast' });
        setIsMatching(false);
        return;
      }

      const newMatches: MatchedPlaylist[] = [];
      // Limit the number of community playlists to process for performance
      const communityPlaylistsToProcess = communityPlaylists.slice(0, 20); 

      for (const communityP of communityPlaylistsToProcess) {
        try {
          const communityPlaylistTracks = await spotifyApi.getPlaylistTracks(communityP.spotify_playlist_id);
          const matchScore = calculateMatchScore(userPlaylistTracks, communityPlaylistTracks);

          if (matchScore > 0) { // Only add if there's a match
            newMatches.push({
              id: communityP.id,
              spotifyPlaylistId: communityP.spotify_playlist_id,
              name: communityP.playlist_name,
              owner: communityP.profiles?.display_name || 'A User',
              avatar: communityP.profiles?.avatar_url || `https://i.pravatar.cc/40?u=${communityP.user_id}`,
              likes: communityP.playlist_likes.length,
              image: communityP.playlist_cover_url || '/default-cover.png',
              match: matchScore,
            });
          }
        } catch (communityErr) {
          console.warn(`Failed to fetch tracks for community playlist ${communityP.playlist_name}:`, communityErr);
          // Continue to next playlist even if one fails
        }
      }

      const sortedMatches = newMatches.sort((a, b) => b.match - a.match);
      setMatches(sortedMatches);
      toast.success("Matches found!", { id: 'matchingToast' });

    } catch (error) {
      console.error("Error finding matches:", error);
      toast.error("Failed to find matches. Please try again.", { id: 'matchingToast' });
    } finally {
      setIsMatching(false);
    }
  };

  const isLoading = loadingUserPlaylists || loadingCommunityPlaylists;

  return (
    <>
      <header className="mb-6 px-2">
        <h1 className="text-4xl font-extrabold text-white">
          Playlist <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Matchmaker</span>
        </h1>
        <p className="text-gray-400 mt-2">Find community playlists that share your vibe.</p>
      </header>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="bg-white/5 p-6 rounded-2xl max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Select one of your playlists</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
              {userPlaylists.length === 0 ? (
                <p className="text-gray-400">No playlists found. Connect your Spotify account.</p>
              ) : (
                userPlaylists.slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlaylist(p)}
                    className={`px-4 py-2 rounded-full font-semibold border-2 transition-all duration-300 ${
                      selectedPlaylist?.id === p.id
                        ? 'bg-purple-500 border-purple-500 text-white scale-105'
                        : 'bg-transparent border-gray-600 hover:border-purple-500 hover:text-purple-400'
                    }`}
                  >
                    {p.name}
                  </button>
                ))
              )}
            </div>
          )}
          <button
            onClick={handleFindMatches}
            disabled={!selectedPlaylist || isMatching || isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center mx-auto"
          >
            {isMatching ? (
              <>
                <Shuffle className="animate-spin mr-2" size={20} />
                Finding Matches...
              </>
            ) : (
              <>
                <Shuffle className="mr-2" size={20} />
                Find Matches
              </>
            )}
          </button>
        </div>

        {matches.length > 0 && (
          <div className="mt-10">
            <h2 className="text-3xl font-bold text-center mb-6">Top Matches for <span className="text-purple-400">{selectedPlaylist?.name}</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, index) => (
                <MatchCard key={match.id} playlist={match} index={index} />
              ))}
            </div>
          </div>
        )}

        {!isMatching && matches.length === 0 && selectedPlaylist && (
          <div className="text-center py-16">
            <h3 className="text-2xl font-bold text-gray-400">No Matches Found</h3>
            <p className="text-gray-500 mt-2">Try selecting a different playlist or check back later for new community shares!</p>
          </div>
        )}
      </div>
    </>
  );
}