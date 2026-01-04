## FlowBudget

Mobile-first budgeting app built with Next.js App Router, Tailwind v4, Supabase authentication, and Prisma against your Supabase Postgres. The app supports offline data entry with a service worker and syncs queued actions when you reconnect.

### Features

- Supabase email/password auth (client + server helpers)
- Income & expense capture with Prisma models
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

### Database

The Prisma schema lives in `prisma/schema.prisma` with `Income`, `Expense`, and `Profile` models. Point `DATABASE_URL` at your Supabase Postgres, then run:

```
npx prisma migrate dev
npx prisma generate
```

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

### Export

Dashboard offers CSV export (income + expense rows) for quick sharing.
