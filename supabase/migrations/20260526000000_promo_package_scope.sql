-- Promo codes: optional single-package restriction (NULL = all packages)

alter table public.promo_codes
  add column if not exists package_key text references public.catalog_packages (key) on delete set null;

comment on column public.promo_codes.package_key is
  'When set, promo applies only to this package key; NULL = all active packages';
