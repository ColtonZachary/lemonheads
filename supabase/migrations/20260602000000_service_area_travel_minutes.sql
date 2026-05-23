-- Estimated drive time from Edmond shop (minutes) per service area — no maps API at booking time.
alter table public.service_areas
  add column if not exists travel_minutes_from_shop int not null default 0;

comment on column public.service_areas.travel_minutes_from_shop is
  'Rough drive time from the Edmond shop; used for booking lead-time rules (e.g. 60+ min → next day, 8:30 earliest).';

update public.service_areas
set travel_minutes_from_shop = 35
where slug = 'oklahoma-city';

update public.service_areas
set travel_minutes_from_shop = 90
where slug = 'tulsa';

update public.service_areas
set travel_minutes_from_shop = 75
where slug = 'enid';
