-- Anonymous page views on the public marketing site (hub stats).

create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  viewed_at timestamptz not null default now()
);

create index if not exists site_page_views_viewed_at_idx
  on public.site_page_views (viewed_at desc);

create index if not exists site_page_views_page_path_idx
  on public.site_page_views (page_path);

comment on table public.site_page_views is 'Public site page loads for hub usage charts; not hub or auth routes';

alter table public.site_page_views enable row level security;

create policy "site_page_views_public_insert"
  on public.site_page_views
  for insert
  to anon, authenticated
  with check (
    char_length(page_path) between 1 and 500
    and page_path ~ '^/'
    and page_path !~ '^/hub'
    and page_path !~ '^/api'
    and page_path !~ '^/auth'
  );

create policy "site_page_views_manager_select"
  on public.site_page_views
  for select
  to authenticated
  using (public.is_hub_manager() or public.is_hub_admin());
