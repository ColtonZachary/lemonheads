-- Saved addresses for customer mobile app

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  location_type text not null,
  address text not null default '',
  city text not null default '',
  zip text not null default '',
  nickname text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_customer_id_idx
  on public.customer_addresses (customer_id, created_at desc);

create unique index if not exists customer_addresses_one_default_idx
  on public.customer_addresses (customer_id)
  where is_default = true;

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;

create policy "customer_addresses_read_own"
  on public.customer_addresses for select to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "customer_addresses_insert_own"
  on public.customer_addresses for insert to authenticated
  with check (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "customer_addresses_update_own"
  on public.customer_addresses for update to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  )
  with check (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "customer_addresses_delete_own"
  on public.customer_addresses for delete to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

notify pgrst, 'reload schema';
