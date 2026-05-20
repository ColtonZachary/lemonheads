-- Customer booking requests from the website booking flow

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,

  customer_name text not null,
  email text not null,
  phone text not null,

  location_type text not null,
  address_line text not null default '',
  city text not null default '',
  zip text not null default '',

  service_name text not null,
  service_key text,
  vehicle_type text not null,
  vehicle_info text not null default '',

  appointment_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,

  detailer_name text,
  detailer_auto_assigned boolean not null default true,

  addons text[] not null default '{}',
  plastic_shine boolean not null default false,
  early_contact_ok boolean not null default true,

  price_cents integer,
  price_display text not null default '',

  customer_notes text not null default '',
  card_on_file boolean not null default false,

  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bookings is 'Online booking requests from lemonheadsdetail.com';
comment on column public.bookings.reference_id is 'Public id shown to customer, e.g. LH-ABC123';
comment on column public.bookings.plastic_shine is 'Customer wants plastic conditioned (shiny look)';
comment on column public.bookings.detailer_auto_assigned is 'True when customer chose Auto-Assign instead of a named detailer';
comment on column public.bookings.price_cents is 'Estimated total in cents when computable';
comment on column public.bookings.starts_at is 'UTC instant; customer-selected time is America/Chicago (OKC/Tulsa/Enid)';
comment on column public.bookings.ends_at is 'UTC instant; start + package duration in America/Chicago';

create index if not exists bookings_appointment_date_idx
  on public.bookings (appointment_date);

create index if not exists bookings_status_idx
  on public.bookings (status);

create index if not exists bookings_created_at_idx
  on public.bookings (created_at desc);

create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row
  execute function public.set_bookings_updated_at();

alter table public.bookings enable row level security;

-- No anon/authenticated policies yet: inserts go through service role on the server.
-- Add staff SELECT/UPDATE policies when Supabase Auth ships.
