-- Remove hero image from the work gallery (hero uses /public/hero.png)
delete from public.site_images
where category = 'gallery' and storage_path like '%hero%';
