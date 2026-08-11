create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  portfolio_url text not null,
  technologies text[] not null default array[]::text[],
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_items_user_id_idx on public.portfolio_items(user_id);
create unique index if not exists portfolio_items_user_url_unique_idx on public.portfolio_items(user_id, portfolio_url);

alter table public.portfolio_items enable row level security;

create policy if not exists "Users can manage their own portfolio items"
  on public.portfolio_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Anyone can view portfolio items"
  on public.portfolio_items
  for select
  using (true);
