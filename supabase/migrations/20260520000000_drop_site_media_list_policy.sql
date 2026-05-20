-- Public bucket `site-media` serves files by URL; no storage.objects SELECT policy needed.
-- A broad SELECT policy lets anon clients list every object in the bucket via the Storage API.
drop policy if exists "Public read site-media" on storage.objects;
