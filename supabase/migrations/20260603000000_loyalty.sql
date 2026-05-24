-- Customer loyalty: optional login, points per spend, multiple redeemable goals

-- ── Settings (singleton) ──────────────────────────────────────────────────────
create table if not exists public.loyalty_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default true,
  points_per_dollar numeric(10, 2) not null default 1
    check (points_per_dollar >= 0),
  updated_at timestamptz not null default now()
);

insert into public.loyalty_settings (id, enabled, points_per_dollar)
values (1, true, 1)
on conflict (id) do nothing;

-- ── Reward goals (multiple, manager-configurable) ─────────────────────────────
create type public.loyalty_reward_kind as enum ('package', 'addon');

create table if not exists public.loyalty_reward_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  points_required int not null check (points_required > 0),
  reward_kind public.loyalty_reward_kind not null,
  reward_package_key text references public.catalog_packages (key) on delete set null,
  reward_addon_name text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (reward_kind = 'package' and reward_package_key is not null)
    or (reward_kind = 'addon' and reward_addon_name is not null and reward_addon_name <> '')
  )
);

create index if not exists loyalty_reward_goals_active_sort_idx
  on public.loyalty_reward_goals (active, sort_order, points_required);

-- ── Extend customers ──────────────────────────────────────────────────────────
alter table public.customers
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null,
  add column if not exists points_balance int not null default 0 check (points_balance >= 0);

create index if not exists customers_auth_user_id_idx
  on public.customers (auth_user_id)
  where auth_user_id is not null;

-- ── Point ledger ──────────────────────────────────────────────────────────────
create type public.loyalty_transaction_kind as enum ('earn', 'redeem', 'adjust', 'reverse');

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  redemption_id uuid,
  kind public.loyalty_transaction_kind not null,
  points int not null check (points <> 0),
  amount_cents int,
  note text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists loyalty_transactions_earn_booking_unique_idx
  on public.loyalty_transactions (booking_id)
  where kind = 'earn' and booking_id is not null;

create index if not exists loyalty_transactions_customer_idx
  on public.loyalty_transactions (customer_id, created_at desc);

-- ── Redemptions ───────────────────────────────────────────────────────────────
create type public.loyalty_redemption_status as enum ('pending', 'fulfilled', 'cancelled');

create table if not exists public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  goal_id uuid not null references public.loyalty_reward_goals (id) on delete restrict,
  points_spent int not null check (points_spent > 0),
  status public.loyalty_redemption_status not null default 'pending',
  booking_id uuid references public.bookings (id) on delete set null,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  fulfilled_by uuid references public.profiles (id) on delete set null
);

alter table public.loyalty_transactions
  add constraint loyalty_transactions_redemption_id_fkey
  foreign key (redemption_id) references public.loyalty_redemptions (id) on delete set null;

create index if not exists loyalty_redemptions_status_idx
  on public.loyalty_redemptions (status, created_at desc);

-- ── updated_at triggers ───────────────────────────────────────────────────────
drop trigger if exists loyalty_settings_set_updated_at on public.loyalty_settings;
create trigger loyalty_settings_set_updated_at before update on public.loyalty_settings
  for each row execute function public.set_updated_at();

drop trigger if exists loyalty_reward_goals_set_updated_at on public.loyalty_reward_goals;
create trigger loyalty_reward_goals_set_updated_at before update on public.loyalty_reward_goals
  for each row execute function public.set_updated_at();

-- ── RLS helpers ───────────────────────────────────────────────────────────────
create or replace function public.current_customer_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.customers where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_loyalty_customer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_customer_id() is not null;
$$;

-- Link auth user to existing customer row by email (optional login)
create or replace function public.link_customer_auth_user()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_email text;
  v_customer_id uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or v_email = '' then
    return null;
  end if;

  select id into v_customer_id
  from public.customers
  where lower(email) = lower(v_email)
  limit 1;

  if v_customer_id is null then
    return null;
  end if;

  update public.customers
  set auth_user_id = auth.uid()
  where id = v_customer_id
    and (auth_user_id is null or auth_user_id = auth.uid());

  return v_customer_id;
end;
$$;

-- Atomic redemption
create or replace function public.redeem_loyalty_goal(p_goal_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_balance int;
  v_goal public.loyalty_reward_goals;
  v_redemption_id uuid;
begin
  v_customer_id := public.current_customer_id();
  if v_customer_id is null then
    raise exception 'Customer account not linked. Sign in with the email used when booking.';
  end if;

  select * into v_goal
  from public.loyalty_reward_goals
  where id = p_goal_id and active = true;

  if not found then
    raise exception 'Reward goal not found or inactive.';
  end if;

  select points_balance into v_balance
  from public.customers
  where id = v_customer_id
  for update;

  if v_balance < v_goal.points_required then
    raise exception 'Not enough points for this reward.';
  end if;

  update public.customers
  set points_balance = points_balance - v_goal.points_required
  where id = v_customer_id;

  insert into public.loyalty_redemptions (customer_id, goal_id, points_spent)
  values (v_customer_id, v_goal.id, v_goal.points_required)
  returning id into v_redemption_id;

  insert into public.loyalty_transactions (
    customer_id, redemption_id, kind, points, note
  ) values (
    v_customer_id,
    v_redemption_id,
    'redeem',
    -v_goal.points_required,
    'Redeemed: ' || v_goal.title
  );

  return v_redemption_id;
end;
$$;

grant execute on function public.link_customer_auth_user() to authenticated;
grant execute on function public.redeem_loyalty_goal(uuid) to authenticated;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.loyalty_settings enable row level security;
alter table public.loyalty_reward_goals enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_redemptions enable row level security;

create policy "loyalty_settings_public_read"
  on public.loyalty_settings for select
  using (true);

create policy "loyalty_settings_manager_write"
  on public.loyalty_settings for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "loyalty_goals_public_read_active"
  on public.loyalty_reward_goals for select
  using (active = true or public.is_hub_manager() or public.is_hub_admin());

create policy "loyalty_goals_manager_write"
  on public.loyalty_reward_goals for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "customers_loyalty_read_own"
  on public.customers for select to authenticated
  using (
  public.is_loyalty_customer()
  and id = public.current_customer_id()
);

create policy "loyalty_tx_customer_read"
  on public.loyalty_transactions for select to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "loyalty_tx_manager_all"
  on public.loyalty_transactions for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "loyalty_redemptions_customer_read"
  on public.loyalty_redemptions for select to authenticated
  using (
    public.is_loyalty_customer()
    and customer_id = public.current_customer_id()
  );

create policy "loyalty_redemptions_manager_all"
  on public.loyalty_redemptions for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

-- Refresh PostgREST schema cache (required after manual SQL in Supabase dashboard)
notify pgrst, 'reload schema';
