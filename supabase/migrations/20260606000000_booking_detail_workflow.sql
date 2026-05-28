-- Detailer field workflow: en route → arrived → photos → finished → checklist

create type public.booking_detail_phase as enum (
  'awaiting_start',
  'en_route',
  'arrived',
  'awaiting_finish',
  'awaiting_after_photos',
  'awaiting_checklist',
  'complete'
);

alter table public.bookings
  add column if not exists detail_phase public.booking_detail_phase not null default 'awaiting_start',
  add column if not exists detail_en_route_at timestamptz,
  add column if not exists detail_arrived_at timestamptz,
  add column if not exists detail_finished_at timestamptz,
  add column if not exists detail_checklist_completed_at timestamptz,
  add column if not exists detail_started_by uuid references public.profiles (id) on delete set null;

comment on column public.bookings.detail_phase is 'Detailer mobile workflow step (separate from status)';

create type public.booking_job_photo_phase as enum ('before', 'after');

create table if not exists public.booking_job_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  phase public.booking_job_photo_phase not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists booking_job_photos_booking_idx
  on public.booking_job_photos (booking_id, phase);

create table if not exists public.detail_checklist_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_checklist_answers (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  item_id uuid not null references public.detail_checklist_items (id) on delete cascade,
  checked boolean not null default false,
  checked_at timestamptz,
  primary key (booking_id, item_id)
);

-- Default checklist (managers can edit in hub)
insert into public.detail_checklist_items (label, sort_order)
select v.label, v.sort_order
from (
  values
    ('Exterior wash complete', 10),
    ('Interior vacuumed', 20),
    ('Windows cleaned', 30),
    ('Tires dressed', 40),
    ('Customer property respected', 50)
) as v (label, sort_order)
where not exists (select 1 from public.detail_checklist_items limit 1);

alter table public.booking_job_photos enable row level security;
alter table public.detail_checklist_items enable row level security;
alter table public.booking_checklist_answers enable row level security;

-- Photos: managers all; detailers read (writes via API with service role or policy)
create policy "booking_photos_manager_all"
  on public.booking_job_photos for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "booking_photos_detailer_read"
  on public.booking_job_photos for select to authenticated
  using (public.current_profile_role() = 'detailer');

-- Checklist items: managers write; detailers read active
create policy "checklist_items_manager_all"
  on public.detail_checklist_items for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "checklist_items_detailer_read"
  on public.detail_checklist_items for select to authenticated
  using (active = true);

-- Answers: managers read; detailers read own bookings via join (simplified: detailer read all answers for now - API scoped)
create policy "checklist_answers_manager_all"
  on public.booking_checklist_answers for all to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());

create policy "checklist_answers_detailer_read"
  on public.booking_checklist_answers for select to authenticated
  using (public.current_profile_role() = 'detailer');

-- Storage bucket for job photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booking-photos',
  'booking-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "booking_photos_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'booking-photos');

create policy "booking_photos_manager_write"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'booking-photos'
    and (public.is_hub_manager() or public.is_hub_admin())
  )
  with check (
    bucket_id = 'booking-photos'
    and (public.is_hub_manager() or public.is_hub_admin())
  );
