# AI Development Rules for VibeSphere

This document provides guidelines for AI developers working on this project. Adhering to these rules ensures consistency, maintainability, and adherence to the established architecture.

## Project Tech Stack

The application is built with a modern, client-side focused stack:

- **Framework**: Next.js 14+ using the App Router.
- **Language**: TypeScript for type safety and improved developer experience.
- **Styling**: Tailwind CSS for all utility-first styling. No custom CSS files should be used unless absolutely necessary.
- **Backend & Database**: Supabase is used for authentication, user profiles, and all database interactions (e.g., shared playlists, comments, likes).
- **API Integration**: All interactions with the Spotify Web API are managed through a dedicated client wrapper in `src/lib/spotify.ts`.
- **State Management**: Global state is handled via React Context (`SpotifyContext`). Local component state uses standard React hooks (`useState`, `useEffect`). No external state management libraries (like Redux or Zustand) are used.
- **Animation**: Framer Motion is the designated library for all UI animations and page transitions.
- **Icons**: `lucide-react` provides the icon set for the entire application.
- **Data Visualization**: Recharts is used for creating charts, such as the genre analysis graph.
- **Deployment**: The application is deployed and hosted on Netlify.

## Library Usage Guidelines

To maintain a clean and consistent codebase, please follow these rules for using specific libraries:

- **UI Components**:
  - **DO**: Use pre-built `shadcn/ui` components whenever possible for common UI elements like Buttons, Cards, Dialogs, etc.
  - **DO NOT**: Create custom components for elements that already exist in `shadcn/ui`.

- **Styling**:
  - **DO**: Use Tailwind CSS classes directly in your JSX for all styling needs.
  - **DO NOT**: Write custom CSS in `.css` files or use inline `style` objects, except for rare cases where Tailwind cannot achieve the desired effect (e.g., complex `keyframes`).

- **State Management**:
  - **DO**: Use `useState` for simple, local component state.
  - **DO**: Use the existing `SpotifyContext` (`useSpotify` hook) to access global data like the authenticated user, playlists, and the Spotify API client.
  - **DO NOT**: Introduce new global state management libraries (e.g., Redux, Zustand, Jotai).

- **Data Fetching & Mutations**:
  - **DO**: Use the `spotifyApi` instance from `useSpotify()` for all interactions with the Spotify API.
  - **DO**: Use the Supabase client (`import { supabase } from '@/integrations/supabase/client'`) for all database operations (reading/writing to tables like `profiles`, `shared_playlists`, etc.).
  - **DO NOT**: Use `fetch` directly to interact with Spotify or Supabase.

- **Icons**:
  - **DO**: Import icons directly from `lucide-react`.
  - **DO NOT**: Use SVGs directly or install other icon libraries.

- **Animations**:
  - **DO**: Use `framer-motion` for component animations (e.g., `motion.div`) and page transitions (`AnimatePresence`).
  - **DO NOT**: Use CSS transitions or other animation libraries to ensure a consistent feel.

- **Charts**:
  - **DO**: Use `recharts` for any data visualization needs.
  - **DO NOT**: Install other charting libraries like Chart.js or D3.