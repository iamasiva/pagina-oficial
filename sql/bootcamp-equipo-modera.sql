-- Moderadores del chat del bootcamp sin ser administradores del sitio (3 nov 2026).
-- Un miembro del equipo de ensayo con modera = true recibe el rol admin en la sala del chat:
-- puede usar bootcamp-preguntas.html (marcar respondidas, destacar, borrar) y el panel de
-- moderación de bootcamp-clase.html. No le da acceso a la consola ni a nada más del sitio.
-- La corre Sergio en el editor SQL de Supabase. Idempotente.
alter table public.bootcamp_equipo add column if not exists modera boolean not null default false;

-- La cuenta bootcampgemini (la del computador de transmisión) modera.
update public.bootcamp_equipo set modera = true
 where product_id = '6c01d354-e05d-47be-a6d6-3075abcc16d3' and email = 'bootcampgemini@gmail.com';
