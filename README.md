# Home Project App

A starter app for planning, prioritizing, and documenting home projects, renovations, maintenance, and services.

## Getting Started

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Supabase Setup

The app now has an optional Supabase auth foundation. Without Supabase environment
variables, it still runs in local demo mode.

1. Create a Supabase project.
2. Run the SQL migration in `supabase/migrations/202605280001_initial_schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Add your project URL and anon key:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Restart `npm run dev`.

The Supabase foundation includes email/password auth, user profiles, homes, home
members, projects, contractors, history records, trusted vendors, attachment
metadata, a private attachment storage bucket, and row-level security policies.
When Supabase is configured and a user is signed in, project and history reads
and writes go through Supabase. Without environment variables, the app stays in
local demo mode.

### Deployment Auth Checklist

For local development, email confirmation can be disabled in Supabase so test
accounts can sign in immediately. Before deploying this app for other users,
turn **Confirm email** back on in Supabase under **Authentication > Sign In /
Providers > User Signups**. For production, also configure custom SMTP so real
confirmation emails are delivered reliably.

## First Product Shape

The current prototype includes:

- A dashboard for the current home
- Project status and priority summaries
- Budget planning and actual spend
- A near-term project board
- A home history timeline
- Vendor/contact tracking
- Optional Supabase authentication and database schema
- Supabase-backed project and history persistence for signed-in users

The next major step is to make the home profile and trusted vendors editable,
then store those changes in Supabase too.
