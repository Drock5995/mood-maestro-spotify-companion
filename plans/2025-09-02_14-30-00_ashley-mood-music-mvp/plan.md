# Spec Provenance
- Created: 2025-09-02 14:30:00
- User: Building mood-based music player for friend Ashley
- Context: Previous attempts blocked by Spotify redirect URI (HTTPS requirement)
- Goal: Start with solid Spotify login + basic playlist display

# Spec Header
**Name**: Ashley's Music Mood App (Phase 1: Auth MVP)

**Smallest Scope**: 
- Ashley can successfully log into her Spotify account via the web app
- App displays her playlists after login
- Clean, professional UI with subtle humor in copy
- Deployed with HTTPS URL to satisfy Spotify redirect requirements

**Non-Goals for Phase 1**:
- AI features (defer to Phase 2)
- Mood analysis 
- Music playback controls
- Complex playlist manipulation

# Paths to supplementary guidelines
- Basic web app patterns and deployment (to be referenced when available)
- Spotify Web API best practices
- OAuth 2.0 flow implementation

# Decision Snapshot
**Tech Stack (Free Tools Only)**:
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Deployment: Netlify (free HTTPS hosting)
- Auth: Spotify Web API OAuth 2.0 (Authorization Code Flow)
- State Management: React useState/useContext (no external state lib needed)

**Why These Choices**:
- Next.js: Easy Netlify deployment, built-in API routes for OAuth callbacks
- Netlify: Free HTTPS domains (solves redirect URI requirement)
- No backend needed: Spotify tokens can be managed client-side for read operations

# Architecture at a Glance
```
User -> ashley-music.netlify.app -> Spotify OAuth -> Callback -> Display Playlists

OAuth Flow:
1. User clicks "Connect Spotify" 
2. Redirect to Spotify auth (with netlify.app redirect URI)
3. Spotify redirects back with auth code
4. Exchange code for access token
5. Store token in localStorage 
6. Fetch and display user's playlists
```

**Key Files**:
- `app/page.tsx` - Landing page with Spotify login button
- `app/api/callback/route.ts` - Handle OAuth callback
- `app/dashboard/page.tsx` - Show playlists after auth
- `lib/spotify.ts` - Spotify API wrapper functions

# Implementation Plan

## Phase 1.1: Project Setup (30 min)
- Initialize Next.js project with Tailwind
- Set up basic routing structure
- Create Spotify app in developer dashboard
- Deploy skeleton to Netlify for HTTPS URL

## Phase 1.2: Spotify OAuth Integration (2 hours)
- Implement authorization code flow
- Create callback handler
- Add token storage and refresh logic
- Handle auth errors gracefully

## Phase 1.3: Basic Playlist Display (1 hour)
- Fetch user profile and playlists
- Create simple playlist cards UI
- Add logout functionality
- Polish UI with Ashley-specific touches

## Phase 1.4: Testing & Polish (30 min)
- Test full auth flow with test account
- Add loading states and error handling
- Refine copy to be professional yet playful

# Verification & Demo Script

**Success Criteria**:
1. Ashley can visit the deployed URL
2. Click "Connect with Spotify" button
3. Complete Spotify login flow
4. Return to app and see her playlists listed
5. Can log out and log back in successfully

**Demo Flow**:
1. Show clean landing page with clear call-to-action
2. Click connect button → redirects to Spotify
3. Authorize app → returns to dashboard
4. Display: "Hey Ashley! Here are your playlists:" + playlist grid
5. Show logout works and clears stored tokens

**Edge Cases to Test**:
- User denies Spotify permission
- User already has tokens (should skip auth)
- Network errors during API calls
- Invalid/expired tokens

# Deploy

**Platform**: Netlify
- Connect GitHub repo to Netlify
- Auto-deploy from main branch
- Environment variables: NEXT_PUBLIC_SPOTIFY_CLIENT_ID
- Custom domain potential: ashley-music.netlify.app

**Post-Deploy Setup**:
- Update Spotify app redirect URI to production URL
- Test full OAuth flow on live site
- Share URL with Ashley for initial feedback

**Phase 2 Prep**:
- Collect Ashley's feedback on UI/UX
- Plan AI integration (mood analysis, recommendations)
- Consider playlist modification features