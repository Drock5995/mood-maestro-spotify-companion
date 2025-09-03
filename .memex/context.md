# Ashley's Music Mood App - Project Rules

## Project Overview
- **Purpose**: Spotify companion app for Ashley to connect with her account and view playlists
- **Phase**: MVP (Phase 1) - COMPLETED ✅ Authentication and basic playlist display working in production
- **Deferred Features**: AI mood analysis, music playbook, playlist modification (Phase 2)
- **Production URL**: https://ashley-mood-maestro.netlify.app (or similar Netlify domain)

## Tech Stack & Architecture
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + TypeScript
- **Authentication**: Spotify Web API OAuth 2.0 (Authorization Code Flow)
- **Deployment**: Netlify (free HTTPS hosting) - DEPLOYED SUCCESSFULLY ✅
- **State Management**: React hooks + localStorage (no external state library)
- **No Backend**: Client-side token management for read-only operations

## Spotify Integration Patterns
- **OAuth Flow**: Authorization Code Flow (not implicit flow)
- **Token Storage**: localStorage for access tokens (client-side approach)
- **API Wrapper**: Centralized in `src/lib/spotify.ts` with error handling
- **Redirect URI**: PRODUCTION ONLY - HTTPS required: https://ashley-mood-maestro.netlify.app/api/callback
- **Required Scopes**: `user-read-private user-read-email playlist-read-private playlist-read-collaborative`
- **Client Credentials**: Stored in Netlify environment variables (working in production)

## Environment Configuration
```
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=129fee3b25b94e74bca1ea52d32687ad
SPOTIFY_CLIENT_SECRET=671029908a054788bbac39be47c92343
```
- Client ID is public (NEXT_PUBLIC prefix)
- Client Secret only used server-side in OAuth callback
- Production deployment uses Netlify environment variables
- **CRITICAL**: Spotify redirect URI must match exactly: https://ashley-mood-maestro.netlify.app/api/callback

## File Structure Conventions (LEARNED DURING DEVELOPMENT)
```
├── src/app/
│   ├── api/callback/route.ts    # OAuth callback handler
│   ├── dashboard/page.tsx       # Playlist display after auth (wrapped in Suspense)
│   └── page.tsx                 # Landing page with login
├── src/lib/spotify.ts           # Spotify API wrapper (MUST be in src/lib for @/* imports)
├── .env.local                   # Environment variables (local only)
└── netlify.toml                 # Deployment config with Next.js runtime
```

## Critical Development Patterns (DISCOVERED)
- **TypeScript Path Mapping**: `@/*` maps to `./src/*` - all imports must be in src/ directory
- **Next.js App Router**: useSearchParams() MUST be wrapped in Suspense boundary for SSG compatibility
- **ESLint Production**: All apostrophes in JSX must be escaped (&apos;) for production builds
- **Netlify Builds**: Uses Next.js Runtime v5.12.1, requires specific publish directory (.next)

## UI/UX Design Patterns
- **Color Scheme**: Green/black gradient backgrounds (Spotify-inspired)
- **Personality**: Professional yet playful, Ashley-specific messaging
- **Typography**: Clean, modern with emoji accents (🎵, 🎨, etc.)
- **Loading States**: Spinner animations with descriptive text + Suspense fallbacks
- **Error Handling**: User-friendly messages with retry options
- **Responsive**: Grid layouts that adapt mobile -> desktop

## Deployment & Production (COMPLETED SUCCESSFULLY)
- **GitHub Repository**: https://github.com/Drock5995/mood-maestro-spotify-companion
- **Netlify Site ID**: 2e758c9c-b919-41bf-bf60-c34109f38516
- **Authentication**: GitHub Personal Access Token required for pushes
- **Build Process**: npm run build -> Next.js static generation -> Netlify hosting
- **Environment Variables**: Set in Netlify dashboard, working in production
- **Spotify App Config**: Redirect URI configured and working with live site

## Development Workflow
- **Git Commits**: Include Memex attribution footer
- **Task Management**: Follow plan.md structure with [P:section-step] tags
- **Environment**: .env.local for secrets, never commit credentials
- **Testing**: OAuth flow tested end-to-end on production site ✅

## Known Issues & Solutions
- **useSearchParams Error**: Always wrap in Suspense boundary for App Router compatibility
- **Module Resolution**: Keep all imports in src/ directory for proper @/* path mapping
- **ESLint Strict Mode**: Escape all apostrophes in JSX for production builds
- **Spotify OAuth**: Requires exact HTTPS redirect URI match, no localhost in production
- **Netlify Builds**: Use command line deployment with site ID for faster iteration

## Success Metrics (ACHIEVED)
- ✅ Successful OAuth flow with Spotify
- ✅ Playlists loading and displaying correctly
- ✅ Responsive design working on all devices  
- ✅ Production deployment stable and accessible
- ✅ Clean build process with no errors or warnings