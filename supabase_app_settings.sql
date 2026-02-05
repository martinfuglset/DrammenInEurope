  -- =============================================================================
  -- App settings table for Supabase (participant view visibility and future keys)
  -- Run this in Supabase Dashboard → SQL Editor to enable the feature.
  -- Safe to run multiple times (idempotent).
  -- =============================================================================

  -- Table: key-value store for app config (e.g. participant_hidden_sections)
  create table if not exists app_settings (
    key text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamptz default now()
  );

  -- RLS
  alter table app_settings enable row level security;

  -- Policy: allow all operations (anon/service role used by the app)
  drop policy if exists "Enable all access for app_settings" on app_settings;
  create policy "Enable all access for app_settings"
    on app_settings for all
    using (true)
    with check (true);

  -- Optional: insert default so the key exists (empty array = nothing hidden)
  insert into app_settings (key, value, updated_at)
  values ('participant_hidden_sections', '[]'::jsonb, now())
  on conflict (key) do update set updated_at = now();
