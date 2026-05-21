-- Default mobile service coverage (ZIP prefixes + city names). Safe to re-run.

insert into public.service_area_coverage (service_area_slug, zip_prefix, city_name, active)
select 'oklahoma-city', '731', null, true
where exists (select 1 from public.service_areas where slug = 'oklahoma-city')
  and not exists (
    select 1 from public.service_area_coverage
    where service_area_slug = 'oklahoma-city' and zip_prefix = '731'
  );

insert into public.service_area_coverage (service_area_slug, zip_prefix, city_name, active)
select 'oklahoma-city', '730', null, true
where exists (select 1 from public.service_areas where slug = 'oklahoma-city')
  and not exists (
    select 1 from public.service_area_coverage
    where service_area_slug = 'oklahoma-city' and zip_prefix = '730'
  );

insert into public.service_area_coverage (service_area_slug, zip_prefix, city_name, active)
select 'oklahoma-city', null, 'Oklahoma City', true
where exists (select 1 from public.service_areas where slug = 'oklahoma-city')
  and not exists (
    select 1 from public.service_area_coverage
    where service_area_slug = 'oklahoma-city' and city_name = 'Oklahoma City'
  );

insert into public.service_area_coverage (service_area_slug, zip_prefix, city_name, active)
select 'tulsa', '741', null, true
where exists (select 1 from public.service_areas where slug = 'tulsa')
  and not exists (
    select 1 from public.service_area_coverage
    where service_area_slug = 'tulsa' and zip_prefix = '741'
  );

insert into public.service_area_coverage (service_area_slug, zip_prefix, city_name, active)
select 'tulsa', null, 'Tulsa', true
where exists (select 1 from public.service_areas where slug = 'tulsa')
  and not exists (
    select 1 from public.service_area_coverage
    where service_area_slug = 'tulsa' and city_name = 'Tulsa'
  );

insert into public.service_area_coverage (service_area_slug, zip_prefix, city_name, active)
select 'enid', '737', null, true
where exists (select 1 from public.service_areas where slug = 'enid')
  and not exists (
    select 1 from public.service_area_coverage
    where service_area_slug = 'enid' and zip_prefix = '737'
  );

insert into public.service_area_coverage (service_area_slug, zip_prefix, city_name, active)
select 'enid', null, 'Enid', true
where exists (select 1 from public.service_areas where slug = 'enid')
  and not exists (
    select 1 from public.service_area_coverage
    where service_area_slug = 'enid' and city_name = 'Enid'
  );
