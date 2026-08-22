-- Atribución para la API de Conversiones de Meta (CAPI).
-- Corrido por Sergio el 2026-08-22 (success). Queda aquí como registro.
-- fbp/fbc: cookies del píxel de Meta capturadas al iniciar el pago.
-- ua_navegador/ip_cliente: contexto del navegador del comprador (los pide Meta
-- para el matching). meta_enviado: candado contra envíos duplicados del webhook.
alter table public.purchases
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists ua_navegador text,
  add column if not exists ip_cliente text,
  add column if not exists meta_enviado boolean default false;
