-- Lemonhead's: site photos + storage (auth / invoices tables come later)

-- ── Registry of images shown on the marketing site ─────────────────────────
create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('gallery', 'team', 'hero', 'general')),
  storage_path text not null,
  alt_text text not null default '',
  layout_class text,
  member_slug text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category, storage_path)
);

create index if not exists site_images_category_sort_idx
  on public.site_images (category, sort_order)
  where published = true;

comment on table public.site_images is 'Website media metadata; files live in storage bucket site-media';
comment on column public.site_images.member_slug is 'For category=team: colton, dave, gunner, owen, austin, richard';
comment on column public.site_images.layout_class is 'Tailwind grid classes for homepage gallery tiles';

alter table public.site_images enable row level security;

create policy "Public read published site images"
  on public.site_images
  for select
  to anon, authenticated
  using (published = true);

-- ── Storage bucket (public read for website assets) ──────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read site-media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'site-media');

-- Authenticated staff can upload/update (tighten to admin role when auth ships)
create policy "Authenticated upload site-media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'site-media');

create policy "Authenticated update site-media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'site-media');

create policy "Authenticated delete site-media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'site-media');

-- ── Future: profiles, bookings, invoices (uncomment when you add Auth) ───────
-- create table public.profiles (
--   id uuid primary key references auth.users (id) on delete cascade,
--   role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
--   full_name text,
--   phone text,
--   created_at timestamptz not null default now()
-- );
--
-- create table public.invoices (
--   id uuid primary key default gen_random_uuid(),
--   customer_id uuid references public.profiles (id),
--   stripe_payment_intent_id text,
--   amount_cents int not null,
--   status text not null default 'draft',
--   created_at timestamptz not null default now()
-- );
