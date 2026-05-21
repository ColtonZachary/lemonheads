-- One-time exceptions: allow bookings on a day that is normally off via weekly rules

create table if not exists public.staff_date_overrides (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members (id) on delete cascade,
  override_date date not null,
  reason text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (staff_member_id, override_date)
);

comment on table public.staff_date_overrides is 'One-time open days — detailer may work this date even if weekly rule says off (e.g. Saturday exception)';

alter table public.staff_date_overrides enable row level security;

create policy "date_overrides_staff_read"
  on public.staff_date_overrides for select to authenticated
  using (public.is_hub_staff_reader());

create policy "date_overrides_manager_write"
  on public.staff_date_overrides for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());
