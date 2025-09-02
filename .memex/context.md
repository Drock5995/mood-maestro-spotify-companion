# Ashley's Music Mood App - Project Rules

## Project Overview
- **Purpose**: Spotify companion app for Ashley to connect with her account and view playlists
- **Phase**: MVP (Phase 1) - Authentication and basic playlist display only
- **Deferred Features**: AI mood analysis, music playback, playlist modification (Phase 2)

## Tech Stack & Architecture
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + TypeScript
- **Authentication**: Spotify Web API OAuth 2.0 (Authorization Code Flow)
- **Deployment**: Netlify (free HTTPS hosting to satisfy Spotify redirect requirements)
- **State Management**: React hooks + localStorage (no external state library)
- **No Backend**: Client-side token management for read-only operations

## Spotify Integration Patterns
- **OAuth Flow**: Authorization Code Flow (not implicit flow)
- **Token Storage**: localStorage for access tokens (client-side approach)
- **API Wrapper**: Centralized in `lib/spotify.ts` with error handling
- **Redirect URI**: Must be HTTPS - development: localhost:3000, production: netlify domain
- **Required Scopes**: `user-read-private user-read-email playlist-read-private playlist-read-collaborative`

## Environment Configuration
```
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=spotify_client_id
SPOTIFY_CLIENT_SECRET=spotify_client_secret  
```
- Client ID is public (NEXT_PUBLIC prefix)
- Client Secret only used server-side in OAuth callback
- Development uses localhost:3000/api/callback
- Production requires updating Spotify app with Netlify domain

## File Structure Conventions
```
├── src/app/
│   ├── api/callback/route.ts    # OAuth callback handler
│   ├── dashboard/page.tsx       # Playlist display after auth
│   └── page.tsx                 # Landing page with login
├── lib/spotify.ts               # Spotify API wrapper
├── .env.local                   # Environment variables
└── netlify.toml                 # Deployment config
```

## UI/UX Design Patterns
- **Color Scheme**: Green/black gradient backgrounds (Spotify-inspired)
- **Personality**: Professional yet playful, Ashley-specific messaging
- **Typography**: Clean, modern with emoji accents (🎵, 🎨, etc.)
- **Loading States**: Spinner animations with descriptive text
- **Error Handling**: User-friendly messages with retry options
- **Responsive**: Grid layouts that adapt mobile -> desktop

## Development Workflow
- **Git Commits**: Include Memex attribution footer
- **Task Management**: Follow plan.md structure with [P:section-step] tags
- **Environment**: .env.local for secrets, never commit credentials
- **Testing**: Manual testing of OAuth flow end-to-end required

## Deployment Requirements
1. Deploy to Netlify with environment variables
2. Update Spotify app redirect URI with production domain
3. Test complete authentication flow on live site
4. Verify HTTPS redirect URI works with Spotify OAuth

## Known Constraints
- Disk space issues during npm install (use minimal package approach)
- Spotify OAuth requires HTTPS redirect URI (localhost exception for dev)
- Client-side token management (acceptable for read-only playlist access)
- Free tools only - no paid services or libraries