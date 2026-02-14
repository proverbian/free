## FlowBudget

Mobile-first budgeting app built with Next.js App Router, Tailwind v4, and Supabase authentication. The app supports offline data entry with a service worker and syncs queued actions when you reconnect.

### Features

- Supabase email/password auth (client + server helpers)
- Income & expense capture
- Dashboard with charts (Recharts), summaries, and CSV export
- Offline-friendly: service worker caching + IndexedDB queue with automatic flush on reconnect
- Left-hand collapsible menu for mobile
- Calendly coaching CTA
- Profile & settings (display name, currency)

### Prerequisites

- Node.js 18+
- A Supabase project with the Database URL and anon key

### Environment

Copy `.env.local` and fill in your real values:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
CALENDLY_URL="https://calendly.com/your-schedule"
```

Be sure the Supabase keys match your project; the service-role key should stay server-side only.

### Scripts

```
npm run dev     # start dev server
npm run lint    # eslint
npm run build   # production build
npm start       # start production server
```

### Offline notes

- A service worker at `/sw.js` caches the shell for offline viewing.
- Income/expense submissions queue in IndexedDB when offline and flush automatically when back online.

### Calendly

Set `CALENDLY_URL` to your scheduling link; the coaching tile will open it in a new tab.

### Authentication

Supabase email/password auth is provided. Update your Supabase Auth settings to allow email/password signups and configure redirect URLs to include `http://localhost:3000` during development.

How it works in this codebase:
- The home page (`src/app/page.tsx`) creates a server Supabase client and checks the session with `supabase.auth.getSession()`. If there is no session, it renders `AuthPanel`; if there is a session, it loads dashboard data.
- The sign in/sign up UI (`src/components/auth/AuthPanel.tsx`) uses the browser client (`src/lib/supabase/client.ts`) and calls `supabase.auth.signInWithPassword` or `supabase.auth.signUp`.
- The server client (`src/lib/supabase/server.ts`) is created with `@supabase/ssr` and wires cookies into the Next.js request/response so session cookies are read and written server-side.
- API routes (`src/app/api/*/route.ts`) call `supabase.auth.getUser()` to verify the request is authenticated and return `401` when it is not.
- A service-role admin client (`src/lib/supabase/admin.ts`) uses `SUPABASE_SERVICE_ROLE_KEY` for server-only operations (never exposed to the browser).

### Export

Dashboard offers CSV export (income + expense rows) for quick sharing.
