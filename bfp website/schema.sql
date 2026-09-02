-- ============================================
-- BFP Bulletin: posts table
-- ============================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('memorandum', 'news', 'advisory')),
  body text,
  image_urls text[] default '{}',
  posted_by uuid references auth.users(id),
  station text,
  province text,
  created_at timestamptz default now()
);

alter table posts enable row level security;

-- Anyone (including anonymous, if you want a public bulletin) can read posts.
-- Tighten this to `auth.role() = 'authenticated'` if it should be BFP-personnel-only.
create policy "Posts are publicly readable"
  on posts for select
  using (true);

-- Only signed-in users can create posts.
create policy "Authenticated users can insert posts"
  on posts for insert
  with check (auth.role() = 'authenticated');

-- Only the original poster (or an admin role, if you add one) can edit/delete.
create policy "Users can update their own posts"
  on posts for update
  using (auth.uid() = posted_by);

create policy "Users can delete their own posts"
  on posts for delete
  using (auth.uid() = posted_by);


-- ============================================
-- Storage bucket for attachments
-- Run this in the Supabase dashboard SQL editor,
-- or create the bucket manually under Storage.
-- ============================================
insert into storage.buckets (id, name, public)
values ('memo-attachments', 'memo-attachments', true)
on conflict (id) do nothing;

-- Public read access to attachments (matches the public bucket above)
create policy "Public can view memo attachments"
  on storage.objects for select
  using (bucket_id = 'memo-attachments');

-- Only authenticated users can upload
create policy "Authenticated users can upload attachments"
  on storage.objects for insert
  with check (bucket_id = 'memo-attachments' and auth.role() = 'authenticated');

-- Only the uploader can delete their own files
create policy "Users can delete their own attachments"
  on storage.objects for delete
  using (bucket_id = 'memo-attachments' and auth.uid() = owner);
