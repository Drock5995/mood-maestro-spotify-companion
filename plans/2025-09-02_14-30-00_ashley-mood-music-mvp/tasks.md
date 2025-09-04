# Tasks Provenance
- Created at: 2025-09-02T14:30:00Z
- Plan: [refer to associated plan.md]

# Tasks (≤ 6; one line each)
- [x] [P:setup-1] Initialize Next.js app with Tailwind, create Spotify developer app, get client credentials
- [x] [P:auth-1] Implement Spotify OAuth authorization flow with callback handler and token storage
- [x] [P:ui-1] Create dashboard page that fetches and displays user's playlists in a clean grid
- [x] [P:polish-1] Add loading states, error handling, logout functionality, and Ashley-specific UI touches
- [x] [P:setup-2] Deploy skeleton app to Netlify and configure HTTPS redirect URI in Spotify dashboard
- [x] [P:test-1] Test complete auth flow end-to-end and verify redirect URI works on production

## Phase 2: AI Mood DJ
- [ ] [P:api-1] Update Spotify scopes and extend the API wrapper with functions for liked songs and playlist creation.
- [ ] [P:ui-1] Design and build the front-end component for selecting preset moods or entering custom text.
- [ ] [P:ai-1] Create a Supabase Edge Function to translate user input into playlist parameters using an AI model.
- [ ] [P:logic-1] Implement the client-side logic to fetch, filter, and combine liked songs with new recommendations.
- [ ] [P:ui-2] Develop the UI to display the generated playlist and the "Save to Spotify" button.
- [ ] [P:test-1] Conduct end-to-end testing of the full playlist generation and saving flow.