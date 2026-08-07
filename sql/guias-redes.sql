-- ═══ Links de redes por guía (Instagram / YouTube / TikTok) ═══
-- Correr en el editor SQL de Supabase. Columnas opcionales en guides:
-- el admin las llena y el popup del catálogo las muestra bajo "Ver recurso".

alter table public.guides
  add column if not exists link_instagram text,
  add column if not exists link_youtube text,
  add column if not exists link_tiktok text;
