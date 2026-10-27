-- Bootcamp Gemini de 0 a 100: equipo de ensayo.
-- Correos que entran al área del bootcamp y ven la transmisión y el chat en
-- cualquier estado de la clase (con el link de ensayo), sin comprar y sin ser
-- administradores. La lista se maneja desde bootcamp-admin.html ("Equipo de
-- ensayo"); el día real no hace falta tocarla: la clase se abre a todos los
-- compradores al pasar a "Sala abierta" o "En vivo".
-- DDL: la corre Sergio en el editor SQL de Supabase. Idempotente.

create table if not exists public.bootcamp_equipo (
  product_id uuid not null references public.products(id) on delete cascade,
  email      text not null,
  nota       text,
  creado_en  timestamptz not null default now(),
  primary key (product_id, email),
  check (email = lower(email))
);

alter table public.bootcamp_equipo enable row level security;

-- La lista de correos es privada: solo admin la lee y la edita.
drop policy if exists "equipo bootcamp: admin" on public.bootcamp_equipo;
create policy "equipo bootcamp: admin" on public.bootcamp_equipo
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

grant select, insert, update, delete on public.bootcamp_equipo to authenticated;

-- ¿El usuario con sesión está en el equipo de ensayo de este producto?
-- Responde sí o no sin exponer la lista (security definer).
create or replace function public.bootcamp_soy_equipo(p_product uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bootcamp_equipo e
    where e.product_id = p_product
      and e.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.bootcamp_soy_equipo(uuid) from public;
grant execute on function public.bootcamp_soy_equipo(uuid) to authenticated;
