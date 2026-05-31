-- Saved vehicles for customer mobile app (Garage)

create table if not exists public.customer_vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  vehicle_key text not null
    check (vehicle_key in ('coupe', 'sedan', 'suv2', 'suv3', 'truck', 'van')),
  vehicle_info text not null default '',
  nickname text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_vehicles_customer_id_idx
  on public.customer_vehicles (customer_id, created_at desc);

create unique index if not exists customer_vehicles_one_default_idx
  on public.customer_vehicles (customer_id)
  where is_default = true;

drop trigger if exists customer_vehicles_set_updated_at on public.customer_vehicles;
create trigger customer_vehicles_set_updated_at
  before update on public.customer_vehicles
  for each row execute function public.set_updated_at();

alter table public.customer_vehicles enable row level security;

create policy "customer_vehicles_read_own"
  on public.customer_vehicles for select to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "customer_vehicles_insert_own"
  on public.customer_vehicles for insert to authenticated
  with check (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "customer_vehicles_update_own"
  on public.customer_vehicles for update to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  )
  with check (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "customer_vehicles_delete_own"
  on public.customer_vehicles for delete to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

notify pgrst, 'reload schema';
