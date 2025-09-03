# Ashley's Music Mood App

A personalized Spotify companion that helps you discover and organize music based on your mood. Built with Next.js, Tailwind CSS, and the Spotify Web API.

## Features

- 🎵 Connect with your Spotify account
- 📋 View all your playlists in a beautiful interface  
- 🎨 Clean, professional UI with subtle personality
- 🔐 Secure OAuth 2.0 authentication
- 📱 Responsive design for all devices

## Setup Instructions

### 1. Spotify Developer App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use an existing one
3. Note down your **Client ID** and **Client Secret**
4. Add these redirect URIs:
   - Development: `http://localhost:3000/api/callback`
   - Production: `https://your-netlify-domain.netlify.app/api/callback`

### 2. Environment Variables

1. Copy `.env.local` and update the values:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment (Netlify)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
5. Update your Spotify app's redirect URI to your Netlify domain

## Architecture

```
User Authentication Flow:
1. User clicks "Connect with Spotify"
2. Redirected to Spotify OAuth
3. User authorizes the app
4. Spotify redirects back with auth code
5. App exchanges code for access token
6. Token stored in localStorage
7. Dashboard displays user's playlists
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Authentication**: Spotify Web API OAuth 2.0
- **Deployment**: Netlify
- **State Management**: React hooks + localStorage

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/callback/     # OAuth callback handler
│   │   ├── dashboard/        # Playlist view page
│   │   └── page.tsx          # Landing page
├── lib/
│   └── spotify.ts           # Spotify API wrapper
├── public/                  # Static assets
└── netlify.toml            # Deployment config
```

Generated with [Memex](https://memex.tech)
