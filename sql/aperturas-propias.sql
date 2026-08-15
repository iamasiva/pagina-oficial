-- "Visto" en las cards: cada usuario necesita LEER sus propias aperturas
-- (hoy solo el admin puede leerlas). Sin esto el badge no aparece.
-- Correr completo en el editor SQL de Supabase.

create policy "leer aperturas propias" on public.aperturas
  for select to authenticated
  using (user_id = auth.uid());
