# Netlify Deployment Guide

## Prerequisites
1. **Spotify App Credentials** - Get from https://developer.spotify.com/dashboard
   - Client ID
   - Client Secret

2. **GitHub Account** - To host the repository

## Step-by-Step Deployment

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Name: `mood-maestro-spotify-companion`
3. Make it **public** (required for free Netlify)
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### 2. Push Code to GitHub
Run these commands in your terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/mood-maestro-spotify-companion.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Netlify
1. Go to https://app.netlify.com/
2. Click "Add new site" > "Import an existing project"
3. Choose "Deploy with GitHub"
4. Select your `mood-maestro-spotify-companion` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Click "Deploy site"

### 4. Configure Environment Variables
1. In your Netlify site dashboard, go to "Site settings" > "Environment variables"
2. Add these variables:
   - `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` = your_spotify_client_id
   - `SPOTIFY_CLIENT_SECRET` = your_spotify_client_secret

### 5. Update Spotify App Redirect URI
1. Go back to https://developer.spotify.com/dashboard
2. Select your app
3. Click "Edit Settings"
4. In "Redirect URIs", add:
   - `https://YOUR_SITE_NAME.netlify.app/api/callback`
   - Keep the localhost one for development: `http://localhost:3000/api/callback`
5. Save changes

### 6. Redeploy
1. In Netlify dashboard, go to "Deploys"
2. Click "Trigger deploy" > "Deploy site"
3. Wait for deployment to complete

### 7. Test the Live App
1. Visit your live site: `https://YOUR_SITE_NAME.netlify.app`
2. Click "Connect with Spotify"
3. Complete OAuth flow
4. Verify playlists display correctly

## Troubleshooting
- If build fails: Check the deploy logs in Netlify
- If OAuth fails: Verify redirect URI matches exactly
- If API calls fail: Check environment variables are set correctly

## Next Steps
After successful deployment:
1. Test all functionality on the live site
2. Update project documentation with live URL
3. Consider custom domain setup (optional)