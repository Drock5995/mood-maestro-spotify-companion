import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.52.7/mod.ts";

// CORS headers to allow our app to call this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize OpenAI client with the API key from Supabase secrets
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { moodData, primaryMood, playlistName } = await req.json();

    if (!moodData || !primaryMood || !playlistName) {
      throw new Error("Missing required data for mood analysis.");
    }

    const prompt = `
      You are a witty and insightful music sommelier named 'Mood Maestro'. 
      A user wants to understand the vibe of their Spotify playlist named "${playlistName}". 
      Based on its audio characteristics, write a short, engaging, and creative description (2-3 sentences) of its overall mood. 
      The primary mood is determined to be "${primaryMood}". Be personable and speak directly to the user.

      Playlist Audio DNA:
      - Positivity (Valence): ${Math.round(moodData.avg_valence * 100)}%
      - Energy: ${Math.round(moodData.avg_energy * 100)}%
      - Danceability: ${Math.round(moodData.avg_danceability * 100)}%
      - Tempo: ${Math.round(moodData.avg_tempo)} BPM

      Craft your description based on these stats.
    `;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 150,
    });

    const description = chatCompletion.choices[0].message.content?.trim();

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});