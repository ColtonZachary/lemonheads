-- Link loyalty redemptions to bookings at checkout

alter table public.bookings
  add column if not exists loyalty_redemption_id uuid
    references public.loyalty_redemptions (id) on delete set null;

create index if not exists bookings_loyalty_redemption_id_idx
  on public.bookings (loyalty_redemption_id)
  where loyalty_redemption_id is not null;
