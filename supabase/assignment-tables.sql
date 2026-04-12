-- Optional reference DDL for the AI Web 2026 assignment (adjust types/policies as needed).

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  "order" int not null default 0,
  is_visible boolean not null default true,
  style jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  updated_by_email text
);

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  resource_id uuid not null,
  lang text not null,
  payload jsonb not null default '{}'::jsonb,
  unique (resource_type, resource_id, lang)
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  field_key text not null unique,
  type text not null check (type in ('text', 'email', 'textarea', 'checkbox')),
  label_en text,
  label_et text,
  is_required boolean not null default false,
  "order" int not null default 0
);

create table if not exists public.seo (
  lang text primary key,
  title text,
  description text,
  og_title text,
  og_description text
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  contact_person text,
  email text,
  message text,
  team_slug text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null, -- 'block', 'site_content', etc.
  resource_id uuid not null,
  snapshot jsonb not null, -- full snapshot of the resource
  created_at timestamptz default now(),
  created_by_email text
);

-- Example RLS (anon): allow public read on blocks; allow insert on inquiries; tighten for production.
-- Public read for blocks and site_content
create policy "Public read blocks" on public.blocks for select using (true);
create policy "Public read site_content" on public.site_content for select using (true);

-- Authenticated users can insert inquiries
create policy "Authenticated insert inquiries" on public.inquiries for insert with check (auth.role() = 'authenticated');

-- Role-based access for blocks (editors can read/write, admins can delete)
create policy "Editors read blocks" on public.blocks for select using (auth.jwt() ->> 'role' in ('superadmin', 'admin', 'editor'));
create policy "Editors write blocks" on public.blocks for all using (auth.jwt() ->> 'role' in ('superadmin', 'admin', 'editor'));
create policy "Admins delete blocks" on public.blocks for delete using (auth.jwt() ->> 'role' in ('superadmin', 'admin'));

-- Similar for site_content
create policy "Editors read site_content" on public.site_content for select using (auth.jwt() ->> 'role' in ('superadmin', 'admin', 'editor'));
create policy "Editors write site_content" on public.site_content for all using (auth.jwt() ->> 'role' in ('superadmin', 'admin', 'editor'));

-- Revisions: only admins can manage
create policy "Admins manage revisions" on public.revisions for all using (auth.jwt() ->> 'role' in ('superadmin', 'admin'));

-- Form fields, SEO, translations: similar role-based policies
create policy "Editors manage form_fields" on public.form_fields for all using (auth.jwt() ->> 'role' in ('superadmin', 'admin', 'editor'));
create policy "Editors manage seo" on public.seo for all using (auth.jwt() ->> 'role' in ('superadmin', 'admin', 'editor'));
create policy "Editors manage translations" on public.translations for all using (auth.jwt() ->> 'role' in ('superadmin', 'admin', 'editor'));
