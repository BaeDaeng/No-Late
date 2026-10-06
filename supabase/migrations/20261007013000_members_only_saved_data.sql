drop policy if exists "settings own" on public.user_settings;
drop policy if exists "trips own" on public.saved_trips;

create policy "member settings own" on public.user_settings
  for all using (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

create policy "member trips own" on public.saved_trips
  for all using (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
