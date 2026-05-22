-- Per-user Managers Hub color overrides (stored on profile)

alter table public.profiles
  add column if not exists hub_theme jsonb not null default '{}';

comment on column public.profiles.hub_theme is 'User-specific hub UI colors; keys match lib/hub/hub-theme.ts';
