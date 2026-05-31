-- Push tokens for detailer mobile app (Expo)

alter type public.notification_channel add value if not exists 'push';

create table if not exists public.employee_push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  platform text check (platform in ('ios', 'android', 'web')),
  device_label text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (profile_id, expo_push_token)
);

create index if not exists employee_push_tokens_profile_id_idx
  on public.employee_push_tokens (profile_id);

comment on table public.employee_push_tokens is
  'Expo push tokens for detailer mobile app; one row per device';

alter table public.employee_push_tokens enable row level security;

create policy "employee_push_tokens_self_all"
  on public.employee_push_tokens for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "employee_push_tokens_manager_read"
  on public.employee_push_tokens for select to authenticated
  using (public.is_hub_manager() or public.is_hub_admin());
