# Migration: Add reactions

If you already set up your Supabase database before reactions existed, run this SQL in the Supabase SQL Editor to add the reactions feature.

(If you're setting up from scratch, the main SETUP.md SQL already includes this — skip this file.)

```sql
create table reactions (
  post_id uuid references posts on delete cascade,
  user_id uuid references auth.users on delete cascade,
  emoji text not null,
  created_at timestamp with time zone default now(),
  primary key (post_id, user_id)
);

alter table reactions enable row level security;
create policy "view reactions" on reactions for select using (auth.role() = 'authenticated');
create policy "insert own reactions" on reactions for insert with check (auth.uid() = user_id);
create policy "update own reactions" on reactions for update using (auth.uid() = user_id);
create policy "delete own reactions" on reactions for delete using (auth.uid() = user_id);
```

Click **Run**. Should see "Success. No rows returned."
