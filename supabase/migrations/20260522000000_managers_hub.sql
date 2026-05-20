-- Managers Hub: auth roles, catalog, scheduling rules, customers, audit, promos (Stripe later)

-- ── Roles & profiles ────────────────────────────────────────────────────────
create type public.user_role as enum ('admin', 'manager', 'detailer');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'detailer',
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per Supabase Auth user; controls hub access';

-- ── Staff / detailers (bookable on website) ───────────────────────────────────
create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  slug text not null unique,
  display_name text not null,
  role_label text not null default '',
  bio text not null default '',
  is_detailer boolean not null default false,
  is_bookable boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.staff_members.profile_id is 'Set when this person can log in (detailer view-only schedule)';

-- ── Service areas (marketing + capacity grouping) ─────────────────────────────
create table if not exists public.service_areas (
  slug text primary key,
  city text not null,
  state text not null default 'Oklahoma',
  marketing_url text not null default '',
  active boolean not null default true,
  sort_order int not null default 0
);

-- ── Catalog: packages ─────────────────────────────────────────────────────────
create table if not exists public.catalog_packages (
  key text primary key,
  name text not null,
  description text not null default '',
  features jsonb not null default '[]',
  duration_hours numeric(4, 2) not null default 2,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_package_prices (
  package_key text not null references public.catalog_packages (key) on delete cascade,
  vehicle_key text not null,
  price_cents int not null,
  primary key (package_key, vehicle_key)
);

-- ── Catalog: add-ons ──────────────────────────────────────────────────────────
create table if not exists public.catalog_addons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  price_cents int not null,
  price_suffix text not null default '',
  icon text not null default 'spray',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Booking location types (mobile / drop-off labels) ───────────────────────
create table if not exists public.booking_location_types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  active boolean not null default true,
  sort_order int not null default 0
);

-- ── Promo / discount codes ────────────────────────────────────────────────────
create type public.discount_type as enum ('percent', 'fixed_cents');

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null default '',
  discount_type public.discount_type not null,
  discount_value numeric(10, 2) not null,
  max_uses int,
  uses_count int not null default 0,
  active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Scheduling rules ──────────────────────────────────────────────────────────
create table if not exists public.lead_time_rules (
  rule_key text primary key,
  label text not null,
  config jsonb not null default '{}',
  active boolean not null default true
);

create table if not exists public.blackout_dates (
  id uuid primary key default gen_random_uuid(),
  blackout_date date not null,
  reason text not null default '',
  service_area_slug text references public.service_areas (slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blackout_date, service_area_slug)
);

comment on column public.blackout_dates.service_area_slug is 'NULL = whole shop closed that day';

create table if not exists public.capacity_rules (
  id uuid primary key default gen_random_uuid(),
  service_area_slug text references public.service_areas (slug) on delete cascade,
  max_jobs_per_day int not null check (max_jobs_per_day > 0),
  active boolean not null default true,
  unique (service_area_slug)
);

create table if not exists public.service_area_coverage (
  id uuid primary key default gen_random_uuid(),
  service_area_slug text not null references public.service_areas (slug) on delete cascade,
  zip_prefix text,
  city_name text,
  active boolean not null default true,
  check (zip_prefix is not null or city_name is not null)
);

-- ── Detailer schedule blocks (PTO, lunch, etc.) ───────────────────────────────
create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ── Customers (repeat booking history) ────────────────────────────────────────
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text not null default '',
  display_name text not null default '',
  booking_count int not null default 0,
  first_booking_at timestamptz,
  last_booking_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_unique_idx
  on public.customers (lower(email));

-- ── Extend bookings ───────────────────────────────────────────────────────────
alter table public.bookings
  add column if not exists customer_id uuid references public.customers (id) on delete set null,
  add column if not exists staff_member_id uuid references public.staff_members (id) on delete set null,
  add column if not exists service_area_slug text references public.service_areas (slug) on delete set null,
  add column if not exists promo_code_id uuid references public.promo_codes (id) on delete set null,
  add column if not exists estimated_price_cents int,
  add column if not exists price_override_cents int,
  add column if not exists discount_cents int not null default 0,
  add column if not exists final_price_cents int,
  add column if not exists manager_notes text not null default '',
  add column if not exists cancellation_reason text not null default '',
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles (id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles (id) on delete set null;

comment on column public.bookings.price_override_cents is 'Manager-set final price override (cents)';
comment on column public.bookings.deleted_at is 'Soft delete; managers can hard-delete via status + audit';

-- ── Audit log ─────────────────────────────────────────────────────────────────
create table if not exists public.booking_audit_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  changes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Notifications queue (email/SMS — processed by app or edge function) ───────
create type public.notification_channel as enum ('email', 'sms');

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  channel public.notification_channel not null,
  event_type text not null,
  recipient text not null,
  payload jsonb not null default '{}',
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

-- ── Invoices (Stripe later) ───────────────────────────────────────────────────
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  amount_cents int not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'void')),
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── updated_at triggers ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists staff_members_set_updated_at on public.staff_members;
create trigger staff_members_set_updated_at before update on public.staff_members
  for each row execute function public.set_updated_at();

drop trigger if exists catalog_packages_set_updated_at on public.catalog_packages;
create trigger catalog_packages_set_updated_at before update on public.catalog_packages
  for each row execute function public.set_updated_at();

drop trigger if exists catalog_addons_set_updated_at on public.catalog_addons;
create trigger catalog_addons_set_updated_at before update on public.catalog_addons
  for each row execute function public.set_updated_at();

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at before update on public.promo_codes
  for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ── RLS helpers ───────────────────────────────────────────────────────────────
create or replace function public.current_profile_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true;
$$;

create or replace function public.is_hub_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'manager') from public.profiles where id = auth.uid() and active = true),
    false
  );
$$;

create or replace function public.is_hub_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid() and active = true),
    false
  );
$$;

create or replace function public.is_hub_staff_reader()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'manager', 'detailer') from public.profiles where id = auth.uid() and active = true),
    false
  );
$$;

-- ── Enable RLS ────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.service_areas enable row level security;
alter table public.catalog_packages enable row level security;
alter table public.catalog_package_prices enable row level security;
alter table public.catalog_addons enable row level security;
alter table public.booking_location_types enable row level security;
alter table public.promo_codes enable row level security;
alter table public.lead_time_rules enable row level security;
alter table public.blackout_dates enable row level security;
alter table public.capacity_rules enable row level security;
alter table public.service_area_coverage enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.customers enable row level security;
alter table public.booking_audit_log enable row level security;
alter table public.notification_events enable row level security;
alter table public.invoices enable row level security;

-- Profiles: users read self; managers read all; admin manages all
create policy "profiles_select_self_or_manager"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_hub_manager() or public.is_hub_admin());

create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_all"
  on public.profiles for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

-- Public read published catalog; managers write
create policy "catalog_packages_public_read"
  on public.catalog_packages for select to anon, authenticated
  using (active = true);

create policy "catalog_packages_manager_write"
  on public.catalog_packages for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "catalog_package_prices_public_read"
  on public.catalog_package_prices for select to anon, authenticated
  using (exists (select 1 from public.catalog_packages p where p.key = package_key and p.active = true));

create policy "catalog_package_prices_manager_write"
  on public.catalog_package_prices for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "catalog_addons_public_read"
  on public.catalog_addons for select to anon, authenticated
  using (active = true);

create policy "catalog_addons_manager_write"
  on public.catalog_addons for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "service_areas_public_read"
  on public.service_areas for select to anon, authenticated
  using (active = true);

create policy "service_areas_manager_write"
  on public.service_areas for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "booking_location_types_public_read"
  on public.booking_location_types for select to anon, authenticated
  using (active = true);

create policy "booking_location_types_manager_write"
  on public.booking_location_types for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "promo_codes_manager_all"
  on public.promo_codes for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "rules_public_read"
  on public.lead_time_rules for select to anon, authenticated
  using (active = true);

create policy "rules_manager_write"
  on public.lead_time_rules for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "blackout_public_read"
  on public.blackout_dates for select to anon, authenticated
  using (true);

create policy "blackout_manager_write"
  on public.blackout_dates for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "capacity_public_read"
  on public.capacity_rules for select to anon, authenticated
  using (active = true);

create policy "capacity_manager_write"
  on public.capacity_rules for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "coverage_public_read"
  on public.service_area_coverage for select to anon, authenticated
  using (active = true);

create policy "coverage_manager_write"
  on public.service_area_coverage for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

-- Staff: public read active bookable; managers CRUD; detailers read all active
create policy "staff_public_read"
  on public.staff_members for select to anon, authenticated
  using (active = true);

create policy "staff_manager_write"
  on public.staff_members for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

-- Bookings: managers full; detailers read non-deleted; no anon (web uses service role)
create policy "bookings_manager_all"
  on public.bookings for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "bookings_detailer_read"
  on public.bookings for select to authenticated
  using (
    public.current_profile_role() = 'detailer'
    and deleted_at is null
  );

-- Schedule blocks: readers see all; managers write
create policy "blocks_staff_read"
  on public.schedule_blocks for select to authenticated
  using (public.is_hub_staff_reader());

create policy "blocks_manager_write"
  on public.schedule_blocks for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

-- Customers & audit: managers only
create policy "customers_manager_all"
  on public.customers for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "audit_manager_read"
  on public.booking_audit_log for select to authenticated
  using (public.is_hub_manager() or public.is_hub_admin());

create policy "audit_manager_insert"
  on public.booking_audit_log for insert to authenticated
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "notifications_manager_all"
  on public.notification_events for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "invoices_manager_all"
  on public.invoices for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

-- Default lead-time rule (same-day cutoff 4 PM Central)
insert into public.lead_time_rules (rule_key, label, config)
values (
  'same_day_cutoff',
  'No same-day bookings after 4:00 PM Central',
  '{"timezone":"America/Chicago","cutoff_hour":16}'::jsonb
)
on conflict (rule_key) do nothing;
