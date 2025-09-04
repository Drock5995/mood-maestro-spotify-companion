# Spec Provenance
- Created: 2025-09-02 14:30:00
- User: Building mood-based music player for friend Ashley
- Context: Initial MVP for auth and playlist display is complete. Pivoting to a new core feature.
- Goal: Implement an "AI Mood DJ" that generates personalized playlists based on user's mood.

# Spec Header
**Name**: Ashley's Music Mood App (Phase 2: AI Mood DJ)

**Smallest Scope**: 
- Ashley can generate a new Spotify playlist based on either a preset mood or a custom text description.
- The generated playlist will contain a mix of her liked songs and new recommendations that match the mood.
- The app will provide a simple interface to trigger the generation and a "Save to Spotify" button.
- The AI logic for interpreting text-based moods will be handled by a Supabase Edge Function.

**Non-Goals for Phase 2**:
- Manual playlist analysis or editing within the app.
- Complex audio feature visualizations.
- Music playback controls.
- Social sharing features.

# Paths to supplementary guidelines
- Basic web app patterns and deployment (to be referenced when available)
- Spotify Web API best practices
- OAuth 2.0 flow implementation
- Supabase Edge Functions for AI integration

# Decision Snapshot
**Tech Stack (Free Tools Only)**:
- Frontend: Next.js 15 (App Router) + Tailwind CSS
- Deployment: Netlify (free HTTPS hosting)
- Auth: Spotify Web API OAuth 2.0 (Authorization Code Flow)
- State Management: React useState/useContext (no external state lib needed)
- AI Logic: Supabase Edge Functions (for server-side AI processing)

**Why These Choices**:
- Next.js: Easy Netlify deployment, excellent for building modern React apps.
- Netlify: Free HTTPS domains (solves redirect URI requirement).
- Supabase Edge Functions: Provides a simple, integrated way to run server-side AI logic (like calling OpenAI) without managing a full backend.
- Client-side State: Sufficient for managing the UI state without the complexity of a large state management library.

# Architecture at a Glance
```
User Input (Mood or Text) -> Supabase Edge Function (AI Analysis) -> AI returns Playlist Parameters -> App fetches User's Liked Songs -> App gets Spotify Recommendations -> App combines songs -> Display Generated Playlist -> User saves to Spotify

AI Mood DJ Flow:
1. User selects a preset mood or types a description on the dashboard.
2. App calls a Supabase Edge Function with the user's input.
3. The Edge Function uses an AI model to translate the input into musical parameters (e.g., target valence, energy, tempo, genres).
4. The app receives these parameters.
5. The app fetches the user's liked songs from Spotify.
6. It filters the liked songs to find tracks that match the AI's parameters.
7. It uses these matching tracks and parameters to get new recommendations from Spotify.
8. The app combines the liked songs and new recommendations into a single playlist.
9. The playlist is displayed to the user with a "Save to Spotify" button.
10. Clicking save creates a new playlist in the user's Spotify account.
```

**Key Files**:
- `app/dashboard/page.tsx` - Main page, will host the new UI components.
- `components/MoodCreator.tsx` - New component for mood selection and text input.
- `components/GeneratedPlaylist.tsx` - New component to display the generated playlist.
- `lib/spotify.ts` - To be extended with methods for liked songs and playlist creation.
- `supabase/functions/generate-playlist-parameters/index.ts` - New Supabase function for AI logic.

# Implementation Plan

## Phase 1: Foundation (Completed)
- Initialize Next.js project with Tailwind.
- Implement Spotify OAuth 2.0 for user login.
- Create a dashboard to display the user's existing playlists.
- Deploy the application to Netlify with a valid HTTPS URL.

## Phase 2: AI Mood DJ

### Phase 2.1: Expand Spotify API Capabilities (1 hour)
- Update Spotify authorization scopes to include `user-library-read` and `playlist-modify-public`.
- Extend the `spotify.ts` API wrapper with new methods:
  - `getLikedSongs()`
  - `createPlaylist(userId, name)`
  - `addTracksToPlaylist(playlistId, trackUris)`

### Phase 2.2: Build Mood Input UI (2 hours)
- Create a new `MoodCreator.tsx` component.
- Design and implement the UI for selecting preset moods.
- Add a text input field and a "Generate" button for custom moods.
- Integrate this component into the main dashboard page.

### Phase 2.3: Implement AI Curation Logic (3 hours)
- Create a new Supabase Edge Function: `generate-playlist-parameters`.
- Write the prompt and logic within the function to call an AI model (e.g., OpenAI) and return structured playlist parameters.
- Implement the client-side orchestration logic that calls the Supabase function, fetches liked songs, filters them, gets recommendations, and combines the results.

### Phase 2.4: Display & Save Playlist (2 hours)
- Create a `GeneratedPlaylist.tsx` component to display the final list of tracks.
- Add a "Save to Spotify" button.
- Implement the button's `onClick` handler to call the new `createPlaylist` and `addTracksToPlaylist` methods from the Spotify API wrapper.
- Add loading states and user feedback (e.g., "Saving...", "Playlist saved!").

# Verification & Demo Script

**Success Criteria**:
1. Ashley can log in and see the new "AI Mood DJ" section.
2. She can generate a playlist by clicking a preset mood.
3. She can generate a playlist by typing a custom description.
4. The generated playlist contains a mix of her liked songs and new, relevant recommendations.
5. She can click "Save to Spotify," and the new playlist appears in her Spotify account.

**Demo Flow**:
1. Show the dashboard with the new mood creation UI.
2. First, click a preset mood like "Energetic."
3. Show the loading state, then the generated playlist with a title like "High-Voltage Hits."
4. Point out which songs are from her library and which are new.
5. Go back and use the text input. Type "music for a quiet, rainy afternoon."
6. Show the new generated playlist, titled something like "Rainy Day Reflections."
7. Click the "Save to Spotify" button.
8. Open Spotify and show the newly created playlist in her library.

**Edge Cases to Test**:
- User has very few or no liked songs.
- AI returns unexpected parameters.
- Spotify API calls fail during generation or saving.
- User enters an ambiguous or nonsensical mood description.