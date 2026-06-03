-- Package add-on restrictions and add-on categories for hub catalog UI.

alter table public.catalog_addons
  add column if not exists category text not null default 'general'
  check (category in ('interior', 'exterior', 'general'));

comment on column public.catalog_addons.category is
  'Interior vs exterior grouping for package add-on restriction UI.';

create table if not exists public.package_addon_blocks (
  package_key text not null references public.catalog_packages (key) on delete cascade,
  addon_name text not null,
  created_at timestamptz not null default now(),
  primary key (package_key, addon_name)
);

create index if not exists package_addon_blocks_package_idx
  on public.package_addon_blocks (package_key);

comment on table public.package_addon_blocks is
  'Add-ons that cannot be selected for a given service package.';

alter table public.package_addon_blocks enable row level security;

drop policy if exists "package_addon_blocks_public_read" on public.package_addon_blocks;
create policy "package_addon_blocks_public_read"
  on public.package_addon_blocks for select to anon, authenticated
  using (true);

drop policy if exists "package_addon_blocks_manager_write" on public.package_addon_blocks;
create policy "package_addon_blocks_manager_write"
  on public.package_addon_blocks for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

update public.catalog_addons
set category = 'interior'
where name in (
  'Shampoo',
  'Steam Clean',
  'Pet Hair Removal',
  'Ozone Air Treatment'
);

update public.catalog_addons
set category = 'exterior'
where name in (
  'Clay Bar',
  'Headlight Restoration',
  'Engine Bay Clean',
  'Ceramic Spray'
);

insert into public.package_addon_blocks (package_key, addon_name)
select 'quickie', name
from public.catalog_addons
where category = 'interior'
on conflict do nothing;

insert into public.package_addon_blocks (package_key, addon_name)
select 'toughy', name
from public.catalog_addons
where category = 'interior'
on conflict do nothing;

insert into public.package_addon_blocks (package_key, addon_name)
select 'interior', name
from public.catalog_addons
where category = 'exterior'
on conflict do nothing;

insert into public.package_addon_blocks (package_key, addon_name)
select 'boujee', name
from public.catalog_addons
on conflict do nothing;
