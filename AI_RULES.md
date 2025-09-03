# 🤖 AI Development Rules for Ashley's Music Mood App

This document outlines the core technologies and specific rules for using libraries and frameworks within this project. Adhering to these guidelines ensures consistency, maintainability, and alignment with the project's architecture.

## 🚀 Tech Stack Overview

1.  **Frontend Framework**: Next.js 15 (App Router) for server-side rendering, routing, and API routes.
2.  **UI Library**: React 19 for building interactive user interfaces.
3.  **Styling**: Tailwind CSS for utility-first, responsive design.
4.  **Language**: TypeScript for type safety and improved code quality across the entire codebase.
5.  **Authentication**: Spotify Web API OAuth 2.0 (Authorization Code Flow) for secure user login and data access.
6.  **Deployment**: Netlify for hosting, providing free HTTPS and continuous deployment.
7.  **State Management**: React hooks (`useState`, `useContext`) for local and global state, complemented by `localStorage` for persistent token storage.
8.  **API Interaction**: A custom `SpotifyAPI` wrapper (`src/lib/spotify.ts`) to centralize all Spotify API calls.
9.  **AI/Logic**: A dedicated mood analysis engine (`src/lib/mood-analysis.ts`) for processing audio features and determining playlist moods.
10. **Routing**: Next.js `next/navigation` hooks for client-side navigation and URL parameter handling.

## 📚 Library Usage Rules

*   **Next.js**:
    *   Use for all page components (`src/app/page.tsx`, `src/app/dashboard/page.tsx`), API routes (`src/app/api/callback/route.ts`), and server components (where applicable).
    *   Leverage the App Router for routing and data fetching patterns.
    *   When using `useSearchParams` in client components, always wrap the component in a `<Suspense>` boundary.

*   **React**:
    *   Exclusively use React for building all UI components.
    *   Prefer functional components and React hooks for state and lifecycle management.

*   **Tailwind CSS**:
    *   **Mandatory for all styling.** Use Tailwind utility classes for layout, spacing, colors, typography, and responsive design.
    *   Avoid custom CSS files or inline styles unless absolutely necessary for dynamic, calculated styles.

*   **TypeScript**:
    *   **Mandatory for all new and modified code.** Ensure all variables, function parameters, and return types are explicitly typed.
    *   Define interfaces for complex data structures (e.g., Spotify API responses) in `src/lib/spotify.ts`.

*   **Spotify Web API**:
    *   All interactions with the Spotify API (authentication, fetching user data, playlists, tracks, audio features) **must** go through the `SpotifyAPI` class defined in `src/lib/spotify.ts`.
    *   Extend the `SpotifyAPI` class or add new methods to it for any new Spotify functionalities.
    *   Ensure proper error handling and token management (refresh, expiration) as implemented in `src/lib/spotify.ts`.

*   **State Management**:
    *   For component-specific state, use React's `useState`.
    *   For global state that needs to be shared across multiple components, consider `useContext`.
    *   **Avoid introducing external state management libraries** (e.g., Redux, Zustand, Jotai) unless a clear and complex need arises that cannot be met by React's built-in hooks.
    *   `localStorage` is the designated mechanism for client-side persistence of Spotify access and refresh tokens.

*   **Routing (`next/navigation`)**:
    *   Use `useRouter` for programmatic navigation.
    *   Use `useSearchParams` for accessing URL query parameters. Remember the `<Suspense>` requirement.

*   **Mood Analysis Logic (`src/lib/mood-analysis.ts`)**:
    *   All algorithms, calculations, and definitions related to mood analysis (e.g., `analyzePlaylistMood`, `MOOD_CATEGORIES`) **must** reside in `src/lib/mood-analysis.ts`.
    *   Extend this file for any new mood-related features or categories.

*   **Component Structure**:
    *   Create a new, dedicated file for every new component or hook, no matter how small (e.g., `src/components/MoodCard.tsx`, `src/components/PlaylistMoodModal.tsx`).
    *   Keep components focused on a single responsibility and aim for small file sizes (ideally under 100 lines of code).
    *   Place components in `src/components/` and pages in `src/app/`.

*   **Error Handling**:
    *   Implement user-friendly error messages and graceful fallbacks for API failures or unexpected states.
    *   Avoid `try/catch` blocks that suppress errors unless specifically requested; allow errors to bubble up for better debugging.

*   **Environment Variables**:
    *   Use `NEXT_PUBLIC_` prefix for environment variables intended for client-side use.
    *   Store sensitive server-side variables without the `NEXT_PUBLIC_` prefix.
    *   Manage variables in `.env.local` for local development and in the Netlify dashboard for production.

*   **Path Aliases**:
    *   Always use the `@/` alias for imports from the `src/` directory (e.g., `import { spotify } from '@/lib/spotify';`).

*   **Code Formatting**:
    *   Adhere to the existing ESLint configuration and Prettier settings for consistent code formatting.
    *   Escape apostrophes in JSX using `&apos;` for production build compatibility.