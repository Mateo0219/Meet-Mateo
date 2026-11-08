-- Run once in the Supabase SQL editor. All writes go through the site's server
-- with the service key, so row level security stays on with no public policies.
create table if not exists public.moments (
  id uuid primary key,
  text text not null default '' check (char_length(text) <= 1000),
  location text check (char_length(location) <= 40),
  images text[] not null default '{}' check (cardinality(images) <= 9),
  likes integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists moments_created_at_idx on public.moments (created_at desc);

alter table public.moments enable row level security;

create or replace function public.adjust_moment_likes(target_id uuid, delta integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.moments
  set likes = greatest(likes + sign(delta)::integer, 0)
  where id = target_id
  returning likes;
$$;

revoke all on function public.adjust_moment_likes(uuid, integer) from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('moments', 'moments', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
