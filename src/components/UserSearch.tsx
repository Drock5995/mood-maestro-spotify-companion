"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface ProfileSearchResult {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function UserSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsId = 'user-search-results';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedSearchTerm.trim().length > 1) {
        setIsSearching(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .ilike('display_name', `%${debouncedSearchTerm}%`)
          .limit(5);

        if (error) {
          console.error("Error searching for users:", error);
          setResults([]);
        } else {
          setResults(data || []);
        }
        setIsSearching(false);
      } else {
        setResults([]);
      }
    };

    searchUsers();
  }, [debouncedSearchTerm]);

  const handleSelectUser = (userId: string) => {
    setSearchTerm('');
    setResults([]);
    setIsFocused(false);
    router.push(`/profile/${userId}`);
  };

  const showResults = isFocused && (searchTerm.length > 0 || results.length > 0);

  return (
    <div className="relative w-full sm:w-72" ref={searchContainerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          placeholder="Find a user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full"
          aria-label="Search for users by display name"
          aria-autocomplete="list"
          aria-controls={resultsId}
          aria-expanded={showResults}
          role="combobox"
          ref={searchInputRef}
        />
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" aria-label="Searching" />
        ) : searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-white"
            aria-label="Clear search term"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      {showResults && (
        <div 
          id={resultsId} 
          className="absolute top-full mt-2 w-full bg-gray-800 border border-white/10 rounded-lg shadow-lg z-10 overflow-hidden"
          role="listbox"
        >
          {results.length > 0 ? (
            <ul>
              {results.map(profile => (
                <li key={profile.id} role="option" aria-label={`Select user ${profile.display_name || 'A User'}`}>
                  <button
                    onClick={() => handleSelectUser(profile.id)}
                    className="w-full text-left flex items-center p-3 hover:bg-white/10 transition-colors"
                  >
                    <Image
                      src={profile.avatar_url || `https://i.pravatar.cc/40?u=${profile.id}`}
                      alt={`${profile.display_name || 'User'}'s avatar`}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                    <span className="font-semibold truncate">{profile.display_name || 'A User'}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isSearching && debouncedSearchTerm.length > 1 ? (
            <p className="p-4 text-center text-gray-400" role="status">No users found.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}