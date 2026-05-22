-- Limit which service areas a detailer can be scheduled in (hub + public booking).

create table if not exists public.staff_service_areas (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members (id) on delete cascade,
  service_area_slug text not null references public.service_areas (slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique (staff_member_id, service_area_slug)
);

create index if not exists staff_service_areas_staff_idx
  on public.staff_service_areas (staff_member_id);

comment on table public.staff_service_areas is
  'When non-empty, detailer may only be scheduled for bookings in these service areas; empty means all areas.';

alter table public.staff_service_areas enable row level security;

drop policy if exists "service_areas_staff_public_read" on public.staff_service_areas;
create policy "service_areas_staff_public_read"
  on public.staff_service_areas for select to anon, authenticated
  using (
    exists (
      select 1 from public.staff_members sm
      where sm.id = staff_member_id and sm.active = true
    )
  );

drop policy if exists "service_areas_staff_manager_write" on public.staff_service_areas;
create policy "service_areas_staff_manager_write"
  on public.staff_service_areas for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());
