-- Recurring weekly unavailability (e.g. never works Sundays, or Tue + Thu)

create table if not exists public.staff_weekly_blocks (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members (id) on delete cascade,
  /** 0 = Sunday … 6 = Saturday (JavaScript Date.getDay, America/Chicago weekday) */
  day_of_week smallint not null check (day_of_week >= 0 and day_of_week <= 6),
  all_day boolean not null default true,
  reason text not null default '',
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (staff_member_id, day_of_week)
);

comment on table public.staff_weekly_blocks is 'Recurring weekly blocks — detailer unavailable every week on these days';

alter table public.staff_weekly_blocks enable row level security;

create policy "weekly_blocks_staff_read"
  on public.staff_weekly_blocks for select to authenticated
  using (public.is_hub_staff_reader());

create policy "weekly_blocks_manager_write"
  on public.staff_weekly_blocks for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());
