# Setup Instructions for MigoChat

This project is a Next.js social‑messaging application backed by Supabase. Follow these steps to get it running locally:

## Prerequisites

1. **Node.js** — Install an LTS version of Node.js (18+).  
2. **Supabase project** — Create a new project in [Supabase](https://supabase.com/) and apply the SQL schema provided separately (the schema from our earlier planning).

## Environment variables

Create a `.env.local` file in the root of the project (beside `package.json`) and define the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Replace `your-supabase-url` and `your-anon-public-key` with the values from your Supabase dashboard. These variables are required for the Supabase client in `app/supabaseClient.ts`.

## Supabase storage buckets

Create a **public** storage bucket named `avatars` in your Supabase project. This bucket is used for user profile pictures. Make sure to set appropriate access policies so that users can upload their own avatar and read avatars of others.

## Supabase RPCs and database functions

The application relies on the following remote procedure calls (RPCs) that should be defined in your Supabase database. These RPCs are part of the schema referenced in our planning:

* `request_friend(other_id uuid) returns friendships` — Initiate a friend request.
* `respond_friend(other_id uuid, new_status friendship_status) returns friendships` — Accept, reject or block a friend request.
* `get_or_create_dm(other_id uuid) returns uuid` — Create or retrieve a direct conversation between two friends.

Ensure these functions exist along with the tables defined in the provided SQL schema and that Row Level Security (RLS) policies match the schema.

## Running the project

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

3. To build for production:

   ```bash
   npm run build
   npm run start
   ```

## Notes

* This project uses the Next.js App Router and Tailwind CSS.  
* All authentication is handled via Supabase: users sign up and log in with email and password.  
* For feature details (friend requests, messaging, posts, search, notifications, etc.), refer to the code in `lib/migo-logic.ts` and the corresponding pages under `app/`.
