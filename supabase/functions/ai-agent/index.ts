import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Puter } from 'npm:@puter/js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define a tool for the AI agent to search Spotify playlists
class SpotifySearchTool {
  name = "spotify_search";
  description = "Searches Spotify for playlists based on a query. Returns a list of playlist names and their URLs.";

  async call(query: string, userId: string): Promise<string> {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the user's Spotify access token from the database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('spotify_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      console.error("Error fetching Spotify token:", tokenError);
      return "I couldn't access your Spotify account. Please ensure you are logged in and your tokens are valid.";
    }

    const accessToken = tokenData.access_token;

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("Spotify API Error:", errorBody);
        return `Spotify API error: ${response.status} ${response.statusText}. It might be an issue with your Spotify token.`;
      }

      const data = await response.json();
      const playlists = data.playlists.items;

      if (playlists.length === 0) {
        return `No playlists found on Spotify for "${query}".`;
      }

      const formattedPlaylists = playlists.map((p: any) => `- ${p.name}: ${p.external_urls.spotify}`).join('\n');
      return `Here are some playlists I found on Spotify for "${query}":\n${formattedPlaylists}`;

    } catch (error) {
      console.error("Error during Spotify search:", error);
      return "An unexpected error occurred while searching Spotify.";
    }
  }
}

// Initialize the Puter agent with the Spotify search tool
const agent = new Puter({
  tools: [new SpotifySearchTool()],
  // You can configure the LLM here if needed, e.g., for OpenAI:
  // llm: {
  //   provider: 'openai',
  //   apiKey: Deno.env.get('OPENAI_API_KEY'), // Ensure this secret is set in Supabase
  // },
  // For this example, we'll rely on Puter's default LLM or a configured one.
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'Message and userId are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Chat with the agent
    const response = await agent.chat(message, { userId });

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Error in AI agent function:', err);
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});