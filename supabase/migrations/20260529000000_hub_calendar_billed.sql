-- Hub week calendar: billed tracking + optional detailer colors

alter table public.bookings
  add column if not exists billed_at timestamptz;

comment on column public.bookings.billed_at is 'Set when customer has been billed/paid; shown green on hub calendar';

alter table public.staff_members
  add column if not exists calendar_color text;

comment on column public.staff_members.calendar_color is 'Optional #RRGGBB for hub week calendar; auto palette when null';
