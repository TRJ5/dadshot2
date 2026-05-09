# DadShot Setup Guide

A step-by-step walkthrough to get DadShot live on the web, totally free, with groups, leaderboards, and relegation.

**Total time:** ~30 minutes
**Cost:** £0
**Skills required:** Ability to follow instructions and copy/paste

---

## What you'll end up with

- A live website like `dadshot-yourname.vercel.app`
- Real accounts, real photo uploads
- **Groups** with join codes (max 2 per person)
- **Leaderboards** — individual + group rankings with points
- **Relegation system** — slackers get marked and penalise their group
- Works great on iPhone "Add to Home Screen"

---

## How the points work

**Individual points:**
- Post within 24h of your last post = **2 points**
- Post 24-48h late = **1 point**
- Miss completely = **0 points** + streak resets

**Group points (per day):**
- 100% of group posts on time = **+2 group points**
- 50%+ of group posts on time = **+1 group point**
- Less than 50% = **0**

**Relegation:**
- If a member goes 14 days without posting → relegated (badge + **−5 group point penalty**)
- To escape: post **5 times in 7 days**

---

## Part 1: Set up Supabase — 10 mins

### 1.1 Create an account
1. Go to **https://supabase.com**
2. Click **Start your project**
3. Sign in with GitHub (create a GitHub account at github.com first if needed)

### 1.2 Create a new project
1. Click **New Project**
2. Name it `dadshot`
3. Generate a database password — copy it somewhere safe
4. Pick the region closest to you (London for UK)
5. Click **Create new project**, wait ~2 mins

### 1.3 Set up the database
1. In the left sidebar, click **SQL Editor** (icon: `</>`)
2. Click **New query**
3. Paste this entire block (it's long — that's fine, it sets up everything in one go):

```sql
-- Profiles
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Groups
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  join_code text unique not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

-- Group memberships (many-to-many)
create table group_members (
  group_id uuid references groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamp with time zone default now(),
  primary key (group_id, user_id)
);

-- Posts
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  user_name text not null,
  image_url text not null,
  points int default 2,
  created_at timestamp with time zone default now()
);

-- Reactions (one per user per post)
create table reactions (
  post_id uuid references posts on delete cascade,
  user_id uuid references auth.users on delete cascade,
  emoji text not null,
  created_at timestamp with time zone default now(),
  primary key (post_id, user_id)
);

-- Friendships
create table friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references auth.users on delete cascade not null,
  addressee_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(requester_id, addressee_id),
  check (requester_id != addressee_id)
);
create index friendships_requester_idx on friendships(requester_id);
create index friendships_addressee_idx on friendships(addressee_id);

-- RLS policies
alter table profiles enable row level security;
create policy "view profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);

alter table groups enable row level security;
create policy "view groups" on groups for select using (auth.role() = 'authenticated');
create policy "create groups" on groups for insert with check (auth.uid() = created_by);

alter table group_members enable row level security;
create policy "view memberships" on group_members for select using (auth.role() = 'authenticated');
create policy "join groups" on group_members for insert with check (auth.uid() = user_id);
create policy "leave groups" on group_members for delete using (auth.uid() = user_id);

alter table posts enable row level security;
create policy "view posts" on posts for select using (auth.role() = 'authenticated');
create policy "insert own posts" on posts for insert with check (auth.uid() = user_id);

alter table reactions enable row level security;
create policy "view reactions" on reactions for select using (auth.role() = 'authenticated');
create policy "insert own reactions" on reactions for insert with check (auth.uid() = user_id);
create policy "update own reactions" on reactions for update using (auth.uid() = user_id);
create policy "delete own reactions" on reactions for delete using (auth.uid() = user_id);

alter table friendships enable row level security;
create policy "view own friendships" on friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "send friend request" on friendships for insert with check (auth.uid() = requester_id);
create policy "update friendship" on friendships for update using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "delete friendship" on friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);
```

4. Click **Run**. You should see "Success. No rows returned."

### 1.4 Set up photo storage
1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it `selfies`
4. Toggle **Public bucket** ON
5. Click **Save**

Then add upload permission:
1. Click on the `selfies` bucket
2. Click **Policies** tab
3. Click **New policy** → **For full customization**
4. Policy name: `Authenticated upload`
5. Allowed operations: tick **INSERT**
6. Target roles: select **authenticated**
7. Leave WITH CHECK as `true`
8. Click **Review** → **Save policy**

### 1.5 Disable email verification (so mates can sign up instantly)
1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** OFF
3. Click **Save**

### 1.6 Grab your API keys
1. Click **Settings** (gear icon)
2. Click **API**
3. Copy these into a note:
   - **Project URL**
   - **anon public** key

---

## Part 2: Get the code onto GitHub — 5 mins

### 2.1 Create GitHub account if you don't have one (github.com)

### 2.2 Create a new repo
1. Click **+** top-right → **New repository**
2. Name it `dadshot`, set to **Public**
3. Tick **Add a README file**
4. Click **Create repository**

### 2.3 Upload the code
1. Click **Add file** → **Upload files**
2. Unzip the `dadshot.zip` I gave you on your computer
3. Drag **all the files inside the dadshot folder** into the upload area (NOT the folder itself — the contents)
4. Scroll down and click **Commit changes**

---

## Part 3: Deploy with Vercel — 10 mins

### 3.1 Sign up
1. Go to **https://vercel.com**
2. Click **Sign Up** → **Continue with GitHub**

### 3.2 Import your project
1. Click **Add New** → **Project**
2. Find `dadshot` and click **Import**
3. Framework should auto-detect as **Vite**

### 3.3 Add environment variables
Expand **Environment Variables** and add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | (your Project URL) |
| `VITE_SUPABASE_ANON_KEY` | (your anon key) |

### 3.4 Deploy
Click **Deploy**, wait ~1 min. You'll get your URL.

---

## Part 4: Use it like an app on iPhone

1. Open the Vercel URL in **Safari**
2. Tap the share icon
3. Scroll → **Add to Home Screen**

Send the URL to your mates.

---

## How to play

1. **Sign up** with email/password
2. **Create a group** (gives you a join code) OR **join an existing group** with a code
3. Share the join code with mates
4. **Post your daily selfie** — first post starts your 24h timer
5. Watch the leaderboard, don't get relegated

---

## If something breaks

- **"Invalid API key"** — re-check the Vercel env vars, no spaces
- **Photos won't upload** — check storage bucket policy from step 1.4
- **Can't see other people's posts** — check the SQL ran without errors

Drop me the error and I'll help.
