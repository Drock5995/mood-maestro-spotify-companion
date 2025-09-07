"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  src: string | null;
  onEnded?: () => void;
}

export default function AudioPlayer({ src, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (src) {
        audioRef.current.src = src;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) setIsMuted(false);
      if (newVolume === 0 && !isMuted) setIsMuted(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  if (!src) {
    return null; // Don't render player if no source is provided
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-lg border-t border-white/10 p-3 flex items-center justify-between z-50" role="group" aria-label="Audio Player">
      <audio ref={audioRef} onEnded={() => { setIsPlaying(false); if (onEnded) onEnded(); }} />
      <div className="flex items-center space-x-3">
        <button 
          onClick={togglePlayPause} 
          className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          aria-label={isPlaying ? "Pause track preview" : "Play track preview"}
        >
          {isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
        </button>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMute} 
            className="text-gray-300 hover:text-white"
            aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
            aria-pressed={isMuted}
          >
            {isMuted || volume === 0 ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            aria-label="Volume slider"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={isMuted ? 0 : volume}
            aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)}% volume`}
          />
        </div>
      </div>
      <span className="text-sm text-gray-400">Playing preview...</span>
    </div>
  );
}