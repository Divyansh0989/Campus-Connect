# CampusConnect — Gamified Campus Events

A responsive React + Vite implementation inspired by the supplied CampusConnect Figma screens. It includes Explore Events, Event Details, Calendar, My Registrations, Leaderboard, Player Profile, Organiser Dashboard, Attendees & Check-in, and Create Event draft screens.

## Run locally

1. Install Node.js 18+.
2. In this folder, run:
   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```
3. Open the URL printed by Vite (normally `http://localhost:5173`).

Set `VITE_API_BASE_URL` in `.env` to the API server origin, e.g. `http://localhost:8000`. Leave it empty if the API is served from the same origin.

## Supplied API endpoints wired into the UI

- `GET /api/events` — loads the event feed.
- `GET /api/events/{id}` — loads event details.
- `POST /api/registrations` — submits `{ "eventId": "..." }` with cookie credentials.
- `GET /api/me/registrations` — loads the signed-in user's registrations.
- `GET /api/events/{id}/registrations` — loads the organiser-only attendee list.

The UI accepts a raw array or common wrappers (`data`, `events`, `registrations`, `attendees`) and maps common field names into the interface. Since the supplied image lists endpoint paths but not full JSON schemas, request-body naming and response fields may need adjustment to match the real backend. If registration expects `event_id` instead of `eventId`, change the payload in `src/api.js`.

## Important integration notes

- The endpoints in the supplied image do not include login/authentication, event creation, check-in/QR scanning, attendance confirmation, leaderboard, or analytics endpoints. The sign-in form is a **demo identity only** and is not secure authentication. The API calls send cookies (`credentials: 'include'`) so a real backend session can be used once auth is configured.
- Create Event saves a local draft only; it does not publish to a server.
- Check-in button is a UI placeholder and intentionally explains that a backend endpoint is required.
- When the API cannot be reached, the app falls back to sample event data and displays a Demo mode banner. Sample data is not real attendance data.
- Configure CORS and cookie settings on the backend if frontend and API run on different origins.

## Design reference

Figma file: https://www.figma.com/design/6hWd5MfUsQyQwiVGbIuzY6/CampusConnect-%E2%80%94-Gamified-Event-UI

Palette follows the design: charcoal background, purple accent, cyan highlights, lime XP/reward states, and compact Inter typography.

## Supabase connection

1. Copy `.env.example` to `.env` in the project root.
2. Set `VITE_SUPABASE_URL` to the Project URL and `VITE_SUPABASE_ANON_KEY` to the **publishable** key. Never use a Supabase secret key in this Vite frontend.
3. Install dependencies with `npm install` (this project includes `@supabase/supabase-js`).
4. Run `npm run dev`.

The app expects these existing public tables and columns:

- `users(id uuid, email text, role text)`
- `events(id uuid, organiser_id uuid, title text, capacity integer, timestamp timestamptz)`
- `registrations(id uuid, user_id uuid, event_id uuid, created_at timestamptz)`

Every `users.id` must equal the matching Supabase Auth user's UUID. Existing user rows do not automatically create Auth accounts. Create the Auth account first, then ensure the corresponding `users` row uses that exact Auth UUID.

Row Level Security must be enabled and policies must permit the operations used by the app. In particular, event reads, a user's own profile and registrations, organiser-only attendee reads, and organiser-only event inserts must be authorized in the database. Do not disable RLS. The frontend role check is only for UI navigation; it is not a security boundary.

Duplicate-registration pre-checks improve the user message but are not race-proof. For guaranteed prevention, add and verify a unique constraint on `(user_id, event_id)` after checking existing data and constraints.

The current database schema does not contain descriptions, categories, venues, attendance/check-in status, or XP. Those fields remain presentation defaults in the UI; only title, capacity and timestamp are persisted for events.
