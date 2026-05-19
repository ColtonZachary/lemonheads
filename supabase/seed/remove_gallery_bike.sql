-- Remove bike from the work gallery (hero still uses /public/bike.webp)
delete from public.site_images
where category = 'gallery' and storage_path like '%bike%';
