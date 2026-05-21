-- Visitor feedback about the website (internal only — managers review in hub)

create type public.website_feedback_status as enum ('pending', 'reviewed', 'dismissed');

create table if not exists public.website_feedback (
  id uuid primary key default gen_random_uuid(),
  submitter_name text not null,
  submitter_email text,
  page_path text not null default '',
  rating smallint not null default 5 check (rating >= 1 and rating <= 5),
  feedback_text text not null,
  status public.website_feedback_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists website_feedback_status_created_idx
  on public.website_feedback (status, created_at desc);

comment on table public.website_feedback is 'Customer feedback on the website UX; not published as service reviews';
comment on column public.website_feedback.page_path is 'URL path the visitor was on when submitting';
comment on column public.website_feedback.rating is '1–5 rating of the website experience';

alter table public.website_feedback enable row level security;

create policy "website_feedback_public_insert_pending"
  on public.website_feedback
  for insert
  to anon, authenticated
  with check (status = 'pending');

create policy "website_feedback_manager_all"
  on public.website_feedback
  for all
  to authenticated
  using (public.is_hub_manager() or public.is_hub_admin())
  with check (public.is_hub_manager() or public.is_hub_admin());
