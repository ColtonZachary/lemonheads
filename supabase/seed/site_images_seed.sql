-- Optional: run after uploading files to Storage → site-media

insert into public.site_images (category, storage_path, alt_text, layout_class, member_slug, sort_order)
values
  ('gallery', 'gallery/gallery-4.webp', 'Showroom finish on a silver vehicle under studio lighting', 'lg:col-span-7 lg:row-span-1 lg:h-[380px] h-[260px]', null, 0),
  ('gallery', 'gallery/gallery-6.webp', 'Machine polishing black paint to a mirror finish', 'lg:col-span-5 lg:row-span-1 lg:h-[380px] h-[260px]', null, 1),
  ('gallery', 'gallery/gallery-2.webp', 'Headlight restoration with microfiber detailing', 'lg:col-span-4 lg:h-[260px] h-[200px]', null, 2),
  ('gallery', 'gallery/gallery-3.webp', 'Interior door panel deep clean with professional brushes', 'lg:col-span-4 lg:h-[260px] h-[200px]', null, 3),
  ('gallery', 'gallery/gallery-1.webp', 'Infotainment screen and dash interior detailing', 'lg:col-span-4 lg:h-[260px] h-[200px]', null, 4),
  ('team', 'team/colton.webp', 'Colton', null, 'colton', 0),
  ('team', 'team/dave.webp', 'Dave', null, 'dave', 0),
  ('team', 'team/gunner.jpg', 'Gunner', null, 'gunner', 0),
  ('team', 'team/owen.webp', 'Owen', null, 'owen', 0),
  ('team', 'team/austin.webp', 'Austin', null, 'austin', 0),
  ('team', 'team/richard.jpg', 'Richard', null, 'richard', 0)
on conflict (category, storage_path) do nothing;
