# VibeSphere - Project Context

## Project Overview
- **Purpose**: A social Spotify companion app for users to connect their Spotify accounts, analyze playlists, share them with a community, discover new music, and interact with friends.
- **Current Phase**: Feature-rich MVP with core social and discovery functionalities.
- **Production URL**: https://ashley-mood-maestro.netlify.app (or similar Netlify domain)

## Tech Stack & Architecture
- **Frontend Framework**: Next.js 14+ using the App Router for server and client components.
- **Language**: TypeScript for type safety across the application.
- **Styling**: Tailwind CSS for utility-first styling. Custom CSS is minimal and used only for specific global styles or animations not achievable with Tailwind. `shadcn/ui` components are a preferred choice for common UI elements.
- **Backend & Database**: Supabase is the primary backend, handling:
    -   **Authentication**: User login via Spotify OAuth.
    -   **Database**: Storing user profiles, shared playlists, likes, comments, song suggestions, friend relationships, messages, and push notification subscriptions.
    -   **Edge Functions**: Server-side logic for tasks like sending push notifications.
    -   **Realtime**: Used for instant updates on comments, friend requests, and messages.
- **API Integration**:
    -   **Spotify Web API**: All interactions are managed through a dedicated client wrapper in `src/lib/spotify.ts`.
    -   **Supabase Client**: `src/integrations/supabase/client.ts` for all database and auth operations.
- **State Management**: Primarily React Context (`SpotifyContext`) for global state (user, playlists, Spotify API client, audio playback control) and standard React hooks (`useState`, `useEffect`) for local component state. No external state management libraries.
- **Animation**: Framer Motion is used for all UI animations and page transitions, ensuring a consistent and fluid user experience.
- **Icons**: `lucide-react` provides a comprehensive and consistent icon set.
- **Data Visualization**: Recharts is used for creating charts, such as genre analysis graphs on the dashboard and playlist detail views.
- **Utilities**:
    -   `react-hot-toast`: For user feedback and notifications.
    -   `date-fns`: For date formatting.
    -   `html-to-image`: For generating shareable playlist posters.
    -   `@dicebear/core` & `@dicebear/collection`: For generating unique user avatars.
- **Deployment**: The application is deployed and hosted on Netlify.

## Core Functionality
-   **User Authentication**: Secure Spotify OAuth 2.0 (Authorization Code Flow) via Supabase.
-   **User Profiles**: View and edit personal profiles (display name, avatar), including Dicebear avatar generation.
-   **Spotify Playlists**: Display user's Spotify playlists on the dashboard.
-   **Community Playlists**: Browse, like, and comment on playlists shared by other users.
-   **Playlist Detail View**: In-depth view of playlists, including track listing, audio previews, genre analysis, and social interaction.
-   **Song Suggestions**: Users can suggest songs for shared playlists; playlist owners can accept or reject them.
-   **Friend Management**: Send, accept, and decline friend requests.
-   **Direct Messaging**: Real-time chat with friends.
-   **Playlist Matchmaker**: Algorithm to find community playlists that match a user's selected playlist based on artists.
-   **Playlist Poster Generation**: Create and download shareable image posters for playlists.
-   **Audio Playback**: Integrated player for Spotify track previews.
-   **Push Notifications**: Real-time notifications for friend requests and new messages.

## Spotify Integration Patterns
-   **OAuth Flow**: Authorization Code Flow, managed by Supabase Auth.
-   **Required Scopes**: `user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read playlist-modify-public playlist-modify-private`.
-   **Token Management**: Spotify access and refresh tokens are managed by Supabase Auth and stored in the `spotify_tokens` table, with client-side access token caching in `localStorage` for the `SpotifyAPI` wrapper.
-   **API Wrapper**: Centralized in `src/lib/spotify.ts` for all Spotify API calls, including error handling and token expiration logic.
-   **Redirect URI**: Configured in Netlify environment variables and Spotify App settings.

## Supabase Integration Patterns
-   **Client**: `src/integrations/supabase/client.ts` provides the `supabase` client instance.
-   **Authentication**: `supabase.auth.signInWithOAuth` for Spotify login, `supabase.auth.onAuthStateChange` for session management.
-   **Database Schema**:
    -   `profiles`: Stores user display name and avatar URL.
    -   `spotify_tokens`: Stores Spotify access and refresh tokens for users.
    -   `shared_playlists`: Stores metadata for user-shared Spotify playlists.
    -   `playlist_likes`: Records user likes on shared playlists.
    -   `playlist_comments`: Stores comments on shared playlists.
    -   `song_suggestions`: Manages song suggestions for shared playlists.
    -   `friends`: Manages friendship relationships and requests.
    -   `messages`: Stores direct messages between users.
    -   `push_subscriptions`: Stores user push notification subscription details.
-   **Row Level Security (RLS)**: Enabled and configured for all tables to ensure data privacy and security.
-   **Database Functions**:
    -   `handle_new_user`: Automatically creates a profile entry upon new user signup.
    -   `upsert_spotify_tokens`: Automatically saves/updates Spotify tokens upon user login/refresh.
    -   `get_playlist_owner`: Helper function for RLS policies.
-   **Edge Functions**: `supabase/functions/send-push/index.ts` for sending web push notifications.
-   **Realtime**: Used for instant updates on `friends`, `playlist_comments`, `song_suggestions`, and `messages` tables.

## Environment Configuration
-   `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`: Public Spotify Client ID.
-   `SPOTIFY_CLIENT_SECRET`: Spotify Client Secret (server-side only).
-   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Public VAPID key for push notifications.
-   `VAPID_PRIVATE_KEY`: Private VAPID key for push notifications (server-side only).
-   `NEXT_PUBLIC_SITE_URL`: Base URL for the deployed application, used for OAuth redirects.
-   Supabase URL and keys are automatically managed by the Supabase client.

## File Structure Conventions
-   `src/app/`: Next.js App Router structure.
    -   `api/callback/route.ts`: Handles Spotify OAuth callback (not provided in current context, but implied by flow).
    -   `(main)/`: Grouped routes requiring authentication and the main layout.
    -   `login/page.tsx`: Dedicated login page.
-   `src/lib/spotify.ts`: Centralized Spotify API wrapper.
-   `src/integrations/supabase/client.ts`: Supabase client instance.
-   `src/components/`: Reusable React components.
-   `src/context/SpotifyContext.tsx`: React Context for global Spotify-related state.
-   `src/hooks/useDebounce.ts`: Custom hook for debouncing input.
-   `public/sw.js`: Service Worker for push notifications.
-   `supabase/functions/`: Supabase Edge Functions.

## Critical Development Patterns
-   **TypeScript Path Mapping**: `@/*` maps to `./src/*`.
-   **Next.js App Router**: `useSearchParams()` wrapped in `Suspense` boundaries.
-   **ESLint**: Strict rules, requiring apostrophe escaping in JSX.
-   **Netlify Builds**: Uses `@netlify/plugin-nextjs` for Next.js runtime.
-   **UI Component Usage**: Preference for `shadcn/ui` components where applicable, otherwise custom Tailwind-styled components.
-   **Audio Playback**: Centralized `AudioPlayer` component controlled via `SpotifyContext`.
-   **Avatar Generation**: `dicebear` library used for dynamic avatar creation.

## UI/UX Design Patterns
-   **Color Scheme**: Dark theme with purple, pink, emerald, and blue accents, inspired by Spotify's aesthetic.
-   **Typography**: Clean, modern sans-serif fonts.
-   **Loading States**: Spinners and descriptive text for data fetching.
-   **Error Handling**: User-friendly toast messages via `react-hot-toast`.
-   **Responsiveness**: Adaptive layouts for mobile, tablet, and desktop.

## Deployment & Production
-   **GitHub Repository**: https://github.com/Drock5995/mood-maestro-spotify-companion
-   **Netlify Site ID**: 2e758c9c-b919-41bf-bf60-c34109f38516
-   **Build Process**: `pnpm install && pnpm run build` leveraging Netlify's Next.js runtime.
-   **Environment Variables**: Managed in Netlify dashboard.

## Success Metrics (Achieved)
-   ✅ Successful Spotify OAuth flow and session management.
-   ✅ Display of user's Spotify playlists.
-   ✅ Community features: sharing, liking, commenting, song suggestions.
-   ✅ Friend management and direct messaging.
-   ✅ Dynamic user profiles with editing capabilities.
-   ✅ Playlist Matchmaker functionality.
-   ✅ Push notifications for key social interactions.
-   ✅ Playlist poster generation.
-   ✅ Integrated audio player for track previews.
-   ✅ Stable production deployment on Netlify.