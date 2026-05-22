-- Detailer pay tiers (Regular vs Senior) and fixed pay rates per package / add-on.

alter table public.staff_members
  add column if not exists is_senior_detailer boolean not null default false;

comment on column public.staff_members.is_senior_detailer is
  'When true, detailer earns Senior pay rates on packages (add-ons use same rate for both tiers unless customized).';

create table if not exists public.detailer_package_pay_rates (
  package_key text primary key references public.catalog_packages (key) on delete cascade,
  regular_pay_cents int not null check (regular_pay_cents >= 0),
  senior_pay_cents int not null check (senior_pay_cents >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.detailer_addon_pay_rates (
  addon_name text primary key,
  regular_pay_cents int not null check (regular_pay_cents >= 0),
  senior_pay_cents int not null check (senior_pay_cents >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.detailer_package_pay_rates is 'Flat detailer pay per package (Regular vs Senior), not customer price.';
comment on table public.detailer_addon_pay_rates is 'Flat detailer pay per add-on name on the booking.';

alter table public.detailer_package_pay_rates enable row level security;
alter table public.detailer_addon_pay_rates enable row level security;

drop policy if exists "package_pay_rates_public_read" on public.detailer_package_pay_rates;
create policy "package_pay_rates_public_read"
  on public.detailer_package_pay_rates for select to anon, authenticated
  using (true);

drop policy if exists "package_pay_rates_manager_write" on public.detailer_package_pay_rates;
create policy "package_pay_rates_manager_write"
  on public.detailer_package_pay_rates for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

drop policy if exists "addon_pay_rates_public_read" on public.detailer_addon_pay_rates;
create policy "addon_pay_rates_public_read"
  on public.detailer_addon_pay_rates for select to anon, authenticated
  using (true);

drop policy if exists "addon_pay_rates_manager_write" on public.detailer_addon_pay_rates;
create policy "addon_pay_rates_manager_write"
  on public.detailer_addon_pay_rates for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

-- Default package pay (dollars from ops sheet → cents)
insert into public.detailer_package_pay_rates (package_key, regular_pay_cents, senior_pay_cents)
values
  ('boujee', 7500, 8000),
  ('fully', 6000, 6500),
  ('interior', 4500, 5000),
  ('toughy', 4000, 4500),
  ('basic', 4000, 4500),
  ('quickie', 2000, 2500)
on conflict (package_key) do update set
  regular_pay_cents = excluded.regular_pay_cents,
  senior_pay_cents = excluded.senior_pay_cents,
  updated_at = now();

insert into public.detailer_addon_pay_rates (addon_name, regular_pay_cents, senior_pay_cents)
values
  ('headlight restoration', 3000, 3000),
  ('minor scratch removal', 3000, 3000),
  ('engine bay cleaning', 2500, 2500),
  ('clay bar', 1650, 1650),
  ('ceramic spray', 1500, 1500),
  ('steam clean', 1000, 1000),
  ('pet hair removal', 1650, 1650),
  ('additional time', 2500, 2500)
on conflict (addon_name) do update set
  regular_pay_cents = excluded.regular_pay_cents,
  senior_pay_cents = excluded.senior_pay_cents,
  updated_at = now();
