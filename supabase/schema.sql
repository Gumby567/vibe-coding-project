-- Run in Supabase SQL editor. Adjust if tables already exist.

-- Site content (single-row CMS document)
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  blocks jsonb not null default '[]'::jsonb,
  cms_data jsonb,
  updated_at timestamptz default now(),
  updated_by_email text
);

-- Contact inquiries
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  source text not null default 'ai-web-2026',
  team_slug text,
  created_at timestamptz default now()
);

create index if not exists inquiries_source_idx on public.inquiries (source);
create index if not exists inquiries_team_slug_idx on public.inquiries (team_slug);

-- Example RLS (tighten for production)
alter table public.site_content enable row level security;
alter table public.inquiries enable row level security;

-- Public read of published CMS (adjust policies to your security model)
-- create policy "Public read site_content" on public.site_content for select using (true);
-- create policy "Authenticated CMS write" on public.site_content for all using (auth.role() = 'authenticated');
