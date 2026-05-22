-- Block a detailer from being booked for specific packages on the public site (managers can still assign in hub).

create table if not exists public.staff_package_blocks (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members (id) on delete cascade,
  package_key text not null,
  created_at timestamptz not null default now(),
  unique (staff_member_id, package_key)
);

create index if not exists staff_package_blocks_staff_idx
  on public.staff_package_blocks (staff_member_id);

comment on table public.staff_package_blocks is
  'Packages a detailer cannot be chosen for on the public booking flow; hub managers may still assign them.';

alter table public.staff_package_blocks enable row level security;

drop policy if exists "package_blocks_public_read" on public.staff_package_blocks;
create policy "package_blocks_public_read"
  on public.staff_package_blocks for select to anon, authenticated
  using (
    exists (
      select 1 from public.staff_members sm
      where sm.id = staff_member_id and sm.active = true
    )
  );

drop policy if exists "package_blocks_manager_write" on public.staff_package_blocks;
create policy "package_blocks_manager_write"
  on public.staff_package_blocks for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());
