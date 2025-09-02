// Test script for mood analysis functionality
const { analyzePlaylistMood, MOOD_CATEGORIES } = require('./src/lib/mood-analysis');

// Mock audio features for testing
const testAudioFeatures = [
  // Happy, energetic tracks
  {
    id: 'track1',
    valence: 0.9,
    energy: 0.8,
    danceability: 0.85,
    tempo: 128,
    acousticness: 0.1,
    instrumentalness: 0.0,
    loudness: -5,
    speechiness: 0.05
  },
  {
    id: 'track2',
    valence: 0.85,
    energy: 0.9,
    danceability: 0.9,
    tempo: 135,
    acousticness: 0.05,
    instrumentalness: 0.0,
    loudness: -4,
    speechiness: 0.03
  },
  // Slightly mellower but still positive
  {
    id: 'track3',
    valence: 0.7,
    energy: 0.6,
    danceability: 0.7,
    tempo: 110,
    acousticness: 0.3,
    instrumentalness: 0.1,
    loudness: -8,
    speechiness: 0.02
  }
];

console.log('🎵 Testing Mood Analysis System...\n');

const analysis = analyzePlaylistMood(testAudioFeatures);

console.log('=== MOOD ANALYSIS RESULTS ===');
console.log(`Primary Mood: ${analysis.overall_mood} ${MOOD_CATEGORIES[analysis.overall_mood].emoji}`);
console.log(`Description: ${analysis.description}\n`);

console.log('Mood Scores:');
Object.entries(analysis.mood_scores)
  .sort(([,a], [,b]) => b - a)
  .forEach(([mood, score]) => {
    const category = MOOD_CATEGORIES[mood];
    console.log(`  ${category.emoji} ${category.name}: ${Math.round(score * 100)}%`);
  });

console.log('\nAudio Characteristics:');
console.log(`  Positivity: ${Math.round(analysis.audio_characteristics.avg_valence * 100)}%`);
console.log(`  Energy: ${Math.round(analysis.audio_characteristics.avg_energy * 100)}%`);
console.log(`  Danceability: ${Math.round(analysis.audio_characteristics.avg_danceability * 100)}%`);
console.log(`  Tempo: ${Math.round(analysis.audio_characteristics.avg_tempo)} BPM`);

console.log('\nColor Scheme:');
console.log(`  Primary: ${analysis.color_scheme.primary}`);
console.log(`  Secondary: ${analysis.color_scheme.secondary}`);
console.log(`  Accent: ${analysis.color_scheme.accent}`);

// Test with sad playlist
console.log('\n=== TESTING SAD PLAYLIST ===');
const sadAudioFeatures = [
  {
    id: 'sad1',
    valence: 0.2,
    energy: 0.3,
    danceability: 0.4,
    tempo: 70,
    acousticness: 0.8,
    instrumentalness: 0.2,
    loudness: -12,
    speechiness: 0.02
  },
  {
    id: 'sad2',
    valence: 0.15,
    energy: 0.25,
    danceability: 0.3,
    tempo: 65,
    acousticness: 0.9,
    instrumentalness: 0.1,
    loudness: -15,
    speechiness: 0.01
  }
];

const sadAnalysis = analyzePlaylistMood(sadAudioFeatures);
console.log(`Primary Mood: ${sadAnalysis.overall_mood} ${MOOD_CATEGORIES[sadAnalysis.overall_mood].emoji}`);
console.log(`Description: ${sadAnalysis.description}`);