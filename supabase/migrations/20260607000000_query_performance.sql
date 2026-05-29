-- Query performance: indexes + RLS fixes for hot SELECT paths.
-- Targets catalog fetches (every page load), staff detailer lookups,
-- booking calendar/availability, and profiles auth checks.

-- ── catalog_package_prices: remove per-row EXISTS subquery in RLS ───────────
-- Full-table price fetches (home, /book, hub) hit this policy on every row.
-- Inactive package prices are harmless to expose; the app only renders active packages.
drop policy if exists "catalog_package_prices_public_read" on public.catalog_package_prices;
create policy "catalog_package_prices_public_read"
  on public.catalog_package_prices for select to anon, authenticated
  using (true);

-- ── profiles: RLS initplan — evaluate auth.uid() once per query, not per row ──
drop policy if exists "profiles_select_self_or_manager" on public.profiles;
create policy "profiles_select_self_or_manager"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_hub_manager()
    or public.is_hub_admin()
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ── catalog: partial indexes match public RLS (active = true) + sort order ───
create index if not exists catalog_packages_active_sort_idx
  on public.catalog_packages (sort_order)
  where active = true;

create index if not exists catalog_addons_active_sort_idx
  on public.catalog_addons (sort_order, name)
  where active = true;

create index if not exists booking_location_types_active_sort_idx
  on public.booking_location_types (sort_order, label)
  where active = true;

-- ── staff_members: bookable detailer list + profile link (mobile/hub auth) ───
create index if not exists staff_members_bookable_detailers_idx
  on public.staff_members (sort_order)
  where active = true and is_bookable = true and is_detailer = true;

create index if not exists staff_members_profile_id_active_idx
  on public.staff_members (profile_id)
  where active = true and profile_id is not null;

-- ── bookings: calendar week range + per-day availability ──────────────────────
create index if not exists bookings_calendar_week_idx
  on public.bookings (appointment_date, starts_at)
  where deleted_at is null;

create index if not exists bookings_availability_day_idx
  on public.bookings (appointment_date, status)
  where deleted_at is null;

create index if not exists bookings_detailer_week_idx
  on public.bookings (detailer_name, appointment_date)
  where deleted_at is null and detailer_name is not null;

-- ── coverage + FK lookups used on booking flow ───────────────────────────────
create index if not exists service_area_coverage_active_slug_idx
  on public.service_area_coverage (service_area_slug)
  where active = true;

create index if not exists staff_service_areas_slug_idx
  on public.staff_service_areas (service_area_slug);

create index if not exists bookings_customer_id_idx
  on public.bookings (customer_id)
  where customer_id is not null;

create index if not exists booking_audit_log_booking_id_idx
  on public.booking_audit_log (booking_id);
