-- Test loyalty customer — run in Supabase SQL Editor
-- 1. Replace the email below with an address you control.
-- 2. After running, open /hub/settings/loyalty or check Table Editor → customers.

-- Requires loyalty migration (points_balance column on customers).

insert into public.customers (
  email,
  phone,
  display_name,
  booking_count,
  points_balance,
  first_booking_at,
  last_booking_at
)
select
  'test.customer@example.com',
  '4055551234',
  'Test Customer',
  2,
  250,
  now() - interval '30 days',
  now() - interval '7 days'
where not exists (
  select 1
  from public.customers c
  where lower(c.email) = lower('test.customer@example.com')
);

-- If the customer already exists, bump points for redemption testing:
update public.customers
set
  display_name = 'Test Customer',
  phone = '4055551234',
  points_balance = 250,
  booking_count = greatest(booking_count, 2),
  last_booking_at = now()
where lower(email) = lower('test.customer@example.com');

-- Rewards login: /rewards → Sign in with password (email + password from Authentication → Users).
-- Or link manually: update customers.auth_user_id to auth.users.id (NOT customers.id).

-- Optional: sample earn transaction (for hub ledger testing):
insert into public.loyalty_transactions (
  customer_id,
  kind,
  points,
  amount_cents,
  note
)
select
  c.id,
  'earn',
  250,
  25000,
  'Test seed — simulated billed detail'
from public.customers c
where lower(c.email) = lower('test.customer@example.com')
  and not exists (
    select 1
    from public.loyalty_transactions t
    where t.customer_id = c.id
      and t.kind = 'earn'
      and t.note = 'Test seed — simulated billed detail'
  );

-- Verify:
select id, email, display_name, points_balance, auth_user_id, booking_count
from public.customers
where lower(email) = lower('test.customer@example.com');
