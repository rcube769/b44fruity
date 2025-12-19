# 🍊 Fruity - Community Fruit Sharing Platform

A modern web application built with React, Vite, and Supabase for sharing fresh fruit with your community. This version uses the Base44 framework pattern optimized for Vercel deployment.

## ✨ Features

- **🔐 Secure Authentication** - Email/password authentication with Supabase
- **🗺️ Interactive Map** - Find fruit near you using Leaflet (no API key needed!)
- **📝 Listing Management** - Create and manage fruit listings
- **💬 Real-time Messaging** - Chat with fruit sharers to coordinate pickups
- **📱 Responsive Design** - Beautiful UI with Tailwind CSS
- **🚀 Fast Performance** - Built with Vite for optimal loading speeds

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS
- **Maps:** Leaflet + React Leaflet (OpenStreetMap - free, no API key!)
- **Backend:** Supabase (Database + Authentication)
- **Deployment:** Vercel

## 🚀 Deployment to Vercel

### Prerequisites

1. A Supabase project set up with the required tables (see database schema below)
2. A Vercel account
3. Git repository connected to Vercel

### Step 1: Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your repository
5. Vercel will auto-detect it as a Vite project

### Step 2: Configure Environment Variables

In your Vercel project settings, add these environment variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy "Project URL" for `VITE_SUPABASE_URL`
4. Copy "anon public" key for `VITE_SUPABASE_ANON_KEY`

### Step 3: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 4: Deploy

Click "Deploy" and Vercel will build and deploy your app!

### Step 5: Configure Supabase Auth Redirect URL

After deployment, add your Vercel URL to Supabase:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
3. Add to "Redirect URLs": `https://your-app.vercel.app/**`

## 🗄️ Database Schema

You need these tables in your Supabase database:

### users table
```sql
create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  display_name text,
  created_at timestamptz default now()
);
```

### listings table
```sql
create table listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  fruit_type text not null,
  quantity text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  city text not null,
  state text not null,
  full_address text,
  available_start date not null,
  available_end date not null,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);
```

### pickup_requests table
```sql
create table pickup_requests (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references listings(id) on delete cascade not null,
  requester_id uuid references users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')),
  message text,
  created_at timestamptz default now(),
  unique(listing_id, requester_id)
);
```

### messages table
```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  pickup_request_id uuid references pickup_requests(id) on delete cascade not null,
  sender_id uuid references users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);
```

## 🏃 Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## 🔧 Key Improvements in This Version

1. **React Router** - Better routing than Next.js for simple SPAs
2. **Vite** - Faster builds and hot module replacement
3. **Simplified Auth** - Direct Supabase client usage, no middleware complexity
4. **No API Routes** - Direct database queries from client (secured by RLS)
5. **Leaflet Maps** - Free, no API key needed unlike Mapbox
6. **Vercel Optimized** - Simple SPA deployment with rewrites

## 🐛 Troubleshooting

### Build Fails
- Make sure all environment variables are set in Vercel
- Check that TypeScript has no errors: `npm run build`

### Authentication Not Working
- Verify Supabase URL and anon key are correct
- Check that redirect URLs are configured in Supabase
- Disable email confirmation in Supabase → Authentication → Settings

### Map Not Loading
- Check browser console for errors
- Verify Leaflet CSS is imported
- Ensure geolocation permissions are granted

### Messages Not Appearing
- Check that Row Level Security policies allow reading messages
- Verify sender_id foreign key constraint exists

## 📝 Notes

- Email confirmation is disabled by default for easier signup
- Row Level Security (RLS) should be enabled on all tables
- The app uses browser geolocation to center the map on user's location
- Geocoding uses OpenStreetMap Nominatim (free, no API key)

## 🎯 Future Enhancements

- Push notifications for new messages
- Image uploads for fruit listings
- Review/rating system
- Calendar integration for pickup scheduling
- Social media sharing

## 📄 License

MIT

---

Built with ❤️ for the community
