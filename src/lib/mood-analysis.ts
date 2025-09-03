import { SpotifyAudioFeatures, MoodAnalysis } from './spotify';

export type { MoodAnalysis };

export interface MoodCategory {
  name: string;
  description: string;
  emoji: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const MOOD_CATEGORIES: Record<string, MoodCategory> = {
  happy: {
    name: 'Happy',
    description: 'Upbeat, joyful, and positive vibes',
    emoji: '😊',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FFA500', 
      accent: '#FF8C00'
    }
  },
  sad: {
    name: 'Melancholic',
    description: 'Somber, reflective, and introspective',
    emoji: '😢',
    colorScheme: {
      primary: '#4682B4',
      secondary: '#5F9EA0',
      accent: '#708090'
    }
  },
  energetic: {
    name: 'Energetic',
    description: 'High-energy, pump-up, and motivating',
    emoji: '⚡',
    colorScheme: {
      primary: '#FF4500',
      secondary: '#FF6347',
      accent: '#DC143C'
    }
  },
  calm: {
    name: 'Calm',
    description: 'Peaceful, relaxing, and soothing',
    emoji: '🌙',
    colorScheme: {
      primary: '#98FB98',
      secondary: '#90EE90',
      accent: '#20B2AA'
    }
  },
  romantic: {
    name: 'Romantic',
    description: 'Intimate, loving, and tender',
    emoji: '💕',
    colorScheme: {
      primary: '#FF69B4',
      secondary: '#FFB6C1',
      accent: '#DDA0DD'
    }
  },
  angry: {
    name: 'Intense',
    description: 'Aggressive, powerful, and raw',
    emoji: '🔥',
    colorScheme: {
      primary: '#B22222',
      secondary: '#DC143C',
      accent: '#8B0000'
    }
  }
};

/**
 * Analyzes playlist mood based on Spotify audio features
 */
export function analyzePlaylistMood(audioFeatures: SpotifyAudioFeatures[]): MoodAnalysis {
  if (audioFeatures.length === 0) {
    return getDefaultMoodAnalysis();
  }

  // Calculate average audio characteristics
  const avgFeatures = calculateAverageFeatures(audioFeatures);
  
  // Calculate mood scores based on audio features
  const moodScores = calculateMoodScores(avgFeatures);
  
  // Determine primary mood
  const primaryMood = Object.entries(moodScores)
    .sort(([,a], [,b]) => b - a)[0][0];
  
  // Get mood category
  const moodCategory = MOOD_CATEGORIES[primaryMood];
  
  // Generate a much smarter, template-based description
  const description = generateSmarterDescription(primaryMood, avgFeatures);
  
  return {
    overall_mood: primaryMood,
    mood_scores: moodScores,
    audio_characteristics: {
      avg_valence: avgFeatures.valence,
      avg_energy: avgFeatures.energy,
      avg_danceability: avgFeatures.danceability,
      avg_tempo: avgFeatures.tempo
    },
    description,
    color_scheme: moodCategory.colorScheme
  };
}

function calculateAverageFeatures(features: SpotifyAudioFeatures[]) {
  const totals = features.reduce((acc, feature) => ({
    valence: acc.valence + feature.valence,
    energy: acc.energy + feature.energy,
    danceability: acc.danceability + feature.danceability,
    tempo: acc.tempo + feature.tempo,
    acousticness: acc.acousticness + feature.acousticness,
    instrumentalness: acc.instrumentalness + feature.instrumentalness,
    loudness: acc.loudness + feature.loudness,
    speechiness: acc.speechiness + feature.speechiness
  }), {
    valence: 0,
    energy: 0, 
    danceability: 0,
    tempo: 0,
    acousticness: 0,
    instrumentalness: 0,
    loudness: 0,
    speechiness: 0
  });

  const count = features.length;
  return {
    valence: totals.valence / count,
    energy: totals.energy / count,
    danceability: totals.danceability / count,
    tempo: totals.tempo / count,
    acousticness: totals.acousticness / count,
    instrumentalness: totals.instrumentalness / count,
    loudness: totals.loudness / count,
    speechiness: totals.speechiness / count
  };
}

function calculateMoodScores(avgFeatures: ReturnType<typeof calculateAverageFeatures>) {
  return {
    happy: Math.min(1, avgFeatures.valence * 1.2 + avgFeatures.energy * 0.8),
    sad: Math.min(1, (1 - avgFeatures.valence) * 1.3 + avgFeatures.acousticness * 0.7),
    energetic: Math.min(1, avgFeatures.energy * 1.2 + avgFeatures.danceability * 0.8 + (avgFeatures.tempo > 120 ? 0.3 : 0)),
    calm: Math.min(1, (1 - avgFeatures.energy) * 1.1 + avgFeatures.acousticness * 0.9),
    romantic: Math.min(1, avgFeatures.valence * 0.8 + (1 - avgFeatures.energy) * 0.6 + avgFeatures.acousticness * 0.6),
    angry: Math.min(1, avgFeatures.energy * 1.1 + (avgFeatures.loudness / -10) * 0.5 + (1 - avgFeatures.valence) * 0.4)
  };
}

function generateSmarterDescription(
  primaryMood: string, 
  avgFeatures: ReturnType<typeof calculateAverageFeatures>
): string {
  const moodName = MOOD_CATEGORIES[primaryMood].name.toLowerCase();
  
  // Describe the core feeling
  let coreDesc = `This playlist has a distinctly ${moodName} vibe. `;
  if (avgFeatures.valence > 0.75) coreDesc += "It's packed with overwhelmingly positive and uplifting tracks. ";
  if (avgFeatures.valence < 0.25) coreDesc += "It leans into a deeply introspective and somber soundscape. ";

  // Describe the energy and tempo
  let energyDesc = "";
  if (avgFeatures.energy > 0.8) energyDesc = "Expect a high-octane, powerful listening experience";
  else if (avgFeatures.energy < 0.3) energyDesc = "Perfect for winding down, with a very mellow and relaxed energy";
  else energyDesc = "It strikes a balance with moderate energy";

  if (avgFeatures.tempo > 130) energyDesc += " and a fast, driving tempo. ";
  else if (avgFeatures.tempo < 90) energyDesc += " and a slower, more deliberate pace. ";
  else energyDesc += ". ";

  // Add an interesting detail
  let detailDesc = "";
  if (avgFeatures.danceability > 0.75) detailDesc = "With its high danceability, you might find it hard to sit still. ";
  if (avgFeatures.acousticness > 0.7) detailDesc = "The sound is predominantly acoustic, giving it a raw and organic feel. ";
  if (avgFeatures.instrumentalness > 0.6) detailDesc = "It's heavily instrumental, letting the music itself do all the talking. ";

  return coreDesc + energyDesc + detailDesc;
}

function getDefaultMoodAnalysis(): MoodAnalysis {
  return {
    overall_mood: 'calm',
    mood_scores: {
      happy: 0.5,
      sad: 0.3,
      energetic: 0.4,
      calm: 0.7,
      romantic: 0.4,
      angry: 0.2
    },
    audio_characteristics: {
      avg_valence: 0.5,
      avg_energy: 0.5,
      avg_danceability: 0.5,
      avg_tempo: 120
    },
    description: 'This playlist has a balanced mix of moods.',
    color_scheme: MOOD_CATEGORIES.calm.colorScheme
  };
}

/**
 * Get mood recommendations based on time of day or activity
 */
export function getMoodRecommendations(currentHour: number = new Date().getHours()): MoodCategory[] {
  if (currentHour >= 6 && currentHour < 12) {
    // Morning: energetic, happy
    return [MOOD_CATEGORIES.energetic, MOOD_CATEGORIES.happy, MOOD_CATEGORIES.calm];
  } else if (currentHour >= 12 && currentHour < 18) {
    // Afternoon: happy, energetic, romantic
    return [MOOD_CATEGORIES.happy, MOOD_CATEGORIES.energetic, MOOD_CATEGORIES.romantic];
  } else if (currentHour >= 18 && currentHour < 22) {
    // Evening: calm, romantic, happy
    return [MOOD_CATEGORIES.calm, MOOD_CATEGORIES.romantic, MOOD_CATEGORIES.happy];
  } else {
    // Night: calm, sad, romantic
    return [MOOD_CATEGORIES.calm, MOOD_CATEGORIES.sad, MOOD_CATEGORIES.romantic];
  }
}